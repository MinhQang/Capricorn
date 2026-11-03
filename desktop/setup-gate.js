async function setupReady(base,fetcher=fetch){
 const page=await fetcher(base+'/setup',{signal:AbortSignal.timeout(5000)});if(!page.ok)return false;
 const token=(await page.text()).match(/name="capri-token" content="([^"]+)"/)?.[1];if(!token)return false;
 const response=await fetcher(base+'/api/setup',{headers:{'X-Capri-Token':token},signal:AbortSignal.timeout(10000)});if(!response.ok)return false;
 const status=await response.json();return status.ready===true&&status.phase!=='downloading'&&status.phase!=='error';
}
module.exports={setupReady};
