const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http');
const {lexical,checked,deviceAllowed}=require('./lib/path-policy'),{createComputer,validate,direct,pathsIn,isIntent}=require('./lib/computer');
test('C exclusion covers alternate syntax, devices, streams and unrequested operations',()=>{
 for(const value of ['C:\\Users','c:/Windows','\\\\?\\C:\\Windows','\\\\server\\share','E:relative','E:\\a.txt:secret','E:\\NUL.txt','E:\\foo.'])assert.throws(()=>lexical(value,{root:true}));
 assert.equal(lexical('E:/Project/../Notes',{root:true}),'E:\\Notes');assert.throws(()=>lexical('E:\\'));
 const mapping={'C:':'\\Device\\HarddiskVolume2','E:':'\\Device\\HarddiskVolume4','G:':'\\Device\\Volume{example}','Z:':'\\??\\C:\\Windows','X:':'\\Device\\HarddiskVolume2'};assert.doesNotThrow(()=>deviceAllowed('E:\\Work',mapping));assert.doesNotThrow(()=>deviceAllowed('G:\\Work',mapping));assert.throws(()=>deviceAllowed('Z:\\Work',mapping));assert.throws(()=>deviceAllowed('X:\\Work',mapping));
 assert.deepEqual(pathsIn('copy E:\\a.txt to D:\\b.txt'),['E:\\a.txt','D:\\b.txt']);
 assert.throws(()=>validate({steps:[{op:'trash',path:'E:\\Work\\a.txt'}]},'list files in E:\\Work'));assert.throws(()=>validate({steps:[{op:'read',path:'D:\\private.txt'}]},'read file E:\\notes.txt'));
 assert.throws(()=>validate({steps:[{op:'write',path:'E:\\a.txt',text:'invented'}]},'write hello to E:\\a.txt'));
 assert.equal(isIntent('Do not delete E:\\Work'),false);assert.equal(isIntent('Tell me how to delete files'),false);assert.equal(isIntent('minimize chrome'),true);
 assert.equal(isIntent('make me laugh'),false);assert.equal(isIntent('read my mind'),false);assert.equal(isIntent('show open windows'),true);
 assert.equal(direct('delete report.txt in E:\\Work'),null);assert.equal(direct('create a folder named Notes in E:\\Work'),null);assert.deepEqual(direct('create folder "E:\\Work\\Notes"').steps,[{op:'mkdir',path:'E:\\Work\\Notes'}]);
});
test('checked file tools execute real plans, reject C/junctions and never overwrite',{skip:process.platform!=='win32'},async()=>{
 const base=await fs.mkdtemp(path.join(__dirname,'.cache','computer-'));let nextPlan,calls=0,nativeCalls=[];
 const model=http.createServer(async(req,res)=>{let body='';for await(const c of req)body+=c;calls++;const request=JSON.parse(body);assert.equal(request.think,false);if(nextPlan==='pending')return;res.end(JSON.stringify({message:{content:JSON.stringify(nextPlan)}}));});await new Promise(r=>model.listen(0,'127.0.0.1',r));
 const engine=createComputer({actions:{open:async()=>{},openUrl:async()=>{},openDocument:async()=>{}},ollamaBase:'http://127.0.0.1:'+model.address().port,preferences:{get:()=>({model:'qwen3:1.7b'})},nativeAction:async step=>{nativeCalls.push(step);return {message:'Done.'};}});
 try{
  const folder=path.join(base,'Notes'),file=path.join(folder,'hello.txt'),copy=path.join(folder,'copy.txt'),renamed=path.join(folder,'renamed.txt');
  assert.equal((await engine.command('create folder "'+folder+'"')).ok,true);assert.equal(calls,0);
  nextPlan={steps:[{op:'write',path:file,text:'hello'}]};assert.equal((await engine.command('write hello to "'+file+'"')).ok,true);assert.equal(await fs.readFile(file,'utf8'),'hello');
  assert.equal((await engine.command('write hello to "'+file+'"')).ok,false);assert.equal(await fs.readFile(file,'utf8'),'hello');
  nextPlan={steps:[{op:'copy',source:file,destination:copy}]};assert.equal((await engine.command(`copy "${file}" to "${copy}"`)).ok,true);assert.equal(await fs.readFile(copy,'utf8'),'hello');
  nextPlan={steps:[{op:'move',source:copy,destination:renamed}]};assert.equal((await engine.command(`rename "${copy}" to "${renamed}"`)).ok,true);assert.equal(await fs.readFile(renamed,'utf8'),'hello');
  const listed=await engine.command(`list files in "${folder}"`);assert.match(listed.reply,/renamed.txt/);assert.equal((await engine.command(`read file "${file}"`)).reply,'hello');
  const denied=await engine.command('read file "C:\\Windows\\win.ini"');assert.equal(denied.ok,false);assert.match(denied.reply,/excluded/);
  const link=path.join(base,'junction');await fs.symlink(process.env.SystemRoot||'C:\\Windows',link,'junction');await assert.rejects(checked(path.join(link,'win.ini')),/excluded|junction/i);
  assert.equal((await engine.command('list files in "'+link+'"')).ok,false);
  const never=path.join(base,'NeverCreated');nextPlan={steps:[{op:'mkdir',path:never},{op:'read',path:'C:\\Windows\\win.ini'}]};assert.equal((await engine.command(`create folder "${never}" and read C:\\Windows\\win.ini`)).ok,false);await assert.rejects(fs.stat(never));
  const mutation=await engine.command('trash "'+renamed+'"');assert.equal(mutation.ok,true);assert.equal(nativeCalls.at(-1).op,'trash');
  nextPlan='pending';const pending=engine.command('copy "'+file+'" to "'+path.join(folder,'not-copied.txt')+'"','stop-test');await new Promise(r=>setTimeout(r,100));engine.stop('stop-test');assert.equal((await pending).ok,false);assert.equal(engine.status('stop-test').status,'error');await assert.rejects(fs.stat(path.join(folder,'not-copied.txt')));
 }finally{await new Promise(r=>model.close(r));const link=path.join(base,'junction');try{await fs.unlink(link);}catch{}assert.ok(path.resolve(base).startsWith(path.resolve(__dirname,'.cache')+path.sep));await fs.rm(base,{recursive:true,force:true});}
});
