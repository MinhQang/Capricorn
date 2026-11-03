const fs=require('node:fs');const path=require('node:path');
const defaults={model:'qwen3:1.7b',voice:'capri','voice-pitch':3,'voice-speed':95,'voice-delivery':'auto','voice-layers':true,'voice-glitches':true,'digital-effects':true,'motion-style':'cel','idle-activities':true,'animation-rate':30,'read-replies':true,'hud-enabled':true};
const choices={model:['qwen3:1.7b','qwen3:0.6b'],voice:['capri','bright','sly','sharp','af_bella','af_heart'],'voice-delivery':['auto','mischievous','playful','warm','curious','focused','calm','plain'],'motion-style':['cel','emote','still'],'animation-rate':[12,24,30]};
function validate(input){if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid preferences.');for(const [key,value] of Object.entries(input)){if(!Object.hasOwn(defaults,key))throw Error('Unknown preference.');if(choices[key]&&!choices[key].includes(value))throw Error('Invalid '+key);if(typeof defaults[key]==='boolean'&&typeof value!=='boolean')throw Error('Invalid '+key);if(key==='voice-pitch'&&(!Number.isFinite(value)||value< -6||value>6))throw Error('Invalid pitch.');if(key==='voice-speed'&&(!Number.isFinite(value)||value<80||value>140))throw Error('Invalid speed.');}return input;}
function createPreferences(directory){const file=path.join(directory,'preferences.json');let current={...defaults};
 function persist(values){fs.writeFileSync(file+'.tmp',JSON.stringify({version:2,values},null,2));fs.renameSync(file+'.tmp',file);}
 try{const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(saved.version===2)current={...current,...validate(saved.values)};else{current={...current,...validate(saved),'read-replies':true};persist(current);}}catch{}
 return {get:()=>({...current}),patch(input){const next={...current,...validate(input)};persist(next);current=next;return {...current};}};
}
module.exports={createPreferences,defaults,validate};
