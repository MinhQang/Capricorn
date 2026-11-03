const {native}=require('./native-computer');
const help=[{tag:'/search',description:'Search Google in your browser',insert:'/search '},{tag:'/help',description:'Show commands',insert:'/help'},{tag:'/apps',description:'List installed apps',insert:'/apps'},{tag:'/open',description:'Open an app, URL or folder',insert:'/open '},{tag:'/write',description:'Write text into a new Notepad document',insert:'/write '},{tag:'/windows',description:'List open windows',insert:'/windows'},{tag:'/focus',description:'Focus an app window',insert:'/focus '},{tag:'/minimize',description:'Minimize an app window',insert:'/minimize '},{tag:'/maximize',description:'Maximize an app window',insert:'/maximize '},{tag:'/close',description:'Close a named window',insert:'/close '},{tag:'/list',description:'List a folder outside C',insert:'/list '},{tag:'/read',description:'Read a text file outside C',insert:'/read '},{tag:'/remember',description:'Save a preference locally',insert:'/remember '},{tag:'/new',description:'Clear conversation history; keep saved facts',insert:'/new'}];
function createCommands({actions,computer,memory,isBusy=()=>false,nativeAction=native}){
 async function suggestions(includeApps=false){const apps=includeApps?await actions.available():[];return {commands:[...help,...['chrome','vscode','explorer','notepad','edge','calculator'].map(name=>({tag:'/'+name,description:'Open '+name,insert:'/'+name}))],apps:apps.slice(0,250).map(a=>({tag:'/open '+a.Name,description:'Open '+a.Name,insert:'/open '+a.Name}))};}
 async function command(message,id){if(!message.trim().startsWith('/'))return {handled:false};const match=message.trim().match(/^\/([^\s/]+)(?:\s+([\s\S]*))?$/);if(!match)return {handled:true,ok:false,reply:'Type /help to see commands.'};const tag=match[1].toLowerCase(),text=match[2]||'';const result=reply=>({handled:true,ok:true,reply,action:{type:'command'}});
 try{
 if(tag==='help')return result(help.map(c=>c.tag+' - '+c.description).join('\n'));
 if(tag==='apps'){const apps=await actions.available();return result(apps.length?apps.map(a=>'/open '+a.Name).join('\n'):'No Start menu apps found yet. Try /notepad, /explorer or /chrome.');}
 if(tag==='new'){if(isBusy())throw Error('Wait for the current reply before clearing history.');memory.clearHistory();return {...result('Fresh conversation. Saved preferences are still here.'),clearedHistory:true};}
 if(tag==='remember'){if(isBusy())throw Error('Wait for the current reply before changing memory.');const item=memory.add(text);return {...result('Saved that preference locally.'),savedMemory:item};}
 if(tag==='write'){if(!text.trim())throw Error('Use /write followed by the text. I will open a blank Notepad document.');if(text.length>2000||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text))throw Error('Write accepts up to 2,000 plain-text characters.');const written=await nativeAction({op:'draft',text});return result(written.message);}
 if(tag==='open'){if(!text.trim())throw Error('Use /open followed by an installed app name, URL or folder.');if(/^https?:\/\//i.test(text.trim())){await actions.openUrl(text.trim());return result('Browser launch request sent.');}return await actions.command('open '+text);}
 if(tag==='search'){if(!text.trim())throw Error('Use /search followed by your Google search.');return computer.command('search Google for '+text,id);}
 if(tag==='windows')return computer.command('list windows',id);
 if(['focus','minimize','maximize','restore','close'].includes(tag)){if(!text.trim())throw Error('Supply an app name or exact window title after /'+tag+'.');return computer.command(tag+' '+text,id);}
 if(['list','read'].includes(tag)){if(!text.trim())throw Error('Supply an absolute path outside C.');return computer.command((tag==='list'?'list files ':'read file ')+text,id);}
 // An unreserved tag is an app shortcut, never a shell command or planner prompt.
 return await actions.command('open '+message.trim().slice(1).replace(/-/g,' '));
 }catch(error){return {handled:true,ok:false,reply:error.message,action:{type:'command'}};}}
 return {command,suggestions};
}
module.exports={createCommands,help};
