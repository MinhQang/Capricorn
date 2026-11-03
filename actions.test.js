const {test}=require('node:test');const assert=require('node:assert/strict');const {createActions,launchIntent,folderIntent}=require('./lib/actions');
test('natural launch commands resolve installed apps and launch once, without involving chat',async()=>{
 const calls=[];const actions=createActions({catalog:()=>[{Name:'Google Chrome',AppID:'Chrome'},{Name:'Visual Studio Code',AppID:'Microsoft.VisualStudioCode'},{Name:'Example Editor',AppID:'Example.Editor'}],launch:async(command,args)=>calls.push({command,args})});
 for(const text of ['open chrome for me','Could you please open Google Chrome?','mở chrome cho tôi']){const r=await actions.command(text);assert.equal(r.ok,true);assert.equal(r.action.target,'chrome');}
 if(calls[0].command==='explorer.exe')assert.deepEqual(calls[0].args,['shell:AppsFolder\\Chrome']);else{assert.match(calls[0].command,/chrome\.exe$/i);assert.deepEqual(calls[0].args,['--new-window','about:blank']);}assert.equal(calls.length,3);
 const explorer=await actions.command('Can you open file explorer for me?');assert.equal(explorer.action.target,'explorer');assert.equal(calls.at(-1).command,'explorer.exe');
 assert.equal((await actions.command('open Example Editor')).ok,true);assert.deepEqual(calls.at(-1).args,['shell:AppsFolder\\Example.Editor']);
 const count=calls.length;assert.equal((await actions.command('open nonexistent app')).ok,false);assert.equal((await actions.command('open chrome and delete files')).ok,false);assert.equal((await actions.command('Do not open chrome')).handled,false);assert.equal(calls.length,count);
 assert.equal((await actions.command('I am happy today')).handled,false);
});
test('folder paths retain separators, spaces and Unicode; files and missing folders do not execute',async()=>{
 assert.equal(folderIntent('can you open my E:/Project folder?'),'E:/Project');
 assert.equal(folderIntent('Please open the "E:/My Project" folder for me.'),'E:/My Project');
 assert.equal(folderIntent('could you open folder "E:\\Tài liệu\\My Folder" for me?'),'E:\\Tài liệu\\My Folder');assert.equal(folderIntent('open drive E:'),'E:\\');assert.equal(folderIntent('open file:///E:/My%20Folder'),'E:\\My Folder');
 const calls=[];const actions=createActions({catalog:()=>[],launch:async(...args)=>calls.push(args)});const r=await actions.command('open E:\\no-such-capri-folder-987654');assert.equal(r.handled,true);assert.equal(r.ok,false);assert.equal(calls.length,0);
 assert.equal(launchIntent('please open file explorer for me').name,'file explorer');
});

test('personal app names and joined voice transcription names open the installed editor',async()=>{const calls=[];const actions=createActions({catalog:()=>[{Name:'Visual Studio Code',AppID:'Microsoft.VisualStudioCode'}],launch:async(...args)=>calls.push(args)});for(const text of ['open my visualcode','open up my visual code','could you bring up my VS Code?','run my visualcode','open my visual code please','can you open my VSCode for me?','launch the visual studio code app']){const result=await actions.command(text);assert.equal(result.ok,true,text);assert.equal(result.action.target,'vscode');}assert.equal(calls.length,7);assert.equal((await actions.command('open my unknowneditor')).ok,false);assert.equal(calls.length,7);});
