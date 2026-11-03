const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function repository(value){
 if(!value)return null;
 const match=value.trim().replace(/\.git$/,'').replace(/\/$/,'').match(/^(?:https:\/\/github\.com\/|git@github\.com:)?([\w.-]+\/[\w.-]+)$/);
 if(!match)throw Error('Use a GitHub URL such as https://github.com/OWNER/REPO');
 return match[1];
}
function detectRepository(){
 const metadata=require('../package.json').repository;
 if(metadata)return repository(typeof metadata==='string'?metadata:metadata.url);
 try{return repository(execFileSync('git',['config','--get','remote.origin.url'],{cwd:root,encoding:'utf8',timeout:3000,stdio:['ignore','pipe','ignore']}));}catch{return null;}
}
async function prepareRelease(artifact,repo=detectRepository()){
 const version=require('../package.json').version;
 const directory=path.join(root,'release','v'+version);
 fs.mkdirSync(directory,{recursive:true});
 // Keep the version in the installer filename for release tracking.
 const filename=`Capricorn-Setup-${version}-x64.exe`,destination=path.join(directory,filename);
 fs.copyFileSync(artifact,destination);
 const hash=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(destination))hash.update(chunk);
 fs.writeFileSync(destination+'.sha256',hash.digest('hex')+'  '+filename+'\n');
 fs.writeFileSync(path.join(directory,'RELEASE-NOTES.md'),`# Capricorn ${version}\n\nWindows x64 installer with bundled local AI engine, speech and recognition resources. The selected chat model downloads on first setup.\n\nNatural-language app requests, shared text/voice command routing, visible GUI app launch and window detection. Drive C file access stays excluded.\n\nDownload ${filename}, close Capricorn if already running, and run the installer.\n`);
 if(repo){
  const url='https://github.com/'+repo;
  const block=`<!-- CAPRICORN-DOWNLOAD:START -->\n[![Download for Windows x64](https://img.shields.io/badge/Download-Windows_x64-8b35ff?style=for-the-badge)](${url}/releases/download/v${version}/${filename})\n\n[All releases](${url}/releases) · [SHA-256 checksum](${url}/releases/latest/download/${filename}.sha256)\n<!-- CAPRICORN-DOWNLOAD:END -->`;
  const file=path.join(root,'README.md'),readme=fs.readFileSync(file,'utf8');
  if(!readme.includes('<!-- CAPRICORN-DOWNLOAD:START -->'))throw Error('README download block is missing.');
  fs.writeFileSync(file,readme.replace(/<!-- CAPRICORN-DOWNLOAD:START -->[\s\S]*?<!-- CAPRICORN-DOWNLOAD:END -->/,block));
  fs.writeFileSync(path.join(directory,'PUBLISH.txt'),`Run from the project root after pushing the source and signing in with gh auth login:\n\ngh release create v${version} "release/v${version}/${filename}" "release/v${version}/${filename}.sha256" --repo ${repo} --title "Capricorn ${version}" --notes-file "release/v${version}/RELEASE-NOTES.md"\n\nThe README download button works after this release is published as the latest non-prerelease.\n`);
 }
 return {directory,repository:repo,installer:destination};
}
module.exports={prepareRelease,repository};
if(require.main===module){const index=process.argv.indexOf('--repo');let repo;try{repo=index>=0?repository(process.argv[index+1]):detectRepository();}catch(error){console.error(error.message);process.exit(1);}prepareRelease(path.join(root,'dist',`Capricorn-Setup-${require('../package.json').version}-x64.exe`),repo).then(result=>{console.log(JSON.stringify(result,null,2));if(!repo)console.log('Installer prepared. Set the GitHub download button with: npm run release:prepare -- --repo OWNER/REPO');}).catch(error=>{console.error(error.message);process.exitCode=1;});}
