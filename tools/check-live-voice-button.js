const {_electron:electron}=require('@playwright/test');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const env={...process.env,CAPRI_SKIP_INTRO:'1',CAPRI_NODE_PATH:process.execPath,CAPRI_DATA_DIR:path.join(__dirname,'..','.cache','live-voice-button')};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:[path.join(__dirname,'..','desktop/main.js')],env,timeout:45000});
 try{
  const page=await app.firstWindow(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.waitForSelector('#test-voice',{state:'attached'});
  await page.evaluate(()=>{window.voiceEvents=[];for(const name of ['capri:speaking','capri:audio-level'])window.addEventListener(name,e=>voiceEvents.push({name,value:e.detail}));});
  let requests=0;page.on('request',r=>{if(r.url().endsWith('/api/speech/synthesize'))requests++;});
  page.on('response',async r=>{if(r.url().endsWith('/api/speech/synthesize'))console.log('Synthesis response:',r.status());});
  const opened=app.waitForEvent('window');await page.locator('#settings-open').click();const settings=await opened;await settings.waitForFunction(()=>document.body.dataset.ready==='true');await settings.locator('#test-voice').click();
  await page.waitForTimeout(500);console.log(JSON.stringify(await settings.evaluate(()=>({status:document.querySelector('#voice-test-status').textContent,button:document.querySelector('#test-voice').textContent,buttonDisabled:document.querySelector('#test-voice').disabled,visible:document.querySelector('#voice-test-status').getBoundingClientRect().toJSON()}))));
  await page.waitForFunction(()=>voiceEvents.some(e=>e.name==='capri:speaking'&&e.value===true),{},{timeout:90000});
  assert.equal(await settings.locator('#test-voice').isDisabled(),true);assert.ok(await settings.locator('#voice-test-status').isVisible());await settings.evaluate(()=>document.querySelector('#test-voice').click());
  await page.waitForFunction(()=>voiceEvents.some(e=>e.name==='capri:audio-level'&&e.value>.001));await page.waitForTimeout(500);
  const sound=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().map(w=>({muted:w.webContents.isAudioMuted(),audible:w.webContents.isCurrentlyAudible()})));console.log(JSON.stringify({playback:sound}));
  await page.waitForFunction(()=>document.querySelector('#voice-status').textContent.startsWith('Finished speaking'),{},{timeout:30000});
  assert.equal(requests,1);assert.equal(await page.locator('#test-voice').isDisabled(),false);
  const events=await page.evaluate(()=>voiceEvents);assert.ok(events.some(e=>e.name==='capri:audio-level'&&e.value>.001));assert.deepEqual(errors,[]);console.log('PASS: real button -> local TTS -> decoded non-silent audio -> playback ended.');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
