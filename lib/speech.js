const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');const {randomUUID}=require('node:crypto');
function createSpeech(root){
 let child=null,ready=null,url=null,error=null;const token=randomUUID();
 const python=process.env.CAPRI_PYTHON_PATH||path.join(root,'.tools','speech','Scripts','python.exe');
 function sttReady(){try{const snapshots=path.join(root,'.cache','whisper','models--Systran--faster-whisper-base.en','snapshots');return fs.readdirSync(snapshots).some(name=>['model.bin','config.json','tokenizer.json'].every(file=>fs.existsSync(path.join(snapshots,name,file))));}catch{return false;}}
 const model=path.join(root,'.models','kokoro-v1.0.onnx');
 function start(){if(ready)return ready;if(!fs.existsSync(python))return Promise.reject(Error('Local speech is not installed. Run Setup-Local.cmd.'));
  ready=new Promise((resolve,reject)=>{let settled=false;const timeout=setTimeout(()=>{if(!settled){settled=true;child?.kill();reject(Error('Speech service startup timed out.'));}},30000);
   child=spawn(python,[path.join(root,'speech','worker.py')],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,CAPRI_SPEECH_TOKEN:token,CAPRI_PARENT_PID:String(process.pid),HF_HUB_OFFLINE:'1',ORT_NUM_THREADS:'2',OMP_NUM_THREADS:'2'}});
   let buffer='';child.stdout.on('data',c=>{buffer+=c;const match=buffer.match(/SPEECH_READY (http:\/\/127\.0\.0\.1:\d+)/);if(match&&!settled){settled=true;clearTimeout(timeout);url=match[1];resolve(url);}});
   child.stderr.on('data',c=>{error=String(c).slice(-500);});
   child.on('error',e=>{clearTimeout(timeout);if(!settled){settled=true;reject(e);}ready=null;});
   child.on('exit',()=>{clearTimeout(timeout);url=null;ready=null;if(!settled){settled=true;reject(Error(error||'Speech service stopped.'));}});
  });return ready;
 }
 return {status:()=>({installed:fs.existsSync(python),ttsReady:fs.existsSync(model)&&fs.existsSync(path.join(root,'.models','voices-v1.0.bin')),running:!!url,sttReady:sttReady(),capriVoiceReady:fs.existsSync(path.join(root,'.models','capri-reference.npy'))}),
  async call(route,body){const base=await start();const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json','X-Capri-Speech':token},body:JSON.stringify(body),signal:AbortSignal.timeout(180000)});const value=await r.json();if(!r.ok)throw Error(value.error||'Local speech failed.');return value;},
  stop(){child?.kill();}
 };
}
module.exports={createSpeech};
