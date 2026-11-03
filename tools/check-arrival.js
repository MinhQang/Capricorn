const {_electron:electron}=require('@playwright/test'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const directory=fs.mkdtempSync(path.resolve('.cache/eyes-intro-')),checks=[];
 for(const effects of [true,false]){
  const data=path.join(directory,effects?'animated':'quiet');fs.mkdirSync(data,{recursive:true});fs.writeFileSync(path.join(data,'preferences.json'),JSON.stringify({version:2,values:{'digital-effects':effects,'read-replies':false}}));
  const env={...process.env,CAPRI_NODE_PATH:process.execPath,CAPRI_DATA_DIR:data};for(const key of ['ELECTRON_RUN_AS_NODE','CAPRI_SKIP_INTRO','CAPRI_REQUIRE_SETUP'])delete env[key];
  const app=await electron.launch({args:[path.resolve('desktop/main.js')],env,timeout:45000}),child=app.process();let failed=false;
  try{
   const errors=[];app.on('window',p=>p.on('pageerror',e=>errors.push(e.message)));const pet=await app.firstWindow();await pet.waitForSelector('#record');let arrival;
   for(let i=0;i<60;i++){arrival=app.windows().find(p=>p.url().includes('/intro?'));if(arrival)break;await new Promise(r=>setTimeout(r,30));}
   assert.ok(arrival,'Intro window must exist');await arrival.waitForFunction(()=>document.body.dataset.phase==='eyes');assert.equal((await arrival.locator('h1').textContent()).trim(),'CAPRICORN PROJECT // By Kwang');assert.equal(await arrival.locator('h1').evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');assert.equal(await arrival.locator('h1').evaluate(el=>getComputedStyle(el).borderLeftWidth),'0px');assert.equal(await arrival.locator('h1 strong').evaluate(el=>getComputedStyle(el).fontWeight),'100');assert.ok(Number(await arrival.locator('body').getAttribute('data-tile-count'))>=4000);
   assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('/pet')).isVisible()),false);
   await arrival.screenshot({path:path.join(data,'eyes.png')});
   if(effects){await arrival.waitForFunction(()=>document.body.dataset.phase==='fragment');await arrival.waitForTimeout(250);await arrival.screenshot({path:path.join(data,'fragments.png')});assert.equal(await arrival.locator('body').getAttribute('data-streams'),'1');await arrival.waitForTimeout(300);await arrival.screenshot({path:path.join(data,'streams.png')});await arrival.waitForFunction(()=>document.body.dataset.phase==='crt');await arrival.screenshot({path:path.join(data,'crt.png')});}
   else assert.equal(await arrival.locator('body').getAttribute('data-effects'),'off');
   if(!arrival.isClosed())await arrival.waitForEvent('close',{timeout:6500});assert.equal(app.windows().length,1);assert.equal(await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].isVisible()),true);await pet.waitForFunction(()=>document.querySelector('canvas')?.dataset.presentation==='body');assert.deepEqual(errors,[]);await pet.screenshot({path:path.join(data,'companion.png')});checks.push({effects,eyes:true,title:true,fragments:effects,crt:effects,companionVisible:true,errors});console.log('PASS intro, effects='+effects);
  }catch(e){failed=true;console.error(e);}
  finally{const pet=app.windows().find(p=>p.url().includes('/pet'));const exited=new Promise(r=>{if(child.exitCode!==null)return r();child.once('exit',r);});await pet?.locator('#quit').click({noWaitAfter:true,timeout:3000}).catch(()=>{});await Promise.race([exited,new Promise(r=>setTimeout(r,3000))]);if(child.exitCode===null)child.kill();}
  if(failed){process.exitCode=1;break;}
 }
 fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify(checks,null,2));console.log('REPORT '+directory);process.exit(process.exitCode||0);
})().catch(e=>{console.error(e);process.exit(1);});
