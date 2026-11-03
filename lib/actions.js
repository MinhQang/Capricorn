const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs/promises');
const {fileURLToPath}=require('node:url');
const filePolicy=require('./path-policy');
const powershell=path.join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
function folderIntent(message){
 if(/^(?:[a-z]:[\\/]|[a-z]:$|file:\/\/)/i.test(message.trim()))message='open '+message.trim();
 const match=message.trim().match(/^(?:(?:hey[, ]+)?capri[, ]+)?(?:(?:please |can you |could you |would you |i want you to |i want to |help me |bạn |hãy |vui lòng |giúp tôi )*)(?:open|launch|start|mở|khởi động|bật)\s+(.+)$/i);
 if(!match)return null;
 const value=match[1].trim().replace(/[?!.]+$/,'').replace(/^(?:(?:the|my|this)\s+)?(?:folder|drive|directory|thư mục|ổ đĩa)\s+/i,'').replace(/^(?:my|the|this)\s+(?=["']?(?:[a-z]:|file:\/\/))/i,'').replace(/(?:\s+(?:for me|please|cho tôi|giúp tôi|nhé))+$/i,'').replace(/\s+(?:folder|directory|drive)$/i,'').replace(/^["']|["']$/g,'').trim();
 if(/^file:\/\//i.test(value)){try{return fileURLToPath(value);}catch{return null;}}
 return /^[a-z]:[\\/]/i.test(value)||/^[a-z]:$/i.test(value)?(value.length===2?value+'\\':value):null;
}
function normalize(text){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9 .+-]/g,' ').replace(/\s+/g,' ').trim();}
const aliases={notepad:['notepad','ghi chu'],calculator:['calculator','calc','may tinh','may tinh bo tui'],explorer:['explorer','file explorer','files'],documents:['documents'],downloads:['downloads'],desktop:['desktop'],chrome:['chrome','google chrome'],edge:['edge','microsoft edge'],vscode:['vscode','vs code','visual studio code','visualcode','visual code','code editor'],spotify:['spotify'],discord:['discord'],steam:['steam']};
function launchIntent(message){
 const text=normalize(message).replace(/[.!]+$/,'').trim();
 const match=text.match(/^(?:(?:hey )?capri )?(?:(?:please |can you |could you |would you |i want you to |i would like you to |i d like you to |i want to |help me |ban |hay |vui long |giup toi )*)(?:open up|bring up|open|launch|start|run|mo|khoi dong|bat) (.+)$/);
 if(!match)return null;
 let name=match[1].replace(/^(?:the |my |this |app |application |ung dung |phan mem )+/,'').replace(/(?: for me| please| now| cho toi| giup toi| giup minh| nhe| di| len)+$/g,'').replace(/ (?:app|application|browser)$/,'').trim();
 // A request containing another operation must not be silently reduced to one app.
 if(/\b(and|then|va|roi)\b/.test(name))return {name,compound:true};
 return {name};
}
function resolveTarget(name,catalog=[]){
 const normalized=normalize(name),compact=normalized.replace(/[ ._-]/g,'');for(const [id,names] of Object.entries(aliases))if(names.some(n=>n.replace(/[ ._-]/g,'')===compact))return {id,name:names[0],entry:catalog.find(a=>names.some(n=>n.replace(/[ ._-]/g,'')===normalize(a.Name).replace(/[ ._-]/g,'')))};
 const exact=catalog.filter(a=>normalize(a.Name).replace(/[ ._-]/g,'')===compact);if(exact.length===1)return {id:exact[0].AppID,name:exact[0].Name,entry:exact[0]};
 return null;
}
function run(command,args){return new Promise((resolve,reject)=>{const child=spawn(command,args,{detached:true,stdio:'ignore',shell:false,windowsHide:false});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});}
function createActions({catalog:catalogProvider,launch=run}={}){
 let catalogPromise,catalogUntil=0;
 function catalog(){if(catalogProvider)return Promise.resolve(catalogProvider());if(catalogPromise&&Date.now()<catalogUntil)return catalogPromise;catalogUntil=Date.now()+300000;return catalogPromise=new Promise(resolve=>{
  if(process.platform!=='win32')return resolve([]);
  let output='';const child=spawn(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'..','desktop','app-catalog.ps1')],{windowsHide:true});
  const timer=setTimeout(()=>{child.kill();catalogUntil=0;resolve([]);},20000);child.stdout.on('data',c=>output+=c);child.on('error',()=>{clearTimeout(timer);catalogUntil=0;resolve([]);});child.on('close',()=>{clearTimeout(timer);try{const items=JSON.parse(output.replace(/^\uFEFF/,''));resolve((Array.isArray(items)?items:[items]).filter(a=>typeof a.Name==='string'&&typeof a.AppID==='string'));}catch{catalogUntil=0;resolve([]);}});
 });}
 async function open(target){
  if(typeof target!=='string')throw Error('App name is required.');
  if(/^[a-z]:[\\/]/i.test(target)){
   target=await filePolicy.checked(target,{root:true});
   const info=await fs.stat(target).catch(()=>null);
   if(!info?.isDirectory())throw Error('Local folder not found. Supply an existing folder or drive path.');
   return launch('explorer.exe',[target]);
  }
  const builtins={notepad:'notepad.exe',calculator:'calc.exe',explorer:'explorer.exe'};
  if(Object.hasOwn(builtins,target))return launch(builtins[target],[]);
  if(['documents','downloads','desktop'].includes(target)){const folder=await filePolicy.checked(path.join(process.env.USERPROFILE||'',{documents:'Documents',downloads:'Downloads',desktop:'Desktop'}[target]),{root:true});return launch('explorer.exe',[folder]);}
  if(target==='chrome'||target==='edge'){
   const relative=target==='chrome'?['Google','Chrome','Application','chrome.exe']:['Microsoft','Edge','Application','msedge.exe'];
   for(const base of [process.env.ProgramFiles,process.env['ProgramFiles(x86)'],process.env.LOCALAPPDATA].filter(Boolean)){
    const executable=path.join(base,...relative);
    if(await fs.stat(executable).then(s=>s.isFile()).catch(()=>false))return launch(executable,['--new-window','about:blank']);
   }
  }
  const trustedLocations={vscode:[[process.env.LOCALAPPDATA,'Programs','Microsoft VS Code','Code.exe'],[process.env.ProgramFiles,'Microsoft VS Code','Code.exe']],spotify:[[process.env.APPDATA,'Spotify','Spotify.exe']],steam:[[process.env['ProgramFiles(x86)'],'Steam','steam.exe']]};
  for(const parts of trustedLocations[target]||[]){if(!parts[0])continue;const executable=path.join(...parts);if(await fs.stat(executable).then(s=>s.isFile()).catch(()=>false))return launch(executable,[]);}
  const items=await catalog(),resolved=items.find(a=>a.AppID===target)?{entry:items.find(a=>a.AppID===target)}:resolveTarget(target,items);
  if(!resolved?.entry)throw Error('App not found in the Windows Start menu. Use its installed name, or add its shortcut to Start.');
  const id=resolved.entry.AppID;
  if(/^[a-z]:[\\/].*\.exe$/i.test(id)){if(!await fs.stat(id).then(s=>s.isFile()).catch(()=>false))throw Error('The installed app shortcut points to a missing executable. Repair its Start menu shortcut.');return launch(id,[]);}
  return launch('explorer.exe',['shell:AppsFolder\\'+id]);
 }
 async function command(message){
  const folder=folderIntent(message);
  if(folder){try{await open(folder);return {handled:true,ok:true,reply:'Launch request sent for '+folder+'.',action:{type:'open',target:'explorer',label:folder}};}catch(error){return {handled:true,ok:false,reply:error.message};}}
  const intent=launchIntent(message);if(!intent)return {handled:false};
  if(intent.compound)return {handled:true,ok:false,reply:'Give me one app to open at a time.'};
  const known=resolveTarget(intent.name,[]);const target=known||resolveTarget(intent.name,await catalog());
  if(!target)return {handled:true,ok:false,reply:'I could not find “'+intent.name+'” in the Windows app list. Tell me its exact Start menu name. Nothing was launched.'};
  try{await open(target.id);return {handled:true,ok:true,reply:'Launch request sent for '+target.name+'.',action:{type:'open',target:target.id,label:target.name}};}
  catch(error){return {handled:true,ok:false,reply:'I could not launch '+target.name+'. '+error.message};}
 }
 async function openUrl(value,browser='default'){const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error('Only HTTP/HTTPS URLs are supported.');
  if(!['default','chrome','edge'].includes(browser))throw Error('Unsupported browser.');
  if(browser!=='default'){
   const relative=browser==='chrome'?['Google','Chrome','Application','chrome.exe']:['Microsoft','Edge','Application','msedge.exe'];
   for(const base of [process.env.ProgramFiles,process.env['ProgramFiles(x86)'],process.env.LOCALAPPDATA].filter(Boolean)){const executable=path.join(base,...relative);if(await fs.stat(executable).then(s=>s.isFile()).catch(()=>false))return launch(executable,[url.href]);}
   throw Error('The requested browser is not installed in a recognized location.');
  }
  return launch('explorer.exe',[url.href]);}
 async function searchWeb(query,browser='default'){if(typeof query!=='string'||!query.trim()||query.length>1000)throw Error('Search needs 1-1000 characters.');return openUrl('https://www.google.com/search?q='+encodeURIComponent(query),browser);}
 async function openDocument(value){const full=await filePolicy.checked(value,{root:true});return launch('explorer.exe',[full]);}
 return {open,command,openUrl,searchWeb,openDocument,available:async()=>await catalog()};
}
module.exports={createActions,launchIntent,resolveTarget,folderIntent};
