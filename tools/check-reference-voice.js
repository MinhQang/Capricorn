const {spawn}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),windowsHide:true,env:{...process.env,CAPRI_NO_LAUNCH:'1',CAPRI_MANAGED:'1',CAPRI_DATA_DIR:path.join(__dirname,'..','.cache','reference-voice-check')},stdio:['pipe','pipe','pipe']});
 try{
  const base=await new Promise((resolve,reject)=>{let text='';child.stdout.on('data',c=>{text+=c;const m=text.match(/http:\/\/127\.0\.0\.1:\d+/);if(m)resolve(m[0]);});child.on('error',reject);child.on('exit',code=>reject(Error('Server exit '+code)));});
  const html=await(await fetch(base+'/pet')).text(),token=html.match(/name="capri-token" content="([^"]+)"/)[1];
  const call=async(route,body)=>{const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json','X-Capri-Token':token},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(JSON.stringify(data));return data;};
  const text='Capri online. Pick a target, and let us get moving.';
  let at=Date.now();const speech=await call('speech/synthesize',{text,voice:'capri',pitch:3,speed:120,layers:true});const ttsMs=Date.now()-at;assert.equal(speech.profile,'capri');assert.equal(speech.sampleRate,24000);const wav=Buffer.from(speech.audio,'base64');assert.equal(wav.toString('ascii',0,4),'RIFF');fs.writeFileSync(path.join(__dirname,'..','.cache','capri-tuned-voice.wav'),wav);
  at=Date.now();const transcript=await call('speech/transcribe',{audio:speech.audio});assert.match(transcript.text.toLowerCase(),/target/);
  console.log(JSON.stringify({voice:'verified repository synthetic speaker 53',ttsMs,sttMs:Date.now()-at,bytes:wav.length,transcript:transcript.text,sample:'.cache/capri-tuned-voice.wav'}));
 }finally{child.stdin.end();if(child.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},5000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}
})().catch(error=>{console.error(error);process.exitCode=1;});
