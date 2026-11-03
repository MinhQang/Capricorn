/* Local Canvas 2D sprite player. Art/timing credit: lachydotmcg/capri-desktop.
 * Full notices in public/vendor/lachy-capri/LICENSE.md and THIRD_PARTY_NOTICES.md. */
(() => {
 const budget=24*1024*1024;
 class SpriteActor {
  constructor(avatar){
   this.avatar=avatar;this.mode='cel';this.state=avatar.dataset.expression||'idle';this.started=Date.now();this.direction=1;this.ambient=true;this.rate=30;this.face=0;this.level=0;
   this.width=308;this.height=255;this.cache=new Map();this.pending=new Map();this.failed=new Set();this.drawCount=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
   this.canvas=document.createElement('canvas');this.canvas.width=this.width;this.canvas.height=this.height;this.canvas.className='cel-character';this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','Animated Capri character');avatar.append(this.canvas);this.ctx=this.canvas.getContext('2d');
   this.observer=new MutationObserver(()=>this.setState(avatar.dataset.expression||'idle'));this.observer.observe(avatar,{attributes:true,attributeFilter:['data-expression']});
  }
  async init(){
   const response=await fetch('/assets/lachy/manifest.json');if(!response.ok)throw Error('Sprite manifest missing');this.manifest=await response.json();
   if(!await this.load('idle'))throw Error('Idle sprite missing');await this.load('mouth');this.avatar.classList.add('has-cels');this.tick();return this;
  }
  async load(name){
   if(this.destroyed||this.failed.has(name)||!this.manifest.clips[name])return null;
   if(this.cache.has(name)){const value=this.cache.get(name);value.used=Date.now();return value.bitmap;}
   if(this.pending.has(name))return this.pending.get(name);
   const promise=(async()=>{try{
    const response=await fetch('/assets/lachy/'+this.manifest.clips[name].file);if(!response.ok)throw Error('Sprite missing');
    const bitmap=await createImageBitmap(await response.blob());if(this.destroyed){bitmap.close();return null;}
    this.cache.set(name,{bitmap,bytes:bitmap.width*bitmap.height*4,used:Date.now()});this.trim();return bitmap;
   }catch{this.failed.add(name);return null;}finally{this.pending.delete(name);}})();this.pending.set(name,promise);return promise;
  }
  async loadEmote(id){
   const entry=window.CapriEmotes?.byId[id],key='@'+id;if(!entry||this.destroyed||this.failed.has(key))return null;
   if(this.cache.has(key)){this.cache.get(key).used=Date.now();return this.cache.get(key).bitmap;}if(this.pending.has(key))return this.pending.get(key);
   const promise=(async()=>{try{const response=await fetch('/assets/mochi/'+entry.file);if(!response.ok)throw Error('Emote unavailable');const bitmap=await createImageBitmap(await response.blob(),{resizeWidth:this.width,resizeQuality:'medium'});if(this.destroyed){bitmap.close();return null;}this.cache.set(key,{bitmap,bytes:bitmap.width*bitmap.height*4,used:Date.now()});this.trim();return bitmap;}catch{this.failed.add(key);return null;}finally{this.pending.delete(key);}})();this.pending.set(key,promise);return promise;
  }
  setEmote(id,duration=2500){if(!window.CapriEmotes?.byId[id])return;this.emote=id;this.emoteUntil=duration?Date.now()+duration:Infinity;this.loadEmote(id).then(()=>{if(!this.destroyed){clearTimeout(this.timer);this.tick();}});}
  emotePlan(now,quiet){
   if(this.speaking){const sequence=['intro-grab','intro-mouth1','intro-mouth3','intro-mouth2','intro-mouth1','intro-mouth2'];return sequence[quiet?0:Math.floor((now-this.talkStarted)*12/1000)%sequence.length];}
   if(this.state==='greeting'&&!quiet){const wave=['intro-grab','intro-smear','intro-wave1','intro-wave3','intro-wave2','intro-wave3','intro-happy'];const n=Math.floor((now-this.started)/160);if(n<wave.length)return wave[n];}
   if(this.emote&&now<this.emoteUntil)return this.emote;
   // capri-full is an upstream reference with a missing arm. Use the complete
   // cutout as the held body; keep the reference available only for preview.
   if(this.mode==='emote'&&this.state==='idle')return 'capri-cutout';
   // Cel/still modes return to the authored full-body sprite pose when quiet.
   return null;
  }
  viewport(emote){const body=!emote||['capri-full','capri-cutout'].includes(emote),height=body?255:emote==='user-thinking'?220:308;if(height===this.height)return;this.height=height;this.canvas.height=height;const stage=this.avatar.closest('.stage');if(stage)stage.style.height=height+'px';this.key=null;window.dispatchEvent(new CustomEvent('capri:layout-change'));}
  drawEmote(id){const entry=this.cache.get('@'+id);if(!entry)return;entry.used=Date.now();const b=entry.bitmap,expression=window.CapriEmotes.byId[id];const box=CapriSpritesTiming.contain(b.width,b.height,this.width,this.height,12);this.canvas.dataset.fit=JSON.stringify(box);this.ctx.save();this.ctx.translate(this.width/2,this.height/2);this.ctx.rotate((expression.rotation||0)*Math.PI/180);this.ctx.drawImage(b,-box.width/2,-box.height/2,box.width,box.height);this.ctx.restore();}
  trim(){
   let bytes=[...this.cache.values()].reduce((s,v)=>s+v.bytes,0);
   for(const [name,value] of [...this.cache].sort((a,b)=>a[1].used-b[1].used)){
    if(bytes<=budget)break;if(['idle','mouth',this.wanted,'@'+this.wantedEmote].includes(name))continue;value.bitmap.close();this.cache.delete(name);bytes-=value.bytes;
   }
   this.canvas.dataset.residentBytes=String(bytes);this.canvas.dataset.loadedClips=String(this.cache.size);
  }
  setState(state,face=this.face,at=Date.now()){
   this.face=face;if(state===this.state)return;
   // Keep her seated for the next line instead of jumping between two unrelated bodies.
   if(this.state==='idle')this.posture=CapriSpritesTiming.idlePlan(Date.now()-this.started,this.ambient).clip;
   if(state==='focused'||state==='greeting')this.posture='idle';
   this.state=state;this.started=Number.isFinite(at)?at:Date.now();this.key=null;
   const expression={greeting:'intro-grab',thinking:'face-aside',happy:'cutin-laugh',focused:'cutin-eyes',sleepy:'face-calm',surprised:'face-wide',glitching:'cutin-many',curious:'face-smug',mischievous:'cutin-look',angry:'face-many'}[state];
   if(state.startsWith('emote:'))this.setEmote(state.slice(6),5000);else if(expression)this.setEmote(expression,2200);else if(state!=='talking')this.emote=null;
   if(state==='greeting')for(const id of ['intro-grab','intro-smear','intro-wave1','intro-wave2','intro-wave3','intro-happy'])this.loadEmote(id);
   if(this.cache.has('idle')){clearTimeout(this.timer);this.tick();}
  }
  prepareSpeech(){if(!this.speaking&&!this.preparedSpeechMood&&Date.now()<this.emoteUntil)this.preparedSpeechMood=this.emote;for(const id of ['intro-grab','intro-mouth1','intro-mouth2','intro-mouth3'])this.loadEmote(id);if(this.manifest)this.load('mouth');}
  cancelPreparation(){if(!this.speaking)this.preparedSpeechMood=null;}
  setSpeaking(active){if(Boolean(active)===Boolean(this.speaking))return;if(active){this.speechMood=this.preparedSpeechMood||(Date.now()<this.emoteUntil?this.emote:null);this.preparedSpeechMood=null;}this.speaking=Boolean(active);this.talkStarted=Date.now();this.setState(active?'talking':'idle');if(!active){if(this.speechMood)this.setEmote(this.speechMood,2200);this.speechMood=null;this.preparedSpeechMood=null;}if(this.cache.has('idle')){clearTimeout(this.timer);this.tick();}}
  beginGlitch(duration=360){this.glitchStarted=Date.now();this.glitchUntil=this.glitchStarted+duration;}
  signalGlitch(){if(this.mode==='still'||this.reduced.matches||document.querySelector('#digital-effects')?.checked===false||!this.cache.has('idle'))return;this.beginGlitch();clearTimeout(this.timer);this.tick();}
  setFace(face){this.face=face;}
  setAudioLevel(level){this.level=Math.max(0,Number(level)||0);}
  setDirection(direction){this.direction=direction<0?-1:1;this.key=null;}
  setMode(mode){if(!['cel','emote','still'].includes(mode)||mode===this.mode)return;this.mode=mode;this.key=null;if(this.cache.has('idle')){clearTimeout(this.timer);this.tick();}}
  setAmbient(enabled){this.ambient=Boolean(enabled);this.started=Date.now();this.key=null;}
  setRate(rate){this.rate=[12,24,30].includes(rate)?rate:30;this.key=null;}
  plan(age,quiet){
   if(this.state==='idle')return quiet?{clip:'idle',at:0}:CapriSpritesTiming.idlePlan(age,this.ambient);
   const clips={greeting:'idle',thinking:this.posture==='perch'?'perch':'idle',talking:this.posture==='perch'?'perch':this.posture==='laydown'?'laydown':'idle',happy:'idle',focused:'point',sleepy:'sleep',surprised:'idle',sitting:'perch',lying:'laydown',dancing:'perch',walking:'idle',blinking:'idle',glitching:'idle',waking:'idle',dangling:'perch'};
   const clip=clips[this.state]||'idle',sheet=this.manifest.clips[clip];
   if(['greeting','surprised','glitching','waking','blinking'].includes(this.state)&&age>=sheet.count/sheet.fps*1000)return {clip:'idle',at:sheet.count/sheet.fps*1000};
   return {clip,at:0};
  }
  draw(name,frame){
   const entry=this.cache.get(name);if(!entry)return;entry.used=Date.now();const m=this.manifest,scale=Math.min(this.width/m.width,this.height/m.height),w=m.width*scale,h=m.height*scale;
   this.ctx.drawImage(entry.bitmap,(frame%m.columns)*m.width,Math.floor(frame/m.columns)*m.height,m.width,m.height,(this.width-w)/2,(this.height-h)/2,w,h);
  }
  tick(){
   if(this.destroyed)return;
   if(this.avatar.dataset.customImage==='true'){this.canvas.hidden=true;this.avatar.classList.remove('has-cels');return;}
   if(document.hidden){this.timer=setTimeout(()=>this.tick(),500);return;}
   const now=Date.now(),age=Math.max(0,now-this.started),quiet=this.mode==='still'||this.reduced.matches,plan=this.plan(age,quiet);
   let name=plan.clip,sheet=this.manifest.clips[name],frame=name==='point'?Math.max(0,sheet.count-2):0;
   this.wanted=name;
   if(!this.cache.has(name)){this.load(name);name='idle';sheet=this.manifest.clips.idle;frame=0;}
   this.wantedEmote=this.emotePlan(now,quiet);if(this.wantedEmote)this.loadEmote(this.wantedEmote);
   const emote=this.cache.has('@'+this.wantedEmote)?this.wantedEmote:null;this.viewport(emote);const body=!emote||['capri-cutout','capri-full'].includes(emote);const drift=CapriSpritesTiming.hover(now,!quiet&&this.ambient&&body&&this.state==='idle');
   // Compare loaded body poses, not mouth frames or the blink overlays.
   const bodyPose=emote?(this.speaking?'speech':this.state==='greeting'?'greeting':emote):(!this.cache.has(plan.clip)?'idle':plan.clip);
   if(this.lastBodyPose!==bodyPose){const previous=this.lastBodyPose;this.lastBodyPose=bodyPose;this.canvas.dataset.posture=bodyPose;if(previous&&!quiet&&document.querySelector('#digital-effects')?.checked!==false){this.beginGlitch();window.dispatchEvent(new CustomEvent('capri:pose-change',{detail:{from:previous,to:bodyPose}}));}}
   const mouth=this.state==='talking'&&!emote&&name==='idle';if(mouth)this.load('mouth');
   const mouthFrame=quiet?0:[0,2,4,1,3,2][Math.floor((now-(this.talkStarted||this.started))*12/1000)%6];
   const glitch=!quiet&&document.querySelector('#digital-effects')?.checked!==false&&now<(this.glitchUntil||0)?Math.max(0,Math.floor((now-this.glitchStarted)*30/1000)):-1;
   const key=[name,frame,emote,mouth?mouthFrame:'',this.direction,this.mode,glitch,drift.x,drift.y].join(':');
   if(key!==this.key){this.key=key;this.ctx.clearRect(0,0,this.width,this.height);this.ctx.save();this.ctx.translate(drift.x,drift.y);if(name==='point'&&this.direction===-1){this.ctx.translate(this.width,0);this.ctx.scale(-1,1);}this.draw(name,frame);if(mouth&&this.cache.has('mouth'))this.draw('mouth',mouthFrame);this.ctx.restore();
    if(emote){this.ctx.clearRect(0,0,this.width,this.height);this.ctx.save();this.ctx.translate(drift.x,drift.y);this.drawEmote(emote);this.ctx.restore();}this.canvas.dataset.hover=JSON.stringify(drift);if(this.lastEmote!==emote){this.lastEmote=emote;window.dispatchEvent(new CustomEvent('capri:emote-change',{detail:emote}));}
    if(glitch>=0){this.ctx.save();for(let i=0;i<7;i++){const y=(25+i*43+glitch*17)%(this.height-18),h=5+(i%3)*4,shift=(i+glitch)%2?16:-18;this.ctx.drawImage(this.canvas,0,y,this.width,h,shift,y,this.width,h);this.ctx.globalAlpha=.65;this.ctx.fillStyle=i%2?'#69f8e2':'#ff477d';this.ctx.fillRect((i*47+glitch*29)%180,y,48+i*5,2);this.ctx.globalAlpha=1;}this.ctx.restore();}
    this.canvas.dataset.signal=glitch>=0?'tear':'clear';
    this.canvas.dataset.draws=String(++this.drawCount);this.canvas.dataset.act=name;this.canvas.dataset.cel=String(frame);this.canvas.dataset.phase='hold';this.canvas.dataset.renderer='sprite-sheets';this.canvas.dataset.emote=emote||'none';this.canvas.dataset.presentation=emote&&!['capri-full','capri-cutout'].includes(emote)?'expression':'body';this.canvas.dataset.mouth=this.speaking&&emote?emote:mouth&&this.cache.has('mouth')?String(mouthFrame):'off';
   }
   const fps=quiet?4:Math.min(this.rate,Math.max(4,body&&this.ambient?8:0,this.speaking?12:0,this.state==='greeting'?12:0,glitch>=0?30:0));this.canvas.dataset.fps=String(quiet?0:fps);this.trim();
   const interval=1000/fps;this.timer=setTimeout(()=>this.tick(),Math.max(8,interval-(age%interval)));
  }
  destroy(){this.destroyed=true;clearTimeout(this.timer);this.observer.disconnect();for(const value of this.cache.values())value.bitmap.close();this.cache.clear();}
 }
 window.CapriSpriteActor=SpriteActor;
})();
