const fs=require('node:fs');
(async()=>{
 const base=process.argv[2];if(!base)throw Error('Pass the local Capri URL.');
 const page=await(await fetch(base)).text();const token=page.match(/name="capri-token" content="([^"]+)"/)[1];
 const call=async(route,body)=>{const r=await fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json','X-Capri-Token':token},body:JSON.stringify(body)});const value=await r.json();if(!r.ok)throw Error(JSON.stringify(value));return value;};
 let started=Date.now();const audio=await call('speech/synthesize',{text:'Capri online. Pick a target, and let us get moving.',voice:'af_bella'});
 const bytes=Buffer.from(audio.audio,'base64');fs.writeFileSync('.cache/voice-check.wav',bytes);
 console.log(JSON.stringify({ttsMs:Date.now()-started,bytes:bytes.length,sampleRate:audio.sampleRate}));
 started=Date.now();const transcript=await call('speech/transcribe',{audio:audio.audio});console.log(JSON.stringify({sttMs:Date.now()-started,text:transcript.text}));
 if(!transcript.text.toLowerCase().includes('target'))throw Error('Speech roundtrip did not recognize the expected phrase.');
})().catch(e=>{console.error(e);process.exitCode=1;});
