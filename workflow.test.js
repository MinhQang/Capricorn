const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {direct,validate,createComputer}=require('./lib/computer');
test('ordered search and file plans preserve quoted text and validate before side effects',async()=>{
 const folder=path.join(__dirname,'.cache','workflow-'+Date.now()),file=path.join(folder,'notes.txt');
 const request=`search Google for Capri desktop in Chrome then create folder "${folder}" then create file "${file}" with text "hello and then create more"`;
 const plan=validate(direct(request),request);assert.deepEqual(plan.steps.map(s=>s.op),['search_web','mkdir','write']);assert.equal(plan.steps[2].text,'hello and then create more');
 const searches=[];const engine=createComputer({actions:{searchWeb:async(...args)=>searches.push(args)},preferences:{get:()=>({model:'qwen3:1.7b'})}});
 try{const result=await engine.command(request);assert.equal(result.ok,true,result.reply);assert.deepEqual(searches,[['Capri desktop','chrome']]);assert.equal(await fs.readFile(file,'utf8'),'hello and then create more');assert.equal((await engine.command(request)).ok,false);assert.equal(await fs.readFile(file,'utf8'),'hello and then create more');
  const denied=await engine.command('search Google for test then create file "C:\\forbidden.txt"');assert.equal(denied.ok,false);assert.equal(searches.length,2,'forbidden whole plan must not perform its search');
 }finally{await fs.unlink(file).catch(()=>{});await fs.rmdir(folder).catch(()=>{});}
});
test('named and empty files are grounded in the supplied parent, search cannot invent a query',()=>{
 const request='create a file named notes.txt in E:/Work with text "hello"';assert.deepEqual(validate(direct(request),request).steps,[{op:'write',path:'E:\\Work\\notes.txt',text:'hello'}]);
 assert.equal(validate(direct('create empty file "E:/Work/blank.txt"'),'create empty file "E:/Work/blank.txt"').steps[0].text,'');
 assert.throws(()=>validate({steps:[{op:'search_web',query:'private data',browser:'default'}]},'search Google for Capri'));
 assert.throws(()=>validate({steps:[{op:'search_web',query:'Capri',browser:'chrome'}]},'search Google for Capri'));
});
