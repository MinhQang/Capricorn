const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {randomUUID} = require('node:crypto');
const {createMemory}=require('./lib/memory');
const persona=require('./lib/persona');
const {createSpeech}=require('./lib/speech');
const actions=require('./lib/actions').createActions();
const root = path.join(__dirname, 'public');
const dataDir = require('./lib/data-directory').dataDirectory();
fs.mkdirSync(dataDir, {recursive:true});
const db = path.join(dataDir, 'tasks.json');
const memory=createMemory(path.join(dataDir,'memory.sqlite'));
const speech=createSpeech(__dirname);
const preferences=require('./lib/preferences').createPreferences(dataDir);
let chatBusy=false;
const ollamaBase=process.env.CAPRI_OLLAMA_URL||'http://127.0.0.1:11434';
const setup=require('./lib/setup').createSetup({base:ollamaBase,executable:process.env.CAPRI_OLLAMA_EXE,dataDir,preferences,speech});
if(new URL(ollamaBase).hostname!=='127.0.0.1')throw Error('Ollama must run on local loopback.');
const computer=require('./lib/computer').createComputer({actions,ollamaBase,preferences,auditFile:path.join(dataDir,'computer-actions.ndjson')});
const tags=require('./lib/commands').createCommands({actions,computer,memory,isBusy:()=>chatBusy});
const {command}=require('./lib/intent-router').createIntentRouter({actions,computer,tags,base:ollamaBase,preferences,onTrace:entry=>console.log('Intent: '+JSON.stringify(entry))});
let tasks = fs.existsSync(db) ? JSON.parse(fs.readFileSync(db, 'utf8')) : [];
const token = randomUUID();
const apps = {notepad:'notepad.exe',calculator:'calc.exe',explorer:'explorer.exe'};
function save(){const temp=db+'.tmp';fs.writeFileSync(temp,JSON.stringify(tasks,null,2));fs.renameSync(temp,db);}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
async function body(req){let s='';const limit=req.url.startsWith('/api/speech/')?8000000:65536;for await(const c of req){s+=c;if(s.length>limit)throw Error('Request too large.');}return JSON.parse(s||'{}');}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.headers.host!==`127.0.0.1:${server.address().port}`)return json(res,403,{error:'Host không hợp lệ'});
  if(url.pathname.startsWith('/api/')){
   if(req.headers['x-capri-token']!==token)return json(res,403,{error:'Phiên không hợp lệ'});
   if(req.method==='GET'&&url.pathname==='/api/commands')return json(res,200,await tags.suggestions(url.searchParams.get('apps')==='1'));
   if(req.method==='GET'&&url.pathname==='/api/setup')return json(res,200,await setup.status());
   if(req.method==='GET'&&url.pathname==='/api/preferences')return json(res,200,preferences.get());
   if(req.method==='GET'&&url.pathname==='/api/computer/status')return json(res,200,computer.status(url.searchParams.get('id'))||{status:'waiting',steps:[]});
   if(req.method==='GET'&&url.pathname==='/api/tasks')return json(res,200,tasks);
   if(req.method==='GET'&&url.pathname==='/api/memories')return json(res,200,memory.list());
   if(req.method==='GET'&&url.pathname==='/api/history')return json(res,200,memory.history());
   if(req.method==='GET'&&url.pathname==='/api/status'){
    let models=[],connected=false;
    try{const r=await fetch(ollamaBase+'/api/tags',{signal:AbortSignal.timeout(2000)});if(r.ok){connected=true;models=(await r.json()).models.map(m=>m.name).filter(m=>!m.includes(':cloud'));}}catch{}
    return json(res,200,{ollama:connected,models,defaultModel:'qwen3:1.7b',speech:speech.status(),offlineOnly:true});
   }
   const b=await body(req);
   if(req.method==='POST'&&url.pathname==='/api/setup')return json(res,202,await setup.pull(b.model));
   if(req.method==='PATCH'&&url.pathname==='/api/preferences')return json(res,200,preferences.patch(b));
   if(req.method==='POST'&&url.pathname==='/api/computer/stop')return json(res,200,computer.stop(b.id));
   if(req.method==='POST'&&url.pathname==='/api/memories')return json(res,201,memory.add(b.text));
   if(req.method==='DELETE'&&url.pathname.startsWith('/api/memories/')){if(chatBusy)throw Error('Wait for the current reply before changing memory.');memory.remove(url.pathname.split('/').pop());return json(res,200,{ok:true});}
   if(req.method==='DELETE'&&url.pathname==='/api/history'){if(chatBusy)throw Error('Wait for the current reply before clearing history.');memory.clearHistory();return json(res,200,{ok:true});}
   if(req.method==='POST'&&url.pathname==='/api/speech/transcribe')return json(res,200,await speech.call('/stt',b));
   if(req.method==='POST'&&url.pathname==='/api/speech/synthesize')return json(res,200,await speech.call('/tts',b));
   if(req.method==='POST'&&url.pathname==='/api/tasks'){
    if(typeof b.title!=='string'||!b.title.trim()||b.title.length>500)throw Error('Tên công việc cần từ 1–500 ký tự');
    if(b.due&&!Number.isFinite(Date.parse(b.due)))throw Error('Hạn không hợp lệ');
    const task={id:randomUUID(),title:b.title.trim(),due:b.due||null,done:false,created:new Date().toISOString()};tasks.push(task);save();return json(res,201,task);
   }
   if(req.method==='PATCH'&&url.pathname.startsWith('/api/tasks/')){const t=tasks.find(t=>t.id===url.pathname.split('/').pop());if(!t)return json(res,404,{error:'Không tìm thấy việc'});if(typeof b.done!=='boolean')throw Error('Trạng thái không hợp lệ');t.done=b.done;save();return json(res,200,t);}
   if(req.method==='DELETE'&&url.pathname.startsWith('/api/tasks/')){tasks=tasks.filter(t=>t.id!==url.pathname.split('/').pop());save();return json(res,200,{ok:true});}
   if(req.method==='POST'&&url.pathname==='/api/open'){await actions.open(b.target);return json(res,200,{ok:true});}
   if(req.method==='POST'&&url.pathname==='/api/command'){
    if(typeof b.message!=='string'||b.message.length>2000)throw Error('Invalid command.');
    const result=await command(b.message,b.jobId);if(result.handled&&!result.clearedHistory)memory.turn(b.message,result.reply);return json(res,200,result);
   }
   if(req.method==='POST'&&url.pathname==='/api/chat'){
    if(typeof b.message!=='string'||!b.message.trim()||b.message.length>2000)throw Error('Message must contain 1–2000 characters.');
    const model=b.model||'qwen3:1.7b';
    if(!/^qwen3:(?:1\.7b|0\.6b)$/.test(model))throw Error('Use qwen3:1.7b or qwen3:0.6b for this local build.');
    if(chatBusy)return json(res,409,{error:'Capri is already answering. Please wait.'});
    const action=await command(b.message,b.jobId);if(action.handled){if(!action.clearedHistory)memory.turn(b.message,action.reply);return json(res,200,action);}
    const remember=b.message.match(/^remember(?: that)?\s*:?\s+(.+)$/i);
    if(remember){const item=memory.add(remember[1]);memory.turn(b.message,"Saved that preference locally.");return json(res,200,{reply:"Got it. I've saved that locally. You can change or delete it in Memory.",savedMemory:item});}
    chatBusy=true;
    try{
     const started=Date.now();
     const context=memory.context(b.message);
     const reference={recalledConversation:context.recalled,memories:memory.relevant(b.message),tasks:tasks.filter(t=>!t.done).slice(0,6).map(t=>({title:t.title.slice(0,100),due:t.due}))};
     const {reply,retried}=await require('./lib/chat').answer({base:ollamaBase,model,message:b.message,context,reference,persona});
     memory.turn(b.message,reply);return json(res,200,{reply,retried,elapsedMs:Date.now()-started});
    }finally{chatBusy=false;}
   }
   return json(res,404,{error:'Không có chức năng này'});
  }
  if(req.method!=='GET')return json(res,405,{error:'Method không hỗ trợ'});
  if(/^\/assets\/lachy\/(?:manifest\.json|[a-z_]+\.png)$/.test(url.pathname)||/^\/assets\/mochi\/[a-z0-9-]+\.(?:png|webp)$/.test(url.pathname)||['/assets/capri-body.webp','/assets/capri-faces.png'].includes(url.pathname)){
   const assetPath=path.join(root,url.pathname.slice(1));if(!fs.existsSync(assetPath))return json(res,404,{error:'Motion asset unavailable.'});const asset=fs.readFileSync(assetPath);res.writeHead(200,{'Content-Type':url.pathname.endsWith('.json')?'application/json':url.pathname.endsWith('.png')?'image/png':'image/webp','Cache-Control':'no-cache'});return res.end(asset);
  }
  const file={'/':'index.html','/setup':'setup.html','/setup.js':'setup.js','/setup.css':'setup.css','/intro':'intro.html','/intro.css':'intro.css','/intro.js':'intro.js','/intro-flow.js':'intro-flow.js','/pet':'pet.html','/settings':'settings.html','/settings.js':'settings.js','/emote-catalog.js':'emote-catalog.js','/preferences.js':'preferences.js','/commands.js':'commands.js','/commands.css':'commands.css','/pet.js':'pet.js','/popup.css':'popup.css','/app.js':'app.js','/motion.js':'motion.js','/sprite-player.js':'sprite-player.js','/sprite-timing.js':'sprite-timing.js','/voice-activity.js':'voice-activity.js','/voice-chat.js':'voice-chat.js','/companion.js':'companion.js','/companion.css':'companion.css','/style.css':'style.css'}[url.pathname];
  if(!file)return json(res,404,{error:'Không tìm thấy'});
  let content=fs.readFileSync(path.join(root,file),'utf8');if(file==='intro.html'||file==='index.html'||file==='pet.html'||file==='settings.html'||file==='setup.html')content=content.replace('__TOKEN__',token).replace('<body>',process.env.CAPRI_MANAGED?'<body data-desktop="true">':'<body>');
  res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'",'Cache-Control':'no-store'});res.end(content);
 }catch(e){json(res,400,{error:e.cause?.code==='ECONNREFUSED'?'Ollama is not running. Start Ollama and check Settings.':e.message});}
});
process.on('exit',()=>{speech.stop();setup.stop();});
function shutdown(){setup.stop();speech.stop();memory.close();server.close();process.exit(0);}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,shutdown);
if(process.env.CAPRI_MANAGED){process.stdin.resume();process.stdin.on('end',shutdown);}
server.listen(Number(process.env.PORT||0),'127.0.0.1',()=>{
 const url=`http://127.0.0.1:${server.address().port}`;console.log('Capri: '+url);
 if(process.platform==='win32'&&!process.env.CAPRI_NO_LAUNCH){const edge=path.join(process.env['ProgramFiles(x86)']||'C:\\Program Files (x86)','Microsoft','Edge','Application','msedge.exe');const child=fs.existsSync(edge)?spawn(edge,[`--app=${url}`],{stdio:'ignore'}):spawn('explorer.exe',[url],{stdio:'ignore'});child.on('error',e=>console.error(e.message));}
});
