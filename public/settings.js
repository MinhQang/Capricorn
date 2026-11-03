const $=s=>document.querySelector(s),token=$('meta[name="capri-token"]').content;
async function api(route,method='GET',data){const response=await fetch('/api/'+route,{method,headers:{'Content-Type':'application/json','X-Capri-Token':token},body:data?JSON.stringify(data):undefined});const value=await response.json();if(!response.ok)throw Error(value.error);return value;}
function toast(text){$('#settings-status').textContent=text;}
window.addEventListener('DOMContentLoaded',async()=>{
 await capriPreferencesReady;
 const emotes=document.createElement('optgroup');emotes.label='All '+CapriEmotes.entries.length+' imported expressions and poses';for(const entry of CapriEmotes.entries){const option=document.createElement('option');option.value='emote:'+entry.id;option.textContent=entry.id+' - '+entry.label;emotes.append(option);}$('#pose-preview').append(emotes);
 for(const id of Object.keys(CapriPreferences.get())){const el=document.getElementById(id);if(!el)continue;el.addEventListener('change',async()=>{try{const patch={[id]:el.type==='checkbox'?el.checked:el.type==='range'||id==='animation-rate'?Number(el.value):el.value};if(id==='voice'){const tuned=el.value==='capri';Object.assign(patch,{'voice-pitch':tuned?3:0,'voice-speed':tuned?95:100,'voice-layers':tuned});}await CapriPreferences.save(patch);toast('Saved on this PC.');}catch(error){toast(error.message);}});}
 $('#test-voice').onclick=()=>{CapriPreferences.send({type:'test-voice'});$('#voice-test-status').textContent='Starting local voice...';};
 $('#stop-test-voice').onclick=()=>CapriPreferences.send({type:'stop-voice'});
 $('#pose-preview').onchange=()=>CapriPreferences.send({type:'preview-pose',state:$('#pose-preview').value});
 $('#setup-engines').onclick=()=>window.capriDesktop?.setup();
 $('#check-engines').onclick=async()=>{try{const value=await api('status');$('#engine-status').textContent=(value.ollama?'Ollama online':'Ollama offline')+' / '+(value.speech.ttsReady?'Speech ready':'Speech setup needed');}catch(error){toast(error.message);}};
 $('#dashboard').onclick=()=>window.capriDesktop?.dashboard();
 $('#forget-history').onclick=async()=>{try{await api('history','DELETE',{});CapriPreferences.send({type:'history-cleared'});toast('Chat history cleared.');}catch(error){toast(error.message);}};
 $('#hide-settings').onclick=()=>window.close();
 document.body.dataset.ready='true';CapriPreferences.send({type:'settings-ready'});
 window.addEventListener('capri:settings-command',event=>{const value=event.detail;if(value.type==='voice-status')$('#voice-test-status').textContent=value.text;if(value.type==='voice-busy'){$('#test-voice').disabled=value.busy;$('#test-voice').textContent=value.label;}});
});
