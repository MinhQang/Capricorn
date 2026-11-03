const {launchIntent,folderIntent,resolveTarget}=require('./actions');
const compact=s=>s.toLowerCase().replace(/[^\p{L}\p{N}+]/gu,'');
const schema={type:'object',properties:{intent:{type:'string',enum:['chat','open_app','computer','clarify']},app:{type:'string'},question:{type:'string'}},required:['intent','app','question'],additionalProperties:false};
function informational(s){const words=s.replace(/(^|\s)(["'])([\s\S]*?)\2/g,'$1');return /^(?:(?:hey[, ]+)?capri(?:corn)?[, ]+)?(?:please )?(?:how (?:do|can|to)|explain|what (?:is|does)|tell me about|don't|do not|never)\b/i.test(words.trim())||/\b(?:without opening|don't|do not|not to|not (?:open|launch|start)|never)\b/i.test(words);}

const needsAction=s=>/\b(?:open(?:ing|ed)?|launch(?:ing)?|start(?:ing)?|run(?:ning)?|pull(?:ing)? up|bring(?:ing)? up|need|want|use|search|google|create|make|write|on my computer|on my pc)\b/i.test(s)&&!informational(s);
function groundedApp(name,message){
 if(compact(message).includes(compact(name)))return true;
 const target=resolveTarget(name,[]);if(!target)return false;
 const words=message.replace(/[^\p{L}\p{N}+]+/gu,' ').trim().split(/\s+/);
 for(let start=0;start<words.length;start++)for(let count=1;count<=5;count++)if(resolveTarget(words.slice(start,start+count).join(' '),[])?.id===target.id)return true;
 return false;
}
const clarification=reply=>({handled:true,ok:false,reply,route:'clarify'});
function createIntentRouter({actions,computer,tags,base,preferences,fetcher=fetch,onTrace=()=>{}}){
 // Cache only classification, never execution. /command and /chat see the same
 // text in the existing UI; the second pass must not pay for another inference.
 let cached;
 async function classify(message){
  const model=preferences.get().model;
  if(cached?.message===message&&cached.model===model&&cached.until>Date.now())return cached.promise;
  const promise=(async()=>{
   const response=await fetcher(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({model,stream:false,think:false,format:schema,keep_alive:'2m',options:{num_ctx:3072,num_predict:140,num_thread:2,temperature:0},messages:[{role:'system',content:'Classify the CURRENT user message, not the history. Return JSON only. intent chat for conversation, explanations, questions ABOUT an app, quoted examples, or telling you NOT to act. intent open_app only when asked to actually open/launch an installed application, including indirect requests such as Could you get Chrome running? or I need to use Visual Studio Code. Copy the app name mentioned by the user into app. Never invent an app, path, command or arguments. intent computer for other requested computer operations (files, folders, windows, URLs). intent clarify for an ambiguous action or unspecified app. For open it, do NOT guess: clarify. Use empty strings for unused app/question. Questions must be brief English. Do not roleplay or answer conversationally. Examples: Could you get Notepad running? => open_app, Notepad. Can you pull up Chrome? => open_app, Chrome. I need to use Visual Studio Code. => open_app, Visual Studio Code. What is Chrome? => chat. Hello => chat. Copy my files => computer. Open it => clarify.'},{role:'user',content:message}]})});
   if(!response.ok)throw Error('Local intent model unavailable.');
   const result=JSON.parse((await response.json()).message?.content);
   if(!result||!['chat','open_app','computer','clarify'].includes(result.intent)||typeof result.app!=='string'||typeof result.question!=='string'||result.app.length>200)throw Error('Invalid intent response.');
   return result;
  })();
  cached={message,model,until:Date.now()+15000,promise};
  try{return await promise;}catch(error){cached=undefined;throw error;}
 }
 async function openApp(name){
  const known=resolveTarget(name,[]),items=known?[]:await actions.available();
  let target=known||resolveTarget(name,items);
  if(!target){
   const key=compact(name),matches=items.filter(a=>key.length>=4&&compact(a.Name).includes(key));
   if(matches.length===1)target={id:matches[0].AppID,name:matches[0].Name};
   else if(matches.length>1)return clarification('Which app do you mean: '+matches.slice(0,5).map(a=>a.Name).join(', ')+'? Please ask me to open its full name.');
  }
  if(!target)return clarification('I could not find “'+name+'” in the installed app list. Which installed app should I open? You can use /apps to see the list.');
  try{await actions.open(target.id);return {handled:true,ok:true,reply:'Launch request sent for '+target.name+'.',route:'open_app',action:{type:'open',target:target.id,label:target.name}};}
  catch(error){return {handled:true,ok:false,reply:'I could not launch '+target.name+'. '+error.message,route:'open_app'};}
 }
 async function command(message,jobId){
  message=message.replace(/^(?:forward slash|slash)\s+/i,'/');
  if(message.trim().startsWith('/')){cached=undefined;return tags.command(message,jobId);}
  if(/^remember(?: that)?\s*:?\s+/i.test(message)||/^add task:/i.test(message))return {handled:false};
  if(informational(message))return {handled:false};
  const intent=launchIntent(message.replace(/^(?:hey[, ]+)?capricorn[, ]+/i,'Capri '));
  if(folderIntent(message))return actions.command(message);
  if(intent&&!/^(?:https?:|file )/i.test(intent.name)){
   if(intent.compound)return computer.command(message,jobId,{force:true});
   if(/^(?:it|that|this|the app|something)[.!?]*$/i.test(intent.name))return clarification('Which app should I open? Please name it.');
   return openApp(intent.name);
  }
  if(computer.isIntent(message))return computer.command(message,jobId);
  let result;
  try{result=await classify(message);}catch(error){onTrace({route:'error',error:error.message});return clarification('I could not check your request with the local model. Please try again, or use /open followed by the app name.');}
  onTrace({route:result.intent,app:result.app});
  if(result.intent==='chat')return needsAction(message)?clarification('Are you asking me to open an app or perform a computer action? Please name the app or action.'): {handled:false};
  if(result.intent==='clarify')return needsAction(message)?clarification(result.question.slice(0,300)||'Which app or computer action do you mean?'):{handled:false};
  if(result.intent==='computer')return computer.command(message,jobId,{force:true});
  // Current utterance must name the target. Model/history cannot authorize a
  // different app, an executable path, shell command or previous request.
  if(!needsAction(message))return {handled:false};
  if(!result.app.trim()||!groundedApp(result.app,message)||/[\\/:\r\n]/.test(result.app))return clarification('Which app should I open? Please name it.');
  return openApp(result.app);
 }
 return {command};
}
module.exports={createIntentRouter,informational};
