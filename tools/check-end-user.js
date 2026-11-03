// Real Electron UI + real local model/STT/TTS. Only microphone input is a
// prerecorded audio stream; no API responses or command results are mocked.
const {_electron:electron}=require('@playwright/test');
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const directory=fs.mkdtempSync(path.resolve('.cache/end-user-'));
 const report={directory,checks:[],errors:[],limitations:['Microphone receives prerecorded audio, not a person speaking into the physical device.','Audio playback is measured digitally; physical speaker audibility and character acting require human listening.','Tests the source app, not the existing installer.']};
 const env={...process.env,CAPRI_NODE_PATH:process.execPath,CAPRI_DATA_DIR:directory};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:[path.resolve('desktop/main.js')],env,timeout:45000});
 const electronChild=app.process();
 let page;
 async function check(name,fn){const start=Date.now();try{const detail=await fn();report.checks.push({name,pass:true,ms:Date.now()-start,detail});console.log('PASS',name,JSON.stringify(detail));}catch(error){report.checks.push({name,pass:false,ms:Date.now()-start,error:error.message});console.log('FAIL',name,error.message);if(page)await page.screenshot({path:path.join(directory,'failure-'+report.checks.length+'.png')}).catch(()=>{});}}
 try{
  page=await app.firstWindow();await page.waitForSelector('#toggle-chat',{timeout:30000});
  page.on('pageerror',e=>report.errors.push(e.message));await page.evaluate(()=>window.capriPreferencesReady);
  await check('Startup and opening the compact chat',async()=>{await page.waitForTimeout(3000);await page.locator('#toggle-chat').click();await page.locator('#message').waitFor({state:'visible'});assert.equal(await page.locator('.avatar').isVisible(),true);await page.waitForFunction(()=>{const panel=document.querySelector('#panel').getBoundingClientRect(),stage=document.querySelector('.stage').getBoundingClientRect(),dock=document.querySelector('.companion-dock').getBoundingClientRect();return panel.bottom<=stage.top&&dock.bottom<=innerHeight;});await page.screenshot({path:path.join(directory,'startup.png')});return {title:await page.title(),chatVisible:true};});
  if(process.argv.includes('--quit-only'))return;
  // Mute through the user control for the command matrix; voice is tested below.
  await page.locator('#read-replies').uncheck();
  async function send(text){await page.locator('#message').fill(text);await page.locator('#send').click();await page.waitForFunction(()=>!document.querySelector('#send').disabled,{},{timeout:210000});return {reply:await page.locator('#messages .assistant').last().innerText(),progress:await page.locator('#job-steps').innerText(),timing:await page.locator('#reply-timing').innerText()};}
  for(const [text,pattern] of [['What is 7 plus 8?',/15|fifteen/i],['What is the capital of Japan?',/Tokyo/i]])await check('Chat: '+text,async()=>{const result=await send(text);assert.match(result.reply,pattern);return result;});
  for(const text of ['Could you get Notepad running?','Can you pull up Chrome?','I need to use Visual Studio Code.','Hey Capricorn, open File Explorer.'])await check('Natural request: '+text,async()=>{const result=await send(text);assert.match(result.reply,/Launch request sent/i);assert.match(result.reply,/Its window is right here/i);assert.match(result.progress,/App window located/);await page.screenshot({path:path.join(directory,'app-'+report.checks.length+'.png')});return result;});
  await check('Ambiguous app asks for clarification',async()=>{const result=await send('Open it.');assert.match(result.reply,/Which app/);return result;});
  await check('Missing app reports failure',async()=>{const result=await send('open nonexistent-capricorn-test-app-999');assert.match(result.reply,/could not find/i);assert.doesNotMatch(result.reply,/Launch request sent/);return result;});
  for(const text of ['How do I open Chrome?','Do not open Chrome.'])await check('Non-action: '+text,async()=>{let command;const listener=async response=>{if(response.url().endsWith('/api/command'))command=await response.json();};page.on('response',listener);try{const result=await send(text);assert.equal(command.handled,false);assert.doesNotMatch(result.reply,/Launch request sent/);return result;}finally{page.off('response',listener);}});
  await check('Drive C access stays blocked',async()=>{const result=await send('/list C:\\Windows');assert.match(result.reply,/excluded|forbidden|not allowed|blocked/i);return result;});
  await check('Slash suggestions and fallback',async()=>{await page.locator('#message').fill('/');const options=page.locator('[role="option"]');await options.first().waitFor({state:'visible'});const count=await options.count();assert.ok(count>0);const result=await send('/notepad');assert.match(result.reply,/Launch request sent/i);return {suggestions:count,...result};});
  await check('Settings is separate, can close and retain the character',async()=>{const opened=app.waitForEvent('window');await page.locator('#settings-open').click();const settings=await opened;await settings.waitForLoadState('domcontentloaded');assert.match(settings.url(),/\/settings/);await settings.close();assert.equal(await page.locator('.avatar').isVisible(),true);return {modelStillVisible:true};});
  await check('Text reply speaks and animates the model',async()=>{await page.evaluate(()=>{window.voiceEvidence={started:false,ended:false,peak:0};window.addEventListener('capri:speaking',e=>{if(e.detail)voiceEvidence.started=true;else if(voiceEvidence.started)voiceEvidence.ended=true;});window.addEventListener('capri:audio-level',e=>voiceEvidence.peak=Math.max(voiceEvidence.peak,e.detail));});await page.locator('#read-replies').check();const result=await send('Say hello in one short sentence.');await page.waitForFunction(()=>window.voiceEvidence.started,{},{timeout:180000});assert.equal(await page.locator('.avatar').getAttribute('data-expression'),'talking');await page.screenshot({path:path.join(directory,'speaking.png')});await page.waitForFunction(()=>window.voiceEvidence.ended,{},{timeout:120000});const evidence=await page.evaluate(()=>voiceEvidence);assert.ok(evidence.peak>.001);await page.locator('#read-replies').uncheck();return {...result,evidence};});
  await check('Real local transcription -> mic auto-send -> app window',async()=>{
   // Generate an audio fixture with the existing local speech engine, then feed
   // its real samples to the normal VAD/microphone path. STT is not intercepted.
   await page.evaluate(async()=>{const token=document.querySelector('meta[name="capri-token"]').content;const response=await fetch('/api/speech/synthesize',{method:'POST',headers:{'Content-Type':'application/json','X-Capri-Token':token},body:JSON.stringify({text:'Could you get Notepad running?',voice:'af_bella',speed:95,pitch:0,layers:false,voiceGlitches:false})});const result=await response.json();if(!response.ok)throw Error(result.error);const context=new AudioContext({sampleRate:16000});await context.resume();const buffer=await context.decodeAudioData(Uint8Array.from(atob(result.audio),c=>c.charCodeAt(0)).buffer),destination=context.createMediaStreamDestination();window.micFixture={context,buffer,destination};navigator.mediaDevices.getUserMedia=async()=>destination.stream;});
   const transcript=page.waitForResponse(r=>r.url().endsWith('/api/speech/transcribe'),{timeout:180000});
   await page.locator('#record').click();await page.waitForFunction(()=>document.querySelector('#record').dataset.state==='listening',{},{timeout:15000});
   await page.evaluate(()=>{const source=micFixture.context.createBufferSource();source.buffer=micFixture.buffer;source.connect(micFixture.destination);source.start();});
   const recognized=await(await transcript).json();assert.match(recognized.text,/notepad/i);
   await page.waitForFunction(()=>document.querySelector('#send').disabled,{},{timeout:15000});await page.waitForFunction(()=>!document.querySelector('#send').disabled,{},{timeout:180000});
   const reply=await page.locator('#messages .assistant').last().innerText();assert.match(reply,/Launch request sent.*notepad/i);assert.match(reply,/Its window is right here/i);
   await page.locator('#record').click();assert.equal(await page.locator('#record').getAttribute('aria-pressed'),'false');await page.evaluate(()=>micFixture.context.close());return {transcript:recognized.text,reply};
  });
  await check('Chat collapse and reopen',async()=>{await page.locator('#toggle-chat').click();assert.equal(await page.locator('#panel').isVisible(),false);await page.locator('#toggle-chat').click();assert.equal(await page.locator('#message').isVisible(),true);await page.screenshot({path:path.join(directory,'final.png')});assert.deepEqual(report.errors,[]);return {rendererErrors:report.errors};});
 }finally{
  await check('Quit through the application button',async()=>{
   const child=electronChild;const exited=new Promise((resolve,reject)=>{if(child.exitCode!==null||child.signalCode)return resolve();const timer=setTimeout(()=>reject(Error('Electron did not exit within 15 seconds')),15000);child.once('exit',()=>{clearTimeout(timer);resolve();});});
   await page.locator('#quit').click({noWaitAfter:true,timeout:5000}).catch(error=>{if(child.exitCode===null&&!child.signalCode)throw error;});await exited;return {exitCode:child.exitCode,signal:child.signalCode};
  });
  fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2));console.log('REPORT',path.join(directory,'report.json'));
  const failed=report.checks.some(c=>!c.pass)||report.errors.length;
  // Electron's process is verified exited above. Avoid a Playwright transport
  // teardown hang after the renderer itself was closed through the UI.
  if(electronChild.exitCode===null&&!electronChild.signalCode)electronChild.kill();
  process.exit(failed?1:0);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
