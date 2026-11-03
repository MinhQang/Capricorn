const {spawn}=require('node:child_process');
const path=require('node:path');
let command,args;
try{command=require('electron');args=[path.join(__dirname,'desktop','main.js')];}
catch{command=process.execPath;args=[path.join(__dirname,'server.js')];console.log('Electron unavailable; opening browser mode.');}
const env={...process.env,CAPRI_NODE_PATH:process.execPath};delete env.ELECTRON_RUN_AS_NODE;
const child=spawn(command,args,{stdio:'inherit',env,windowsHide:false});
child.on('error',e=>{console.error(e.message);process.exitCode=1;});child.on('exit',(code,signal)=>{if(code||signal)console.error('Capri desktop stopped unexpectedly. Try Start-Capri-Browser.cmd. Exit:',code,signal||'');process.exitCode=code||0;});
