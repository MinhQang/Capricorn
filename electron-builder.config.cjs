const fs=require('node:fs');const path=require('node:path');
const root=__dirname;
const pythonRoot=path.dirname(fs.realpathSync(path.join(root,'.tools/python/cpython-3.11-windows-x86_64-none/python.exe')));
module.exports={
 appId:'local.capri.companion',productName:'Capricorn',asar:true,
 directories:{output:'dist'},artifactName:'Capricorn-Setup-${version}-${arch}.${ext}',
 files:['desktop/**/*','package.json','THIRD_PARTY_NOTICES.md'],
 extraResources:[
  {from:process.execPath,to:'runtime/node.exe'},
  {from:'.tools/ollama',to:'runtime/ollama',filter:['**/*']},
  {from:'docs',to:'docs',filter:['WINDOWS-INSTALLER.md','licenses/**/*']},
  {from:'.',to:'payload',filter:['server.js','lib/**/*','public/**/*','speech/*.py','desktop/*.ps1','THIRD_PARTY_NOTICES.md']},
  {from:'.models',to:'payload/.models',filter:['kokoro-v1.0.onnx','voices-v1.0.bin','capri-reference.npy','*.json','*LICENSE*']},
  {from:'.cache/whisper',to:'payload/.cache/whisper',filter:['**/*','!**/.locks/**/*']},
  {from:pythonRoot,to:'payload/.tools/python-runtime',filter:['**/*','!**/__pycache__/**/*','!**/test/**/*','!**/tests/**/*']},
  {from:'.tools/speech/Lib/site-packages',to:'payload/.tools/speech/Lib/site-packages',filter:['**/*','!**/__pycache__/**/*','!**/tests/**/*']}
 ],
 win:{target:['nsis'],icon:'build/icon.ico',signExecutable:false},
 nsis:{include:'build/installer.nsh',installerIcon:'build/icon.ico',uninstallerIcon:'build/icon.ico',runAfterFinish:true,oneClick:false,perMachine:false,allowToChangeInstallationDirectory:true,createDesktopShortcut:true,createStartMenuShortcut:true,deleteAppDataOnUninstall:false},
 afterAllArtifactBuild:async result=>{
  for(const artifact of result.artifactPaths)if(/^Capricorn-Setup-.*\.exe$/.test(path.basename(artifact)))await require('./tools/prepare-release').prepareRelease(artifact);
  return [];
 },
 beforePack:async()=>{for(const entry of ['.tools/ollama/ollama.exe','.tools/ollama/LICENSE','.models/kokoro-v1.0.onnx','.models/voices-v1.0.bin','.models/capri-reference.npy','.tools/speech/Lib/site-packages/kokoro_onnx','.cache/whisper/models--Systran--faster-whisper-base.en'])if(!fs.existsSync(path.join(root,entry)))throw Error('Missing offline speech resource: '+entry+'; run Setup-Local.cmd first.');}
};
