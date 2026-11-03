const {_electron:electron}=require('@playwright/test');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const env={...process.env,CAPRI_SKIP_INTRO:'1',CAPRI_NODE_PATH:process.execPath,CAPRI_DATA_DIR:path.join(__dirname,'..','.cache','voice-feedback-check')};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:[path.join(__dirname,'..','desktop/main.js')],env,timeout:45000});
 try{
  const page=await app.firstWindow();await page.waitForSelector('#settings-open');const opened=app.waitForEvent('window');await page.locator('#settings-open').click();const settings=await opened;await settings.waitForFunction(()=>document.body.dataset.ready==='true');
  let attempt=0,pending,payload;
  await page.route('**/api/speech/synthesize',async route=>{attempt++;payload=route.request().postDataJSON();if(attempt===1)return route.fulfill({status:400,json:{error:'Local speech test error'}});pending=route;});
  await settings.locator('#voice-delivery').selectOption('warm');await page.waitForFunction(()=>document.querySelector('#voice-delivery').value==='warm');
  await settings.locator('#test-voice').click();await settings.waitForFunction(()=>document.querySelector('#voice-test-status').textContent==='Local speech test error');assert.equal(await settings.locator('#test-voice').isEnabled(),true);assert.equal(payload.delivery,'warm');assert.equal(payload.speed,Number(await settings.locator('#voice-speed').inputValue()));
  await settings.locator('#test-voice').click();await settings.waitForFunction(()=>document.querySelector('#test-voice').disabled);await page.waitForTimeout(150);assert.equal(attempt,2);
  await settings.locator('#stop-test-voice').click();assert.equal(await settings.locator('#voice-test-status').textContent(),'Voice stopped.');assert.equal(await settings.locator('#test-voice').isEnabled(),true);
  await pending.fulfill({status:400,json:{error:'Old cancelled response'}});await page.waitForTimeout(150);assert.equal(await settings.locator('#voice-test-status').textContent(),'Voice stopped.');
  console.log('PASS: visible synthesis errors, retry enabled, stop during generation, and cancelled replies cannot overwrite current status.');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
