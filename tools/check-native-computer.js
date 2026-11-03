const {spawn}=require('node:child_process'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{native}=require('../lib/native-computer'),policy=require('../lib/path-policy');
(async()=>{
 const title='Capri control test '+Date.now();const script=`Add-Type -AssemblyName System.Windows.Forms; $form=New-Object System.Windows.Forms.Form; $form.Text='${title}'; $form.Width=300; $form.Height=140; $form.Add_Shown({$form.Show(); $form.Activate()}); [void]$form.ShowDialog()`;
 const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 let processError='';child.stderr.on('data',c=>processError+=c);try{let windows;for(let i=0;i<15;i++){windows=await native({op:'windows'});if(windows.some(w=>w.title===title))break;await new Promise(r=>setTimeout(r,150));}assert.ok(windows.some(w=>w.title===title),processError||JSON.stringify(windows));
  for(const op of ['minimize','restore','maximize','close']){const result=await native({op,app:title});assert.equal(result.ok,true);}
  const root=await fs.mkdtemp(path.join(__dirname,'..','.cache','recycle-test-')),file=path.join(root,'capri-own-test.txt');await fs.writeFile(file,'Disposable Capri test fixture.');await policy.checked(file);assert.ok(path.resolve(file).startsWith(path.resolve(__dirname,'..','.cache')+path.sep));assert.equal((await native({op:'trash',path:file})).ok,true);await assert.rejects(fs.stat(file));console.log('PASS: list/minimize/restore/maximize/close own test window; own fixture sent to Recycle Bin.');
 }finally{child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
