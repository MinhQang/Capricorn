(async()=>{
 const base=process.argv[2];const page=await(await fetch(base)).text();const token=page.match(/name="capri-token" content="([^"]+)"/)[1];
 const headers={'Content-Type':'application/json','X-Capri-Token':token};
 const status=await(await fetch(base+'/api/status',{headers})).json();console.log(JSON.stringify(status));
 for(const message of ['I finished my first task. What should we do next?','Can you remember what I just told you?']){
  const start=Date.now();const r=await fetch(base+'/api/chat',{method:'POST',headers,body:JSON.stringify({model:'qwen3:1.7b',message})});const result=await r.json();console.log(JSON.stringify({status:r.status,elapsedMs:Date.now()-start,...result}));if(!r.ok)throw Error(result.error);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
