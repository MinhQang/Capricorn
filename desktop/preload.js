const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('capriDesktop',Object.freeze({
 introFinished:()=>ipcRenderer.send('capri:intro-finished'),
 setup:()=>ipcRenderer.invoke('capri:setup'),
 setupComplete:later=>ipcRenderer.invoke('capri:setup-complete',Boolean(later)),
 settings:()=>ipcRenderer.invoke('capri:settings'),
 resize:height=>ipcRenderer.invoke('capri:resize',height),
 dashboard:()=>ipcRenderer.invoke('capri:dashboard'),
 point:target=>ipcRenderer.invoke('capri:point',target),
 quit:()=>ipcRenderer.invoke('capri:quit')
}));
