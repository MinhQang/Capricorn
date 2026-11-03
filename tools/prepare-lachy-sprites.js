// Development-only image conversion. Never downloads or runs upstream application code.
const {_electron:electron}=require('@playwright/test');
const fs=require('node:fs');const path=require('node:path');
const revision=fs.readFileSync(path.join(__dirname,'..','.cache/lachy-reference/revision.txt'),'utf8').trim();
const definitions={idle:[16,8],blink:[4,8],blink_glitch:[4,8],grin:[16,8],glitch:[10,15],sleep:[16,6],wake:[13,15],perch:[60,30],perch_blink:[8,30],perch_blink_glitch:[8,30],perch_glitch:[10,15],perch_talk:[60,30],perch_music:[60,30],mouth:[5,12],walk:[12,12],dance:[16,16],arrive:[14,15],dangle:[24,10],face:[1,1],laydown:[60,30],laydown_blink:[8,30],laydown_talk:[60,30],laydown_sleep:[60,30]};
(async()=>{
 const env={...process.env,CAPRI_NODE_PATH:process.execPath,CAPRI_DATA_DIR:path.join(__dirname,'..','.cache','sprite-build')};delete env.ELECTRON_RUN_AS_NODE;
 const app=await electron.launch({args:[path.join(__dirname,'..','desktop','main.js')],env,timeout:45000});
 try{
  const page=await app.firstWindow();await page.waitForLoadState('domcontentloaded');
  await page.route('**/reference-sprite/*.png',route=>{const name=new URL(route.request().url()).pathname.split('/').at(-1);if(!Object.hasOwn(definitions,name.slice(0,-4)))return route.abort();return route.fulfill({contentType:'image/png',body:fs.readFileSync(path.join(__dirname,'..','.cache/lachy-reference/sprites',name))});});
  const manifest={version:1,source:'lachydotmcg/capri-desktop',revision,width:224,height:256,columns:8,clips:{}};
  for(const [name,[count,sourceFps]] of Object.entries(definitions)){
   const result=await page.evaluate(async({name,count,sourceFps})=>{
    const img=new Image();img.src='/reference-sprite/'+name+'.png';await img.decode();
    const fps=Math.min(sourceFps,30),frames=Math.ceil(count*fps/sourceFps),width=224,height=256,columns=8;
    const canvas=document.createElement('canvas');canvas.width=width*columns;canvas.height=height*Math.ceil(frames/columns);const ctx=canvas.getContext('2d');
    const cellWidth=img.naturalWidth/count,sourceFrames=[];
    for(let i=0;i<frames;i++){
     const source=Math.min(count-1,Math.floor(i*sourceFps/fps));sourceFrames.push(source);
     let tall=210*1.11,shiftX=0,shiftY=0;
     if(name.startsWith('perch')){tall=210;shiftX=-26/384*210;shiftY=36/384*210;}
     if(name.startsWith('laydown')){tall=250/384*210;shiftY=94/384*210;}
     if(name==='face')tall=210;
     const wide=tall*cellWidth/img.naturalHeight,x=(i%columns)*width,y=Math.floor(i/columns)*height;
     ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.drawImage(img,source*cellWidth,0,cellWidth,img.naturalHeight,x+(width-wide)/2+shiftX,y+(height-tall)/2+shiftY,wide,tall);ctx.restore();
    }
    return {png:canvas.toDataURL('image/png').split(',')[1],fps,count:frames,sourceFrames};
   },{name,count,sourceFps});
   fs.writeFileSync(path.join(__dirname,'..','public/assets/lachy',name+'.png'),Buffer.from(result.png,'base64'));
   manifest.clips[name]={file:name+'.png',count:result.count,fps:result.fps,sourceFps,sourceCount:count,sourceFrames:result.sourceFrames};
  }
  // Reuse the checked-in pointing pose; the legacy shader atlas is retired.
  manifest.clips.point=JSON.parse(fs.readFileSync(path.join(__dirname,'..','public/assets/lachy/manifest.json'),'utf8')).clips.point;
  fs.writeFileSync(path.join(__dirname,'..','public/assets/lachy/manifest.json'),JSON.stringify(manifest,null,2));
  console.log(JSON.stringify({revision,clips:Object.keys(manifest.clips).length,frames:Object.values(manifest.clips).reduce((n,c)=>n+c.count,0)}));
 }finally{await app.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
