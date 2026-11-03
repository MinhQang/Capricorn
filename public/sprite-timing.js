// Sprite timing adapted from Lachy's Capri: see vendor/lachy-capri/LICENSE.md.
((root)=>{
 function idlePlan(elapsed,ambient=true){
  if(!ambient)return {clip:'idle',at:0};
  if(elapsed<18000)return {clip:'idle',at:0};
  if(elapsed<55000)return {clip:'perch',at:18000};
  if(elapsed<110000)return {clip:'laydown',at:55000};
  return {clip:'laydown_sleep',at:110000};
 }
 function frameAt(clip,elapsed,loop=true,rate=30){
  // Quantize the clock, not the duration: a 2-second source loop stays 2 seconds.
  const clock=Math.floor(Math.max(0,elapsed)*Math.min(rate,clip.fps)/1000)*1000/Math.min(rate,clip.fps);
  if(clip.frames){let n=Math.floor(clock*clip.fps/1000);const total=clip.frames.reduce((s,f)=>s+f.hold,0);n=loop?n%total:Math.min(n,total-1);for(const f of clip.frames){if(n<f.hold)return f.tile;n-=f.hold;}}
  const frame=Math.floor(clock*clip.fps/1000+1e-7);
  return loop?frame%clip.count:Math.min(frame,clip.count-1);
 }
 function blinkAt(name,clip,frame,elapsed){
  const source=clip.sourceFrames?.[frame]??frame,from=name==='idle'?9:28;
  const cycle=Math.floor(elapsed/(clip.count/clip.fps*1000));
  if(cycle%3!==1||source<from||source>=from+(name==='idle'?4:8))return null;
  const blink=name==='idle'?'blink':name==='perch'?'perch_blink':name==='laydown'?'laydown_blink':null;
  return blink?{clip:blink,source:source-from}:null;
 }
 function signalDelay(random=Math.random){return 3000+Math.max(0,Math.min(1,random()))*4000;}
 function contain(width,height,boxWidth,boxHeight,padding=12){const scale=Math.min((boxWidth-padding*2)/width,(boxHeight-padding*2)/height);return {x:(boxWidth-width*scale)/2,y:(boxHeight-height*scale)/2,width:width*scale,height:height*scale};}
 function hover(now,enabled=true){if(!enabled)return {x:0,y:0};const angle=Math.floor(now/125)*125/4200*Math.PI*2;return {x:Math.round(Math.sin(angle*.5)*2)/2,y:Math.round(Math.sin(angle)*4)/2};}
 const api={idlePlan,frameAt,blinkAt,signalDelay,contain,hover};if(typeof module==='object'&&module.exports)module.exports=api;else root.CapriSpritesTiming=api;
})(typeof window==='object'?window:globalThis);
