const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
test('API authentication, task persistence, validation and action allowlist',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'capri-test-'));
 let child;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:__dirname,env:{...process.env,CAPRI_DATA_DIR:dir,CAPRI_NO_LAUNCH:'1',PORT:'0'},stdio:['ignore','pipe','pipe']});return await new Promise((resolve,reject)=>{let output='';child.stdout.on('data',c=>{output+=c;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m)resolve(m[0]);});child.once('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)));});}
 async function stop(){if(child.exitCode!==null)return;await new Promise(resolve=>{child.once('exit',resolve);child.kill();});}
 try{let base=await start();let html=await(await fetch(base)).text();let token=html.match(/name="capri-token" content="([^"]+)"/)[1];
 const request=(route,method='GET',body)=>fetch(base+'/api/'+route,{method,headers:{'X-Capri-Token':token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 assert.equal((await fetch(base+'/api/tasks')).status,403);
 assert.equal((await request('tasks','POST',{title:''})).status,400);
 const created=await(await request('tasks','POST',{title:'Kiểm tra',due:new Date().toISOString()})).json();assert.ok(created.id);
 assert.equal((await request('open','POST',{target:'cmd.exe'})).status,400);
 await request('tasks/'+created.id,'PATCH',{done:true});
 await stop();base=await start();html=await(await fetch(base)).text();token=html.match(/name="capri-token" content="([^"]+)"/)[1];
 const saved=await(await request('tasks')).json();assert.equal(saved[0].title,'Kiểm tra');assert.equal(saved[0].done,true);
 await request('tasks/'+created.id,'DELETE',{});assert.deepEqual(await(await request('tasks')).json(),[]);
 }finally{if(child)await stop();fs.rmSync(dir,{recursive:true,force:true});}
});
