const path=require('node:path'),policy=require('./path-policy');
function segments(message){
 const parts=[];let start=0,quote=null;
 for(let i=0;i<message.length;i++){
  const c=message[i];if(c==='"'||c==="'"&&(!/[\w]/.test(message[i-1]||'')||quote==="'")){if(quote===c)quote=null;else if(!quote)quote=c;}
  if(quote)continue;
  const match=message.slice(i).match(/^\s+(?:and then|then|and)\s+(?=(?:create|make|write|search|google|open|list|read|copy|move|rename)\b)/i);
  if(match){parts.push(message.slice(start,i));i+=match[0].length-1;start=i+1;}
 }
 parts.push(message.slice(start));return parts.map(s=>s.trim()).filter(Boolean);
}
function strip(s){return s.trim().replace(/^(?:(?:hey[, ]+)?capri(?:corn)?[, ]+)?(?:(?:please|can you|could you|would you|help me)\s+)*/i,'').replace(/\s+(?:please|for me)[.!?]*$/i,'').trim();}
function single(message){
 const text=strip(message);let match;
 if((match=text.match(/^(?:search(?:\s+(?:on\s+)?google|\s+(?:the\s+)?web)?(?:\s+for)?|google|look\s+(?:up|for)|find(?:\s+me)?)\s+(.+)$/i))){
  let query=match[1],browser='default';const suffix=query.match(/\s+(?:in|using|with)\s+(chrome|edge)[.!?]*$/i);if(suffix){browser=suffix[1].toLowerCase();query=query.slice(0,suffix.index);}
  query=query.replace(/\s+on\s+google[.!?]*$/i,'').trim().replace(/^["']|["']$/g,'');
  // File search belongs to the file planner, not a public search engine.
  if(!query||/[a-z]:[\\/]/i.test(query)||/^(?:my\s+)?(?:files?|folders?)\b/i.test(query))return null;
  return {steps:[{op:'search_web',query,browser}]};
 }
 const head=text.match(/^(?:create|make)\s+(?:an?\s+)?(?:empty\s+|text\s+)?file\s+(.+)$/i);
 if(!head)return null;
 let specification=head[1],content='';
 const contents=specification.match(/\s+(?:with\s+(?:text|content)|containing)\s+(["'])([\s\S]*)\1[.!?]*$/i);
 if(contents){content=contents[2];specification=specification.slice(0,contents.index).trim();}
 else if(/\b(with|containing)\b/i.test(specification))return null;
 let destination;
 const named=specification.match(/^(?:named\s+)?["']?([^"'\\/:]+?)["']?\s+in\s+["']?([a-z]:[\\/][^"']*)["']?$/i);
 if(named){const parent=policy.lexical(named[2],{root:true});destination=path.win32.join(parent,named[1].trim());}
 else{const full=specification.replace(/^["']|["']$/g,'');if(!/^[a-z]:[\\/]/i.test(full))return null;destination=full;}
 destination=policy.lexical(destination);
 if(!/\.(?:txt|md|json|csv|log)$/i.test(destination))return null;
 return {steps:[{op:'write',path:destination,text:content}]};
}
function workflow(message,other){const parts=segments(message);if(parts.length>6)throw Error('Use at most six operations in one request.');const steps=[];for(const part of parts){const plan=single(part)||other?.(part);if(!plan)return null;steps.push(...plan.steps);}return steps.length?{steps}:null;}
module.exports={single,workflow,segments};
