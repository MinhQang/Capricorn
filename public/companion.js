(() => {
 const avatar=$('.avatar'),identity=$('.identity');
 const controls=document.createElement('div');controls.className='companion-controls';
 const pop=document.createElement('button');pop.textContent='✧ Capri on your screen';
 pop.hidden=document.body.dataset.desktop==='true';
 const picker=document.createElement('select');picker.setAttribute('aria-label','Preview expression');
 const states={idle:['Watching',0],greeting:['Hello',4],thinking:['Thinking',3],talking:['Talking',5],happy:['Grinning',7],focused:['Focused',4],sleepy:['Resting',1],surprised:['Surprised',6]};
 const auto=document.createElement('option');auto.value='auto';auto.textContent='Automatic expressions';picker.append(auto);
 for(const [key,[label]] of Object.entries(states)){const option=document.createElement('option');option.value=key;option.textContent=label;picker.append(option);}
 const stateLabel=document.createElement('small');controls.append(pop,picker,stateLabel);identity.append(controls);
 const motionSelect=document.createElement('select');motionSelect.id='motion-style';motionSelect.setAttribute('aria-label','Animation style');
 for(const [value,label] of [['cel','Cel motion · 12 / 24 fps'],['emote','Digital emotes · light'],['still','Still image']]){const option=document.createElement('option');option.value=value;option.textContent=label;motionSelect.append(option);}
 const savedMode=localStorage.getItem('capri-motion-style');let motionMode=['cel','emote','still'].includes(savedMode)?savedMode:'cel';motionSelect.value=motionMode;controls.append(motionSelect);
 const previewButton=document.createElement('button');previewButton.textContent='Preview animation';const stopPreview=document.createElement('button');stopPreview.textContent='Stop preview';controls.append(previewButton,stopPreview);
 let previewTimer=null;
 function endPreview(){clearTimeout(previewTimer);previewTimer=null;setState('idle');}
 function preview(){endPreview();picker.value='auto';const steps=[['greeting',1800],['talking',1800],['focused',2200],['happy',3200],['sleepy',2200],['idle',0]];let index=0;function next(){const [state,hold]=steps[index++];setState(state);if(index<steps.length)previewTimer=setTimeout(next,hold);else previewTimer=null;}next();}
 previewButton.onclick=preview;stopPreview.onclick=endPreview;
 motionSelect.onchange=()=>{motionMode=motionSelect.value;localStorage.setItem('capri-motion-style',motionMode);sync();};
 let floating=null,lastReply='Capri online. Pick a target.',automaticState='idle',timer,busy=false,speaking=false,lastActivity=Date.now();
 const channel=new BroadcastChannel('capri-companion');channel.onmessage=e=>{if(e.data?.type==='hello')sync();else if(e.data?.type==='preview')preview();else if(e.data?.type==='stop-preview')endPreview();};
 function sync(){const actor=window.CapriMotion?.get(avatar);actor?.setMode(motionMode);actor?.setState(avatar.dataset.expression,Number($('.portrait-frame').dataset.frame));channel.postMessage({type:'state',expression:avatar.dataset.expression,frame:$('.portrait-frame').dataset.frame,caption:lastReply,motionMode,stateAt:actor?.started||Date.now()});if(!floating||floating.closed)return;const stage=floating.document.querySelector('.companion-avatar');const portrait=floating.document.querySelector('.portrait-frame');if(stage&&!stage.querySelector('.avatar')){const clone=avatar.cloneNode(true);clone.querySelector('canvas')?.remove();clone.classList.remove('has-cels');stage.append(clone);window.CapriMotion?.mount(clone,portrait).then(instance=>{if(floating.closed)instance?.destroy();});floating.addEventListener('pagehide',()=>window.CapriMotion?.get(clone)?.destroy(),{once:true});}const clone=stage?.querySelector('.avatar');if(clone){clone.dataset.expression=avatar.dataset.expression;const instance=window.CapriMotion?.get(clone);instance?.setMode(motionMode);instance?.setState(avatar.dataset.expression,Number($('.portrait-frame').dataset.frame),actor?.started);}if(portrait)portrait.dataset.frame=$('.portrait-frame').dataset.frame;const caption=floating.document.querySelector('.companion-caption');if(caption)caption.textContent=lastReply;}
 function paint(){const state=speaking?'talking':picker.value==='auto'?automaticState:picker.value;avatar.dataset.expression=state;stateLabel.textContent=states[state][0];$('.portrait-frame').dataset.frame=String(states[state][1]);sync();}
 function setState(state,duration=0){clearTimeout(timer);automaticState=state;paint();if(duration)timer=setTimeout(()=>setState(busy?'thinking':'idle'),duration);}
 picker.onchange=paint;
 window.addEventListener('capri:chat-start',()=>{clearTimeout(previewTimer);previewTimer=null;busy=true;setState('thinking');});
 window.addEventListener('capri:chat-finished',()=>{busy=false;if(automaticState==='thinking')setState('idle');});
 window.addEventListener('capri:reply',e=>{lastReply=e.detail;busy=false;setState('talking',4000);});
 window.addEventListener('capri:gesture',e=>{if(states[e.detail])setState(e.detail,3000);});
 window.addEventListener('capri:speaking',e=>{speaking=e.detail;if(!speaking)setState('idle');else paint();});
 let mouthOpen=false;window.addEventListener('capri:audio-level',e=>{if(!speaking)return;const open=e.detail>.035;if(open===mouthOpen)return;mouthOpen=open;$('.portrait-frame').dataset.frame=String(open?5:7);sync();});
 new MutationObserver(sync).observe(avatar,{attributes:true,attributeFilter:['data-expression']});
 for(const event of ['pointerdown','keydown'])window.addEventListener(event,()=>{lastActivity=Date.now();if(automaticState==='sleepy')setState('idle');});
 const idleTimer=setInterval(()=>{if(!busy&&!speaking&&Date.now()-lastActivity>90000&&automaticState!=='sleepy')setState('sleepy');},10000);
 pop.onclick=async()=>{if(floating&&!floating.closed){floating.focus();return;}try{let pinned=false;if('documentPictureInPicture'in window){try{floating=await window.documentPictureInPicture.requestWindow({width:340,height:540});pinned=true;}catch{floating=null;}}if(!floating)floating=window.open('','capri-companion','popup,width=340,height=540');if(!floating){toast('Allow pop-up windows to show Capri.');return;}const doc=floating.document;doc.title='Capri · Companion';doc.head.replaceChildren();for(const file of ['/style.css','/companion.css']){const link=doc.createElement('link');link.rel='stylesheet';link.href=new URL(file,location.href).href;doc.head.append(link);}doc.body.className='companion-window';doc.body.replaceChildren();const stage=doc.createElement('div');stage.className='companion-avatar';const face=doc.createElement('div');face.className='portrait-frame';face.setAttribute('aria-label','Capri expression');const caption=doc.createElement('p');caption.className='companion-caption';caption.setAttribute('aria-live','polite');const note=doc.createElement('small');note.textContent=pinned?'Drag this window to place Capri.':'Separate character window; always-on-top is unavailable in this browser.';const close=doc.createElement('button');close.textContent='Close companion';close.onclick=()=>floating.close();doc.body.append(stage,face,caption,note,close);sync();}catch(e){toast(e.message);}};
 setState('greeting',3000);
 if(new URLSearchParams(location.search).get('preview')==='cel')setTimeout(preview,1500);
 window.addEventListener('pagehide',()=>{clearTimeout(previewTimer);clearTimeout(timer);clearInterval(idleTimer);channel.close();if(floating&&!floating.closed)floating.close();});
})();
