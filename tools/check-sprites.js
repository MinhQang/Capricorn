const {_electron:electron}=require('@playwright/test');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const env={...process.env,CAPRI_SKIP_INTRO:'1',CAPRI_NODE_PATH:process.execPath,CAPRI_DATA_DIR:path.join(__dirname,'..','.cache','sprites-check')};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:[path.join(__dirname,'..','desktop/main.js')],env,timeout:45000});
 try{
  const page=await app.firstWindow(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.renderer==='sprite-sheets');
  assert.equal((await app.windows()).length,1);assert.equal(await page.locator('.portrait-frame').count(),0);assert.equal(await page.locator('canvas').evaluate(c=>c.getContext('webgl')===null),true);
  await page.evaluate(()=>pose('idle'));await page.waitForFunction(()=>document.querySelector('canvas').dataset.act==='idle');assert.ok(Number(await page.locator('canvas').getAttribute('data-loaded-clips'))<=10);
  await page.locator('.stage').screenshot({path:path.join(__dirname,'..','.cache','sprites-standing.png')});
  for(const [age,clip] of [[19000,'perch'],[56000,'laydown'],[111000,'laydown_sleep']]){
   await page.evaluate(age=>{pose('idle');const actor=CapriMotion.get(document.querySelector('.avatar'));actor.started=Date.now()-age;},age);
   await page.waitForFunction(clip=>document.querySelector('canvas').dataset.act===clip,clip);
   await page.locator('.stage').screenshot({path:path.join(__dirname,'..','.cache','sprites-'+clip+'.png')});
   assert.ok(Number(await page.locator('canvas').getAttribute('data-resident-bytes'))<=24*1024*1024);
  }
  await page.locator('#idle-activities').evaluate(el=>{el.checked=false;el.dispatchEvent(new Event('change'));});
  await page.evaluate(()=>{pose('idle');CapriMotion.get(document.querySelector('.avatar')).started=Date.now()-200000;});await page.waitForFunction(()=>document.querySelector('canvas').dataset.act==='idle');
  await page.locator('#pose-preview').evaluate(el=>{el.value='sitting';el.dispatchEvent(new Event('change'));});await page.waitForFunction(()=>document.querySelector('canvas').dataset.act==='perch');const frame=await page.locator('canvas').getAttribute('data-cel');await page.waitForTimeout(350);assert.equal(await page.locator('canvas').getAttribute('data-cel'),frame);
  await page.locator('#animation-rate').evaluate(el=>{el.value='12';el.dispatchEvent(new Event('change'));});await page.waitForFunction(()=>document.querySelector('canvas').dataset.fps==='4');const draws=Number(await page.locator('canvas').getAttribute('data-draws'));await page.waitForTimeout(1000);assert.ok(Number(await page.locator('canvas').getAttribute('data-draws'))-draws<=13);
  await page.evaluate(()=>{pose('idle');window.dispatchEvent(new CustomEvent('capri:speaking',{detail:true}));window.dispatchEvent(new CustomEvent('capri:audio-level',{detail:.1}));});await page.waitForFunction(()=>document.querySelector('canvas').dataset.mouth!=='off');await page.locator('.stage').screenshot({path:path.join(__dirname,'..','.cache','sprites-speaking.png')});
  await page.locator('#motion-style').evaluate(el=>{el.value='still';el.dispatchEvent(new Event('change'));});await page.waitForFunction(()=>document.querySelector('canvas').dataset.fps==='0');const held=await page.locator('canvas').getAttribute('data-draws');await page.waitForTimeout(400);assert.equal(await page.locator('canvas').getAttribute('data-draws'),held);
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#motion-style').evaluate(el=>{el.value='cel';el.dispatchEvent(new Event('change'));});await page.waitForFunction(()=>document.querySelector('canvas').dataset.fps==='0');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.route('**/assets/mochi/cutin-laugh.png',route=>route.fulfill({status:404,body:''}));await page.reload();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.renderer==='sprite-sheets');await page.evaluate(()=>pose('happy'));await page.waitForTimeout(350);assert.equal(await page.locator('canvas').getAttribute('data-act'),'idle');assert.equal(await page.locator('canvas').getAttribute('data-emote'),'none');
  await page.route('**/assets/lachy/idle.png',route=>route.fulfill({status:404,body:''}));await page.reload();await page.waitForFunction(()=>document.querySelector('.avatar.sprite-only')&&!document.querySelector('canvas'));assert.equal(await page.locator('.character-body').isVisible(),true);assert.equal(await page.locator('.avatar').evaluate(el=>getComputedStyle(el).animationName),'none');assert.equal(await page.locator('.avatar').evaluate(el=>getComputedStyle(el).transform),'none');
  assert.deepEqual(errors,[]);console.log('PASS: Lachy sprite playback, idle stages, mouth animation, cache limit, optional clip fallback and static-only fallback when sprites fail; no legacy rig or CSS warping.');
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
