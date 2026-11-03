const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');
const models=new Set(['qwen3:1.7b','qwen3:0.6b']);
function createSetup({base,executable,dataDir,preferences,speech,fetcher=fetch,spawnProcess=spawn}){
 let child,starting,downloading,state={phase:'idle',message:'Choose a local chat model.',completed:0,total:0,model:null,error:null},closed=false;
 const owned=Boolean(executable),marker=path.join(dataDir,'setup.json');
 async function ensure(){if(!owned)return;if(starting)return starting;starting=(async()=>{if(!fs.existsSync(executable))throw Error('Bundled AI engine is missing. Reinstall Capricorn.');
 child=spawnProcess(executable,['serve'],{cwd:path.dirname(executable),windowsHide:true,stdio:'ignore',env:{...process.env,OLLAMA_HOST:base,OLLAMA_MODELS:path.join(dataDir,'models'),OLLAMA_NO_CLOUD:'1',OLLAMA_NUM_PARALLEL:'1',OLLAMA_MAX_LOADED_MODELS:'1',OLLAMA_KEEP_ALIVE:'2m',OLLAMA_VULKAN:'0',CUDA_VISIBLE_DEVICES:'-1'}});
 let failed;child.once('error',e=>failed=e);child.once('exit',()=>{if(!closed)failed=Error('Local AI engine stopped. Retry setup or restart Capricorn.');starting=null;});
 for(let i=0;i<100;i++){if(failed)throw failed;try{const r=await fetcher(base+'/api/tags',{signal:AbortSignal.timeout(500)});if(r.ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,200));}throw Error('Local AI engine did not start. Check available disk space and retry.');
 })().catch(error=>{child?.kill();starting=null;throw error;});return starting;}
 async function installed(){await ensure();const r=await fetcher(base+'/api/tags',{signal:AbortSignal.timeout(3000)});if(!r.ok)throw Error('Local AI engine unavailable.');return (await r.json()).models?.map(m=>m.name)||[];}
 async function status(){let available=[],engineError;try{available=await installed();}catch(e){engineError=e.message;}const selected=preferences.get().model;return {...state,available,ready:!downloading&&state.phase!=='error'&&(!state.model||state.model===selected)&&available.includes(selected)&&speech.status().installed!==false&&speech.status().ttsReady&&speech.status().capriVoiceReady&&speech.status().sttReady,selected,speech:speech.status(),engineError,automaticModel:models.has(process.env.CAPRI_INSTALL_MODEL)?process.env.CAPRI_INSTALL_MODEL:null};}
 async function pull(model){if(!models.has(model))throw Error('Choose one of the supported local models.');if(downloading)return {accepted:false,...state};
 state={phase:'downloading',message:'Starting model download...',completed:0,total:0,model,error:null};
 downloading=(async()=>{await ensure();const r=await fetcher(base+'/api/pull',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,stream:true}),signal:AbortSignal.timeout(4*60*60*1000)});if(!r.ok)throw Error('Model download failed. Check your internet connection and retry.');let pending='';const decoder=new TextDecoder();
 function progress(line){if(!line.trim())return;const item=JSON.parse(line);if(item.error)throw Error(item.error);state.message=String(item.status||'Downloading...').slice(0,180);state.completed=Number(item.completed)||0;state.total=Number(item.total)||0;}
 for await(const bytes of r.body){pending+=decoder.decode(bytes,{stream:true});if(pending.length>1000000)throw Error('Invalid model download response.');const lines=pending.split('\n');pending=lines.pop();for(const line of lines)progress(line);}pending+=decoder.decode();progress(pending);
 const available=await installed();if(!available.includes(model))throw Error('Download ended before the model was ready. Retry to resume.');preferences.patch({model});fs.writeFileSync(marker,JSON.stringify({version:1,model,completed:new Date().toISOString()}));state={...state,phase:'done',message:'Chat model ready. Speech is included.',error:null};
 })().catch(e=>{state={...state,phase:'error',message:'Download paused. Retry to resume.',error:e.message};}).finally(()=>{downloading=null;});return {accepted:true,...state};}
 function stop(){if(closed)return;closed=true;if(child?.pid){if(process.platform==='win32')spawnProcess('taskkill.exe',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'}).on('error',()=>{});else child.kill();}}
 return {ensure,status,pull,stop};
}
module.exports={createSetup};
