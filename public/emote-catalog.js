// Original bitmap expressions from mochiiwuff/capri-desktop, pinned in assets/mochi/SOURCE.json.
// Contexts follow upstream chat.js mood(), MOOD_FACE, capri.js cues and fx.js GRAB_FRAMES.
((root)=>{
 const groups={
  face:{look:'Listening / neutral',aside:'Thinking / failed request',calm:'Quiet / reassuring',laugh:'Happy / playful',smug:'Curious / confident',wide:'Surprised / dizzy',many:'Angry / intense'},
  cutin:{grin:'Victory / excited reply',laugh:'Victory / laughter',eyes:'Pointing / target acquired',many:'Intense stare',look:'Mischievous glance'},
  intro:{grab:'Greeting / screen grab',mouth1:'Speech / mouth slightly open',mouth2:'Speech / mouth half open',mouth3:'Speech / mouth wide open',wave1:'Greeting / wave left',wave2:'Greeting / wave right',wave3:'Greeting / wave up',smear:'Greeting / arm transition',happy:'Greeting / joyful eyes'},
  capri:{face:'Grinning / excited reply',cutout:'Complete body cutout',full:'Reference image / incomplete arm'},
  user:{thinking:'User reference / thinking',eyes:'User reference / attentive eyes',wink:'User reference / wink'}
 };
 const upsideDown=new Set(['face-aside','face-calm','face-smug','face-wide']);
 const entries=Object.entries(groups).flatMap(([group,items])=>Object.entries(items).map(([name,label])=>({id:group+'-'+name,file:group+'-'+name+(['intro','user'].includes(group)?'.webp':'.png'),group,label,rotation:upsideDown.has(group+'-'+name)?180:0})));
 const byId=Object.fromEntries(entries.map(e=>[e.id,e]));
 function reply(text){if(/(?:ha){2,}|\blol\b|\blmao\b/i.test(text))return 'face-laugh';if(text.includes('!'))return 'capri-face';if(text.trim().endsWith('?'))return 'face-smug';return 'face-look';}
 const situations={greeting:['intro-grab','intro-wave1','intro-wave2','intro-wave3','intro-smear','intro-happy'],success:['cutin-grin','cutin-laugh','capri-face'],target:['cutin-eyes','cutin-look'],failure:['face-aside','face-wide','user-thinking'],calm:['face-calm','face-look'],curious:['face-smug','cutin-look','user-thinking','user-eyes'],surprise:['face-wide','cutin-many'],intense:['face-many','cutin-many'],playful:['face-laugh','cutin-laugh','user-wink'],body:['capri-full','capri-cutout']};
 const counters={};function situation(name){const pool=situations[name]||situations.calm;const index=counters[name]||0;counters[name]=index+1;return pool[index%pool.length];}
 function contextual(text,{user='',handled=false,ok=true,type=''}={}){
  if(handled)return situation(!ok?'failure':type==='open'?'target':'success');
  const combined=user+' '+text;
  if(/\b(angry|furious|annoyed|rage)\b/i.test(combined))return situation('intense');
  if(/\b(sad|lonely|worried|tired|comfort|relax)\b/i.test(combined))return situation('calm');
  if(/\b(wow|surpris|unbelievable|shocked)/i.test(combined))return situation('surprise');
  if(/\b(hello|hi|hey|good morning)\b/i.test(user))return situation('greeting');
  if(/(?:ha){2,}|\blol\b|\bjok[eis]/i.test(combined))return situation('playful');
  if(text.trim().endsWith('?'))return situation('curious');
  return reply(text);
 }
 const api={entries,byId,reply,contextual,situation,situations};if(typeof module==='object'&&module.exports)module.exports=api;else root.CapriEmotes=api;
})(typeof window==='object'?window:globalThis);
