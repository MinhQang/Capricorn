"""Lightweight local Kokoro styling inspired by Lachy's Capri VoiceFx settings.

See public/vendor/lachy-capri/LICENSE.md and THIRD_PARTY_NOTICES.md.
No voice actor cloning; input is the project's synthetic voice embedding.
"""
import math
import numpy as np

PROFILES = {
    'capri': ('capri', 1.0, 'en-us'),
    'bright': ('af_bella', 1.1, 'en-us'),
    'sly': ('af_nicole', 1.08, 'en-us'),
    'sharp': ('bf_emma', 1.1, 'en-gb'),
    'af_bella': ('af_bella', 1.0, 'en-us'),
    'af_heart': ('af_heart', 1.0, 'en-us'),
}

def settings(body):
    name=body.get('voice','capri')
    if name not in PROFILES: raise ValueError('Unsupported voice.')
    tuned=name=='capri'
    pitch=float(body.get('pitch',3 if tuned else 0))
    speed=float(body.get('speed',95 if tuned else 100))
    if not math.isfinite(pitch) or not -6<=pitch<=6: raise ValueError('Pitch must be between -6 and +6 semitones.')
    if not math.isfinite(speed) or not 80<=speed<=140: raise ValueError('Speed must be between 80 and 140 percent.')
    layers=body.get('layers',tuned)
    if not isinstance(layers,bool): raise ValueError('Voice layers must be on or off.')
    voice,style,lang=PROFILES[name]
    lift=2**(pitch/12)
    return dict(name=name,voice=voice,lang=lang,pitch=pitch,speed=speed,layers=layers,lift=lift,tempo=style*speed/100/lift,volume=.8 if tuned else 1.0)

def resample_pitch(samples,ratio):
    if abs(ratio-1)<1e-8:return samples
    return np.interp(np.arange(0,len(samples),ratio),np.arange(len(samples)),samples).astype(np.float32)

def shimmer(samples,semitones,rate):
    """WSOLA stretch then resample: shifted harmony keeps the main voice's timing."""
    ratio=2**(semitones/12);frame=max(32,rate//50)&~1;hop=frame//2;tolerance=max(1,rate//200)
    if len(samples)<frame:return np.resize(resample_pitch(samples,ratio),len(samples))
    target=round(len(samples)*ratio);output=np.zeros(target+frame,dtype=np.float32);weights=np.zeros_like(output)
    window=(.5-.5*np.cos(2*np.pi*np.arange(frame)/frame)).astype(np.float32)
    last=len(samples)-frame;previous=-1
    for placed,start in enumerate(range(0,target,hop)):
        nominal=min(last,round(placed*hop/ratio));candidate=nominal
        if previous>=0:
            natural=min(last,previous+hop);reference=samples[natural:natural+frame:4]
            lo=max(0,nominal-tolerance);hi=min(last,nominal+tolerance)
            choices=np.lib.stride_tricks.sliding_window_view(samples[lo:hi+frame],frame)[:,::4]
            scores=np.einsum('ij,j->i',choices,reference)/np.sqrt(np.einsum('ij,ij->i',choices,choices)+1e-12)
            candidate=lo+int(np.argmax(scores))
        output[start:start+frame]+=samples[candidate:candidate+frame]*window
        weights[start:start+frame]+=window;previous=candidate
    stretched=output[:target]/np.maximum(weights[:target],1e-3)
    return np.interp(np.arange(len(samples))*ratio,np.arange(target),stretched).astype(np.float32)


def limit(samples,rate):
    """Short lookahead and 60 ms release avoid flattening an entire utterance."""
    if not len(samples):return samples
    ceiling=31000/32768;look=max(1,round(rate*.0025))
    peaks=np.lib.stride_tricks.sliding_window_view(np.pad(np.abs(samples),(0,look-1)),look).max(axis=1)
    reduction=1-np.minimum(1,ceiling/np.maximum(peaks,1e-12))
    ramp=np.arange(len(samples))/(rate*.06)
    logs=np.full(len(samples),-np.inf);np.log(reduction,out=logs,where=reduction>0)
    attenuation=np.exp(np.maximum.accumulate(logs+ramp)-ramp)
    return np.clip(samples*(1-attenuation),-ceiling,ceiling)

def apply(samples,rate,config):
    samples=np.asarray(samples,dtype=np.float32)
    result=resample_pitch(samples,config['lift'])
    if config['layers']:
        delay=round(rate*.025)
        mixed=np.zeros(len(result)+delay,dtype=np.float32);mixed[:len(result)]=result
        mix=config.get('layer_mix',.4)
        for pitch in (2,-2.5):mixed[delay:]+=mix*shimmer(result,pitch,rate)
        result=limit(mixed,rate)
    result=result*config['volume']
    peak=float(np.max(np.abs(result))) if len(result) else 0
    if peak>.98:result=result*(.98/peak)
    return result.astype(np.float32)
