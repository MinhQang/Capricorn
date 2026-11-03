const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{createComputer}=require('../lib/computer');
(async()=>{
 const base=await fs.mkdtemp(path.join(__dirname,'..','.cache','live-planner-')),folder=path.join(base,'Planner-Demo'),source=path.join(base,'source.txt'),copy=path.join(base,'copy.txt'),renamed=path.join(base,'renamed.txt');await fs.writeFile(source,'Capri local planner test.');
 const engine=createComputer({actions:{open:async()=>{throw Error('Not part of this test.');}},ollamaBase:'http://127.0.0.1:11434',preferences:{get:()=>({model:'qwen3:1.7b'})},onPlan:plan=>console.log('Planned:',JSON.stringify(plan))});
 const first=await engine.command('Create a new directory named Planner-Demo inside "'+base+'"');assert.equal(first.ok,true,first.reply);assert.equal((await fs.stat(folder)).isDirectory(),true);
 const second=await engine.command(`Copy "${source}" to "${copy}" and then rename "${copy}" to "${renamed}"`);assert.equal(second.ok,true,second.reply);assert.equal(await fs.readFile(renamed,'utf8'),'Capri local planner test.');await assert.rejects(fs.stat(copy));console.log(JSON.stringify({localModel:'qwen3:1.7b',naturalFolderRequest:true,multiStepCopyAndRename:true,results:[first.reply,second.reply]}));
})().catch(error=>{console.error(error);process.exitCode=1;});
