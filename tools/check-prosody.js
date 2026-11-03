const {spawn}=require('node:child_process');const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
function seconds(wav){let offset=12;while(offset+8<=wav.length){const type=wav.toString('ascii',offset,offset+4),size=wav.readUInt32LE(offset+4);if(type==='data')return size/(24000*2);offset+=8+size+(size%2);}throw Error('Missing PCM samples.');}
(async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),windowsHide:true,env:{...process.env,CAPRI_NO_LAUNCH:'1',CAPRI_MANAGED:'1',CAPRI_DATA_DIR:path.join(__dirname,'..','.cache','prosody-check')},stdio:['pipe','pipe','pipe']});
 try{
  const base=await new Promise((resolve,reject)=>{let output='';child.stdout.on('data',c=>{output+=c;const m=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(m)resolve(m[0]);});child.on('error',reject);child.on('exit',code=>reject(Error('Server exit '+code)));});
  const html=await(await fetch(base+'/pet')).text(),token=html.match(/name="capri-token" content="([^"]+)"/)[1];
  const results=[];
  for(const [name,speed,delivery] of [['fast-reference',132,'plain'],['playful',95,'playful'],['warm',95,'warm'],['mischievous',95,'mischievous'],['mischief-demo',95,'mischievous']]){
   const started=Date.now(),response=await fetch(base+'/api/speech/synthesize',{method:'POST',headers:{'Content-Type':'application/json','X-Capri-Token':token},body:JSON.stringify({text:name==='mischief-demo'?"There you are! Thought you could sneak past me? Come on, let's make some trouble. And now it's your turn.":'Well played. What are we doing next?',voice:'capri',pitch:3,speed,layers:true,delivery})});const result=await response.json();assert.equal(response.ok,true,JSON.stringify(result));assert.equal(result.delivery,delivery);assert.equal(result.phrases,name==='mischief-demo'?3:delivery==='plain'?1:2);
   const wav=Buffer.from(result.audio,'base64');fs.writeFileSync(path.join(__dirname,'..','.cache','capri-'+name+'.wav'),wav);results.push({name,seconds:seconds(wav),ttsMs:Date.now()-started,signalEvents:result.signalEvents});
  }
  assert.ok(results[1].seconds>results[0].seconds*1.15);assert.ok(results[2].seconds>results[1].seconds);
  console.log(JSON.stringify({sameSyntheticVoice:true,results,samples:'.cache/capri-{playful,warm}.wav'}));
 }finally{child.stdin.end();if(child.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>{child.kill();resolve();},5000);child.once('exit',()=>{clearTimeout(timer);resolve();});});}
})().catch(error=>{console.error(error);process.exitCode=1;});
