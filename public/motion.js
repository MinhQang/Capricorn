/* Play only Lachy's drawn sprite sheets; no legacy animation fallback. */
(() => {
 const actors=new WeakMap();
 async function mount(avatar){
  if(actors.has(avatar))return actors.get(avatar);
  avatar.classList.add('sprite-only');
  if(!window.CapriSpriteActor)return null;
  const actor=new window.CapriSpriteActor(avatar);actors.set(avatar,actor);
  try{return await actor.init();}
  catch(error){actor.destroy();actor.canvas.remove();avatar.classList.remove('has-cels');actors.delete(avatar);console.warn('Capri sprites unavailable:',error.message);return null;}
 }
 window.CapriMotion={mount,get:avatar=>actors.get(avatar)};
 document.querySelectorAll('.avatar').forEach(a=>mount(a));
 window.addEventListener('pagehide',()=>document.querySelectorAll('.avatar').forEach(a=>actors.get(a)?.destroy()));
})();
