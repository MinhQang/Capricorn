const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {idlePlan,frameAt,blinkAt,signalDelay}=require('./public/sprite-timing');const manifest=require('./public/assets/lachy/manifest.json');
test('idle progresses to perch, rest and sleep, and disabling activities keeps the standing loop',()=>{
 assert.equal(idlePlan(0).clip,'idle');assert.equal(idlePlan(18000).clip,'perch');assert.equal(idlePlan(55000).clip,'laydown');assert.equal(idlePlan(110000).clip,'laydown_sleep');assert.equal(idlePlan(200000,false).clip,'idle');
 assert.equal(idlePlan(7000).clip,'idle');assert.equal(idlePlan(13000).clip,'idle');assert.equal(idlePlan(13000,false).clip,'idle');
});
test('digital signal bursts are scheduled between three and seven seconds',()=>{assert.equal(signalDelay(()=>0),3000);assert.equal(signalDelay(()=>1),7000);assert.equal(signalDelay(()=>.5),5000);});
test('resampled sprite loops preserve duration, frame order and a maximum 30 fps',()=>{
 assert.equal(Object.keys(manifest.clips).length,24);
 for(const clip of Object.values(manifest.clips)){
  const data=fs.readFileSync(path.join(__dirname,'public/assets/lachy',clip.file));assert.equal(data.readUInt32BE(16),manifest.width*manifest.columns);assert.equal(data.readUInt32BE(20),manifest.height*Math.ceil(clip.count/manifest.columns));
  assert.ok(clip.fps<=30);if(clip.sourceFrames){assert.equal(clip.sourceFrames.length,clip.count);assert.equal(clip.sourceFrames[0],0);assert.ok(clip.sourceFrames.every((n,i,all)=>n<clip.sourceCount&&(!i||n>=all[i-1])));}
 }
 const perch=manifest.clips.perch;assert.equal(perch.count/perch.fps,2);assert.equal(frameAt(perch,2000),0);assert.equal(frameAt(perch,1000),30);
 assert.equal(frameAt(perch,1000/30),1);assert.equal(frameAt(perch,1000/24,true,12),0);assert.equal(frameAt(perch,1000/12,true,12),2);
 const blink=blinkAt('perch',perch,29,3000);assert.equal(blink.clip,'perch_blink');assert.equal(blinkAt('perch',perch,29,1000),null);
});
