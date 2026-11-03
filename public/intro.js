(() => {
 const canvas=document.querySelector('#arrival'),ctx=canvas.getContext('2d'),image=document.querySelector('#eyes-source'),heading=document.querySelector('#signature');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let stopped=false,last=0,started,frame;
 const query=new URLSearchParams(location.search),width=innerWidth,height=innerHeight;
 const resolution=Math.min(1,1600/width,1000/height);canvas.width=Math.round(width*resolution);canvas.height=Math.round(height*resolution);ctx.scale(resolution,resolution);
 const finite=(key,fallback)=>{const value=Number(query.get(key));return query.has(key)&&Number.isFinite(value)?value:fallback;};
 const dock={x:Math.max(0,Math.min(width-80,finite('x',width-324))),y:Math.max(0,Math.min(height-80,finite('y',height-316))),width:Math.max(80,Math.min(width,finite('w',308))),height:Math.max(80,Math.min(height,finite('h',255)))};
 const eyeWidth=Math.min(650,width*.74),eyeHeight=eyeWidth*.48,eyes={x:(width-eyeWidth)/2,y:height*.4-eyeHeight/2,width:eyeWidth,height:eyeHeight};
 heading.style.top=Math.min(height-135,eyes.y+eyeHeight+22)+'px';
 const source={x:0,y:0,width:0,height:0},tiles=[];
 function phase(value){if(document.body.dataset.phase!==value)document.body.dataset.phase=value;}
 function finish(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);phase('complete');window.capriDesktop?.introFinished();}
 const ease=t=>t*t*(3-2*t),clamp=t=>Math.max(0,Math.min(1,t));
 function drawEyes(){ctx.drawImage(image,source.x,source.y,source.width,source.height,eyes.x,eyes.y,eyes.width,eyes.height);}
 function shatter(progress){
  const origin={x:eyes.x+eyes.width/2,y:eyes.y+eyes.height/2},target={x:dock.x+dock.width/2,y:dock.y+dock.height/2};
  const colors=['#69f8e2','#a663ff','#00fa74'];
  for(const tile of tiles){const point=CapriIntroFlow.position(tile,progress,origin,target);ctx.globalAlpha=point.depth;
   if(progress<.18)ctx.drawImage(image,tile.sx,tile.sy,tile.sw,tile.sh,point.x-point.size/2,point.y-point.size/2,point.size,point.size);
   else{ctx.fillStyle=colors[Math.floor(tile.grain*colors.length)];ctx.fillRect(point.x-point.size/2,point.y-point.size/2,point.size,point.size);}
  }
  ctx.globalAlpha=1;if(progress>.91){ctx.fillStyle='#edfff9';ctx.beginPath();ctx.arc(target.x,target.y,2+clamp((progress-.91)/.09)*2,0,Math.PI*2);ctx.fill();}
 }

 function crt(t){
  const center=dock.y+dock.height/2,open=ease(clamp((t-.18)/.5)),w=Math.max(3,dock.width*.92*ease(clamp(t/.22))),h=Math.max(2,(dock.height-12)*open);
  ctx.fillStyle=t<.2?'#edfff9':`rgba(232,255,249,${Math.max(0,.72*(1-t))})`;ctx.fillRect(dock.x+(dock.width-w)/2,center-h/2,w,h);
  ctx.strokeStyle=`rgba(105,248,226,${1-t})`;ctx.lineWidth=2;ctx.strokeRect(dock.x+6,dock.y+6,dock.width-12,dock.height-12);
  if(t>.25){ctx.fillStyle=`rgba(139,53,255,${.22*(1-t)})`;for(let y=dock.y+8;y<dock.y+dock.height-8;y+=6)ctx.fillRect(dock.x+8,y,dock.width-16,1);}
 }
 function tick(now){
  if(stopped)return;frame=requestAnimationFrame(tick);if(now-last<1000/30)return;last=now;const age=now-started;ctx.clearRect(0,0,width,height);
  if(reduce.matches||document.body.dataset.effects==='off'){phase('eyes');drawEyes();if(age>1100)finish();return;}
  if(age<1500){phase('eyes');drawEyes();}
  else if(age<2700){phase('fragment');shatter((age-1500)/1200);}
  else if(age<3200){phase('crt');crt((age-2700)/500);}
  else finish();
 }
 async function start(){
  try{
   const token=document.querySelector('meta[name="capri-token"]').content;
   const preferences=fetch('/api/preferences',{headers:{'X-Capri-Token':token},signal:AbortSignal.timeout(1000)}).then(r=>r.ok?r.json():{}).catch(()=>({}));
   await image.decode();const prefs=await preferences;if(prefs['digital-effects']===false)document.body.dataset.effects='off';
   source.width=image.naturalWidth;source.y=image.naturalHeight*.26;source.height=image.naturalHeight*.48;
   const random=(index,salt)=>{let value=Math.imul(index+salt,0x45d9f3b);value^=value>>>16;value=Math.imul(value,0x45d9f3b);value^=value>>>16;return (value>>>0)/4294967296;};
   const columns=96,rows=Math.round(columns*.48);let index=0;
   for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){const seed=random(index,17);tiles.push({noise:random(index,51),grain:random(index,109),index:index++,seed,columns,rows,u:column/columns,v:row/rows,x:eyes.x+eyes.width*column/columns,y:eyes.y+eyes.height*row/rows,width:eyes.width/columns+.3,height:eyes.height/rows+.3,sx:source.width*column/columns,sy:source.y+source.height*row/rows,sw:source.width/columns,sh:source.height/rows,dx:Math.sin(seed*91)*95,dy:Math.cos(seed*53)*65});}
   document.body.dataset.tileCount=String(tiles.length);document.body.dataset.streams='1';document.body.dataset.fps='30';started=performance.now();tick(started);
  }catch{finish();}
 }
 window.addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(frame);});start();
})();
