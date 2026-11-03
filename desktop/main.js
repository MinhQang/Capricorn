const {app,BrowserWindow,screen,dialog,ipcMain}=require('electron');
const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
let backend,dashboard,settings,pet,intro,setupWindow,baseUrl;
let quitting=false,openingCompanion=false,finishArrival;
const preload=path.join(__dirname,'preload.js');
const icon=path.join(__dirname,'icon.ico');
const scriptRoot=app.isPackaged?path.join(process.resourcesPath,'payload','desktop'):__dirname;
function secure(win,url){win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',(event,target)=>{if(new URL(target).origin!==url)event.preventDefault();});}
function openDashboard(){if(dashboard&&!dashboard.isDestroyed()){dashboard.show();return;}dashboard=new BrowserWindow({icon,width:1000,height:800,backgroundColor:'#101116',autoHideMenuBar:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});secure(dashboard,baseUrl);dashboard.loadURL(baseUrl);dashboard.on('closed',()=>{dashboard=null;});}
function trusted(event){return pet&&!pet.isDestroyed()&&event.sender===pet.webContents;}
function trustedSettings(event){return settings&&!settings.isDestroyed()&&event.sender===settings.webContents;}
function openSettings(){if(settings&&!settings.isDestroyed()){settings.show();settings.focus();return;}settings=new BrowserWindow({width:410,height:620,minWidth:340,minHeight:420,backgroundColor:'#0c1723',autoHideMenuBar:true,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,preload,backgroundThrottling:true}});secure(settings,baseUrl);settings.loadURL(baseUrl+'/settings');settings.on('closed',()=>{settings=null;});}
ipcMain.handle('capri:settings',event=>{if(trusted(event))openSettings();});
ipcMain.handle('capri:resize',(event,height)=>{if(!trusted(event)||!Number.isFinite(height))return;const b=pet.getBounds(),area=screen.getDisplayMatching(b).workArea;const h=Math.min(area.height,Math.max(340,Math.min(680,Math.round(height))));pet.setBounds({x:Math.max(area.x,Math.min(b.x,area.x+area.width-320)),y:Math.max(area.y,Math.min(b.y,area.y+area.height-h)),width:320,height:h});return h;});
ipcMain.handle('capri:dashboard',event=>{if(trusted(event)||trustedSettings(event))openDashboard();});
ipcMain.handle('capri:quit',event=>{if(trusted(event))app.quit();});
ipcMain.on('capri:intro-finished',event=>{if(intro&&!intro.isDestroyed()&&event.sender===intro.webContents)finishArrival?.();});
ipcMain.handle('capri:point',async(event,target)=>{
 if(!trusted(event)||!['notepad','calculator','explorer','documents','downloads','desktop','chrome','edge','vscode','discord','spotify','steam'].includes(target))return {found:false};
 const rect=await new Promise(resolve=>{let output='';const child=spawn(path.join(process.env.SystemRoot||'C:/Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(scriptRoot,'target-window.ps1'),'-Target',target],{windowsHide:true});const timeout=setTimeout(()=>{child.kill();resolve(null);},11000);child.stdout.on('data',c=>output+=c);child.on('error',()=>{clearTimeout(timeout);resolve(null);});child.on('close',()=>{clearTimeout(timeout);try{resolve(JSON.parse(output));}catch{resolve(null);}});});
 if(!rect||!trusted(event))return {found:false};
 const r=screen.screenToDipRect(null,rect),area=screen.getDisplayMatching(r).workArea,b=pet.getBounds();
 const right=r.x+r.width+8,side=right+b.width<=area.x+area.width?'left':'right';
 const x=side==='left'?right:r.x-b.width-8;
 // Slide the companion beside the confirmed app window; never move the cursor.
 const end={x:Math.max(area.x,Math.min(x,area.x+area.width-b.width)),y:Math.max(area.y,Math.min(r.y+40,area.y+area.height-b.height))};
 const start=Date.now();await new Promise(resolve=>{const timer=setInterval(()=>{if(!pet||pet.isDestroyed()){clearInterval(timer);resolve();return;}const t=Math.min(1,(Date.now()-start)/320),ease=1-Math.pow(1-t,3);pet.setPosition(Math.round(b.x+(end.x-b.x)*ease),Math.round(b.y+(end.y-b.y)*ease));if(t===1){clearInterval(timer);resolve();}},1000/30);});
 return {found:true,side};
});
app.setName('Capricorn');
app.setAppUserModelId('local.capri.companion');
const profile=process.env.CAPRI_DATA_DIR?path.join(process.env.CAPRI_DATA_DIR,'desktop-profile'):path.join(app.getPath('appData'),'Capri','desktop-profile');
fs.mkdirSync(profile,{recursive:true});app.setPath('userData',profile);
const diagnostics=path.join(profile,'diagnostics.log');
function log(event,details={}){try{fs.appendFileSync(diagnostics,JSON.stringify({time:new Date().toISOString(),event,...details})+'\n');}catch{}}
const software=process.env.CAPRI_GPU!=='1';
if(software)app.disableHardwareAcceleration();
log('startup',{electron:process.versions.electron,softwareRendering:software});
app.on('child-process-gone',(_event,details)=>log('child-process-gone',{type:details.type,reason:details.reason,exitCode:details.exitCode}));
process.on('uncaughtException',error=>{log('main-exception',{message:error.message,stack:error.stack});dialog.showErrorBox('Capricorn desktop error',error.message+'\n\nDiagnostics: '+diagnostics+'\nTry Start-Capri-Browser.cmd.');app.quit();});
function showArrival(area){
 if(process.env.CAPRI_SKIP_INTRO==='1'){pet.showInactive();return;}
 const bounds=pet.getBounds(),target=new URLSearchParams({x:String(bounds.x-area.x+6),y:String(bounds.y-area.y+34),w:'308',h:'255'});
 intro=new BrowserWindow({x:area.x,y:area.y,width:area.width,height:area.height,frame:false,transparent:true,backgroundColor:'#00000000',alwaysOnTop:true,skipTaskbar:true,resizable:false,hasShadow:false,show:false,focusable:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,preload}});
 secure(intro,baseUrl);intro.setIgnoreMouseEvents(true);let timeout;
 function finish(){clearTimeout(timeout);finishArrival=null;if(intro&&!intro.isDestroyed())intro.destroy();intro=null;if(!quitting&&pet&&!pet.isDestroyed())pet.showInactive();}
 finishArrival=finish;timeout=setTimeout(finish,5500);
 intro.once('ready-to-show',()=>{if(intro&&!intro.isDestroyed())intro.showInactive();});intro.webContents.once('did-fail-load',finish);intro.webContents.once('render-process-gone',finish);
 intro.loadURL(baseUrl+'/intro?'+target);
}

function createPet(){
 const area=screen.getPrimaryDisplay().workArea;
 pet=new BrowserWindow({icon,x:area.x+area.width-330,y:Math.max(area.y,area.y+area.height-350),width:320,height:340,frame:false,transparent:true,backgroundColor:'#00000000',alwaysOnTop:true,skipTaskbar:true,resizable:false,hasShadow:false,show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,preload,backgroundThrottling:true}});
 pet.loadURL(baseUrl+'/pet');pet.once('ready-to-show',()=>showArrival(area));secure(pet,baseUrl);pet.on('closed',()=>app.quit());
}
function openSetup(startup=false){if(setupWindow&&!setupWindow.isDestroyed()){setupWindow.show();return;}setupWindow=new BrowserWindow({icon,width:580,height:590,resizable:false,autoHideMenuBar:true,backgroundColor:'#100b19',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,preload}});secure(setupWindow,baseUrl);setupWindow.loadURL(baseUrl+'/setup'+(startup?'?startup=1':''));setupWindow.on('close',event=>{log('setup-close',{startup,hasPet:Boolean(pet),quitting});if(startup&&!pet&&!quitting){const choice=dialog.showMessageBoxSync(setupWindow,{type:'question',title:'Setup is not finished',message:'Continue setup or quit Capricorn?',detail:'Quitting will not open the companion. Model setup can be resumed the next time you launch Capricorn.',buttons:['Continue setup','Quit Capricorn'],defaultId:0,cancelId:0});log('setup-close-choice',{choice});if(choice===0)event.preventDefault();else{quitting=true;app.quit();}}});setupWindow.on('closed',()=>{setupWindow=null;});}
ipcMain.handle('capri:setup',event=>{if(trusted(event)||trustedSettings(event))openSetup();});
ipcMain.handle('capri:setup-complete',async event=>{const current=setupWindow;if(!current||event.sender!==current.webContents||openingCompanion)return false;openingCompanion=true;try{const ready=await require('./setup-gate').setupReady(baseUrl);if(!ready||quitting||current.isDestroyed()||setupWindow!==current)return false;if(!pet||pet.isDestroyed())createPet();current.close();return true;}catch(error){log('setup-readiness-error',{message:error.message});return false;}finally{openingCompanion=false;}});
app.whenReady().then(async()=>{
 if(app.isPackaged&&fs.existsSync(path.join(path.dirname(process.execPath),'.capricorn-installing'))){dialog.showErrorBox('Capricorn installation is incomplete','The installer has not finished copying files. Run the installer again and let it finish before opening Capricorn.');app.quit();return;}
 const runtimeRoot=app.isPackaged?path.join(process.resourcesPath,'payload'):path.join(__dirname,'..');
 const nodePath=app.isPackaged?path.join(process.resourcesPath,'runtime','node.exe'):(process.env.CAPRI_NODE_PATH||'node');
 const backendEnv={...process.env,CAPRI_NO_LAUNCH:'1',CAPRI_MANAGED:'1'};delete backendEnv.ELECTRON_RUN_AS_NODE;
 if(app.isPackaged){
  const net=require('node:net');const port=await new Promise((resolve,reject)=>{const probe=net.createServer();probe.on('error',reject);probe.listen(0,'127.0.0.1',()=>{const p=probe.address().port;probe.close(()=>resolve(p));});});
  backendEnv.CAPRI_OLLAMA_URL='http://127.0.0.1:'+port;backendEnv.CAPRI_OLLAMA_EXE=path.join(process.resourcesPath,'runtime','ollama','ollama.exe');
  try{const choice=JSON.parse(fs.readFileSync(path.join(process.resourcesPath,'setup-choice.json'),'utf8'));backendEnv.CAPRI_INSTALL_MODEL=choice.model;}catch{}
  backendEnv.CAPRI_PYTHON_PATH=path.join(runtimeRoot,'.tools','python-runtime','python.exe');backendEnv.PYTHONPATH=path.join(runtimeRoot,'.tools','speech','Lib','site-packages');backendEnv.PYTHONNOUSERSITE='1';}
 backend=spawn(nodePath,[path.join(runtimeRoot,'server.js')],{cwd:runtimeRoot,windowsHide:true,env:backendEnv,stdio:['pipe','pipe','pipe']});
 let started=false,output='';backend.stdout.on('data',c=>{output+=c;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(started||!match)return;started=true;const url=match[0];console.log('Capri: '+url);
  baseUrl=url;
  if(app.isPackaged||process.env.CAPRI_REQUIRE_SETUP==='1')openSetup(true);else createPet();

 });
 backend.stderr.on('data',c=>process.stderr.write(c));backend.on('error',e=>{log('backend-error',{message:e.message});console.error(e);app.quit();});backend.on('exit',(code,signal)=>{log('backend-exit',{code,signal});app.quit();});
});
app.on('before-quit',()=>{quitting=true;log('before-quit');if(backend?.stdin.writable)backend.stdin.end();});
app.on('window-all-closed',()=>{log('all-windows-closed');app.quit();});
