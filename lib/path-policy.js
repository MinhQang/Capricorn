const fs=require('node:fs/promises'),path=require('node:path');
const {execFile}=require('node:child_process');let drives,driveTime=0,pendingDrives;
function deviceAllowed(value,mapping){const drive=path.win32.parse(value).root.slice(0,2).toUpperCase(),device=mapping[drive];if(!device||!/^\\Device\\(?:HarddiskVolume|Volume\{|CdRom)/i.test(device)||device===mapping['C:'])throw Error('This drive is unavailable, mapped, or aliases the excluded C volume.');}
async function refreshDrives(){if(process.platform!=='win32')return;if(pendingDrives)return pendingDrives;pendingDrives=new Promise((resolve,reject)=>execFile(path.join(process.env.SystemRoot||'C:/Windows','System32','WindowsPowerShell','v1.0','powershell.exe'),['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'..','desktop','drive-map.ps1')],{windowsHide:true,timeout:10000,maxBuffer:65536},(error,output)=>{if(error)return reject(Error('Could not verify the drive mapping.'));try{drives=JSON.parse(output.replace(/^\uFEFF/,''));driveTime=Date.now();resolve(drives);}catch{reject(Error('Invalid Windows drive mapping.'));}})).finally(()=>{pendingDrives=null;});return pendingDrives;}
function lexical(value,{root=false}={}){
 if(typeof value!=='string'||! /^[a-z]:[\\/]/i.test(value)||/[\x00-\x1f<>"|?*]/.test(value))throw Error('Supply an absolute local drive path, such as E:\\Projects.');
 const result=path.win32.normalize(value);
 if(/^c:/i.test(result))throw Error('Drive C is excluded from file access.');
 if(result.slice(2).includes(':')||result.split(/[\\/]/).slice(1).some(s=>/[. ]$/.test(s)||/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(s)))throw Error('Device names, streams and ambiguous paths are not allowed.');
 if(!root&&result===path.win32.parse(result).root)throw Error('Changing an entire drive root is not supported.');
 return result;
}
async function checked(value,{existing=true,root=false}={}){
 const full=lexical(value,{root});let cursor=full;
 if(process.platform==='win32'){if(!drives||Date.now()-driveTime>1000)await refreshDrives();deviceAllowed(full,drives);}
 // Check every existing component, including junctions and paths through SUBST drives.
 while(true){let info;try{info=await fs.lstat(cursor);}catch(error){if(error.code!=='ENOENT')throw error;if(existing&&cursor===full)throw Error('Path not found: '+full);}
  if(info){if(info.isSymbolicLink())throw Error('Links and junctions are excluded from computer file actions.');lexical(await fs.realpath(cursor),{root:true});}
  const parent=path.win32.dirname(cursor);if(parent===cursor)break;cursor=parent;
 }
 return full;
}
async function tree(value){let count=0,bytes=0;async function walk(current){await checked(current);const s=await fs.lstat(current);if(++count>1500)throw Error('This request is too large; choose a smaller folder (up to 1,500 entries).');if(s.isFile()){bytes+=s.size;if(bytes>100*1024*1024)throw Error('Choose a smaller request (up to 100 MB).');}else if(s.isDirectory()){for(const name of await fs.readdir(current))await walk(path.win32.join(current,name));}else throw Error('Only regular files and folders are supported.');}await walk(value);}
module.exports={lexical,checked,tree,refreshDrives,deviceAllowed};
