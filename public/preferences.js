// Shared settings; the hidden controls in the pet are the audio engine's live values.
(() => {
 const channel=new BroadcastChannel('capri-preferences');let values={},closed=false;
 function apply(next){const previous=values;values={...next};for(const [id,value] of Object.entries(values)){const el=document.getElementById(id);if(!el)continue;if(el.type==='checkbox')el.checked=value;else el.value=String(value);}document.body.classList.toggle('model-frame-hidden',values['hud-enabled']===false);const actor=window.CapriMotion?.get(document.querySelector('.avatar'));if(previous['motion-style']!==values['motion-style'])actor?.setMode?.(values['motion-style']);if(previous['idle-activities']!==values['idle-activities'])actor?.setAmbient?.(values['idle-activities']);if(previous['animation-rate']!==values['animation-rate'])actor?.setRate?.(values['animation-rate']);window.dispatchEvent(new CustomEvent('capri:preferences',{detail:values}));}
 async function save(patch){const next=await api('preferences','PATCH',patch);apply(next);channel.postMessage({type:'preferences',values:next});return next;}
 channel.onmessage=event=>{if(event.data.type==='preferences')apply(event.data.values);else window.dispatchEvent(new CustomEvent('capri:settings-command',{detail:event.data}));};
 window.CapriPreferences={save,get:()=>({...values}),send:message=>{if(!closed)channel.postMessage(message);}};
 window.capriPreferencesReady=api('preferences').then(apply).catch(error=>toast(error.message));
 window.addEventListener('pagehide',()=>{closed=true;channel.close();});
})();
