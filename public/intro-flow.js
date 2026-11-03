((root)=>{
 const clamp=value=>Math.max(0,Math.min(1,value)),ease=value=>{const t=clamp(value);return t*t*(3-2*t);};
 function position(tile,progress,origin,target){
  const t=clamp(progress),p=ease((t-.12-tile.seed*.19)/.69),join=ease(t/.22);
  const dx=target.x-origin.x,dy=target.y-origin.y,length=Math.max(1,Math.hypot(dx,dy)),nx=-dy/length,ny=dx/length;
  const envelope=Math.sin(Math.PI*p),noise=tile.noise??tile.seed,grain=tile.grain??.5;
  // Independent fragments travel through one shared curved corridor.
  const jitter=(noise-.5)*94*envelope,along=(grain-.5)*42*envelope;
  const curve={x:origin.x+dx*p,y:origin.y+dy*p-Math.sin(Math.PI*p)*Math.min(95,length*.18)};
  const stream={x:curve.x+nx*jitter+dx/length*along,y:curve.y+ny*jitter+dy/length*along};
  const burst=Math.sin(Math.PI*clamp(t/.22));
  return {x:(tile.x+tile.width/2)*(1-join)+stream.x*join+tile.dx*burst,y:(tile.y+tile.height/2)*(1-join)+stream.y*join+tile.dy*burst,size:(tile.width*(1-ease(t/.15))+(.65+grain*.65)*ease(t/.15))*(1-.5*ease((t-.9)/.1)),depth:.38+noise*.56};
 }
 const api={position};if(typeof module==='object'&&module.exports)module.exports=api;else root.CapriIntroFlow=api;
})(typeof window==='object'?window:globalThis);
