const {_electron:electron}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const directory=fs.mkdtempSync(path.resolve('.cache/workflow-ui-'));
 fs.writeFileSync(path.join(directory,'preferences.json'),JSON.stringify({version:2,values:{'motion-style':'emote','read-replies':false}}));
 const env={...process.env,CAPRI_DATA_DIR:directory,CAPRI_NODE_PATH:process.execPath,CAPRI_SKIP_INTRO:'1'};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:[path.resolve('desktop/main.js')],env,timeout:45000}),child=app.process(),checks=[],errors=[];let page,exitCode=0;
 try{
  page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.evaluate(()=>window.capriPreferencesReady);await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.presentation==='body');
  await page.screenshot({path:path.join(directory,'startup-full-body.png')});checks.push({name:'Saved emote mode opens as full body',pass:true});
  const opened=app.waitForEvent('window');await page.locator('#settings-open').click();const settings=await opened;await settings.waitForFunction(()=>document.body.dataset.ready==='true');
  const ids=await settings.locator('#pose-preview option[value^="emote:"]').evaluateAll(options=>options.map(o=>o.value));assert.equal(ids.length,27);
  for(const value of ids){await settings.locator('#pose-preview').selectOption(value);await page.waitForFunction(id=>document.querySelector('canvas').dataset.emote===id,value.slice(6));}
  checks.push({name:'All imported images render via Settings',pass:true,count:ids.length});
  await settings.locator('#pose-preview').selectOption('idle');await page.waitForFunction(()=>document.querySelector('canvas').dataset.presentation==='body');
  await settings.locator('#motion-style').selectOption('cel');await page.waitForFunction(()=>document.querySelector('canvas').dataset.emote==='none');await settings.locator('#hide-settings').click();
  await page.locator('#toggle-chat').click();
  async function send(text){await page.locator('#message').fill(text);await page.locator('#send').click();await page.waitForFunction(()=>!document.querySelector('#send').disabled,{},{timeout:180000});return page.locator('#messages .assistant').last().innerText();}
  await send('Hello!');await page.waitForFunction(()=>document.querySelector('canvas').dataset.presentation==='body',{},{timeout:10000});checks.push({name:'Chat emote expires and returns to full body',pass:true});
  const folder=path.join(directory,'created'),file=path.join(folder,'notes.txt');
  const reply=await send(`search Google for Capri desktop assistant in Chrome then create folder "${folder}" then create file "${file}" with text "Hello from Capri"`);
  assert.match(reply,/Google search request sent/);assert.match(reply,/Folder created/);assert.match(reply,/Text file created/);assert.equal(fs.readFileSync(file,'utf8'),'Hello from Capri');
  checks.push({name:'Real Google browser search, folder and file sequence',pass:true,reply});
  const blocked=await send(`create file "${file}" with text "Do not overwrite"`);assert.match(blocked,/exist/i);assert.equal(fs.readFileSync(file,'utf8'),'Hello from Capri');checks.push({name:'Existing file is not overwritten',pass:true});
  const denied=await send('search Google for this must not run then create file "C:/forbidden.txt"');assert.match(denied,/excluded/i);checks.push({name:'Whole plan rejects C before the search',pass:true,reply:denied});
  await page.waitForFunction(()=>document.querySelector('canvas').dataset.presentation==='body',{},{timeout:10000});await page.screenshot({path:path.join(directory,'workflow-full-body.png')});assert.deepEqual(errors,[]);
 }catch(error){checks.push({name:'Failure',pass:false,error:error.message});console.error(error);exitCode=1;await page?.screenshot({path:path.join(directory,'failure.png')}).catch(()=>{});}
 finally{
  const exited=new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);});await page?.locator('#quit').click({noWaitAfter:true,timeout:3000}).catch(()=>{});await Promise.race([exited,new Promise(resolve=>setTimeout(resolve,5000))]);if(child.exitCode===null)child.kill();
  fs.writeFileSync(path.join(directory,'report.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({directory,checks,errors},null,2));process.exit(exitCode);
 }
})().catch(e=>{console.error(e);process.exit(1);});
