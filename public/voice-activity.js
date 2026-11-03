// Bounded local utterance segmentation. STT still performs its own speech filtering.
((root)=>{
 class UtteranceDetector {
  constructor(rate){this.rate=rate;this.noise=.002;this.reset();}
  reset(){this.pre=[];this.parts=[];this.total=0;this.voiced=0;this.quiet=0;this.started=false;}
  push(samples){
   const duration=samples.length/this.rate;let energy=0;for(const x of samples)energy+=x*x;const rms=Math.sqrt(energy/samples.length),speech=rms>Math.max(.012,this.noise*3);
   if(!speech)this.noise=.97*this.noise+.03*Math.min(rms,.008);
   const copy=samples.slice();
   if(!this.started){this.pre.push(copy);while(this.pre.reduce((n,p)=>n+p.length,0)>this.rate*.4)this.pre.shift();if(!speech)return null;this.started=true;this.parts=this.pre;this.pre=[];this.total=this.parts.reduce((n,p)=>n+p.length,0);}
   else{this.parts.push(copy);this.total+=copy.length;}
   this.voiced+=speech?duration:0;this.quiet=speech?0:this.quiet+duration;
   if(this.quiet<.85&&this.total<this.rate*20)return null;
   let result=null;if(this.voiced>=.32){result=new Float32Array(this.total);let offset=0;for(const p of this.parts){result.set(p,offset);offset+=p.length;}}
   this.reset();return result;
  }
 }
 if(typeof module==='object'&&module.exports)module.exports={UtteranceDetector};else root.CapriUtteranceDetector=UtteranceDetector;
})(typeof window==='object'?window:globalThis);
