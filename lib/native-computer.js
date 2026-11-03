const {spawn}=require('node:child_process'),path=require('node:path');
function native(input,signal){return new Promise((resolve,reject)=>{
 const child=spawn(path.join(process.env.SystemRoot||'C:/Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'..','desktop','computer-actions.ps1')],{windowsHide:true,stdio:['pipe','pipe','pipe']});let output='',error='';
 const timeout=setTimeout(()=>{child.kill();reject(Error('Windows action timed out.'));},15000);const abort=()=>{child.kill();reject(Error('Stopped.'));};signal?.addEventListener('abort',abort,{once:true});
 child.stdout.on('data',c=>{output+=c;if(output.length>1000000)child.kill();});child.stderr.on('data',c=>error+=c);
 child.on('error',finish);child.on('close',code=>{if(code!==0)return finish(Error(error.trim()||'Windows action failed.'));try{finish(null,JSON.parse(output.replace(/^\uFEFF/,'')));}catch{finish(Error('Windows did not return an action result.'));}});
 function finish(err,value){clearTimeout(timeout);signal?.removeEventListener('abort',abort);err?reject(err):resolve(value);}child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(input));if(signal?.aborted)abort();
});}
module.exports={native};
