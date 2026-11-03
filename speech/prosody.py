"""Bounded phrase-level delivery for a CPU-only Kokoro voice.

This shapes pacing and small pitch offsets; it is not an emotion-trained model.
"""
import re
import random
import hashlib
import numpy as np
from effects import apply

def digital_artifacts(samples,rate,text):
    """Quiet 40 ms digital repeats, 3-7 seconds apart; no added duration."""
    result=samples.copy();rng=random.Random(int.from_bytes(hashlib.sha256(text.encode()).digest()[:8],'little'));events=[]
    time=rng.uniform(3,7);length=round(rate*.040);grain=round(rate*.010)
    while round(time*rate)+length<len(result):
        start=round(time*rate);section=result[start:start+length].copy()
        if float(np.sqrt(np.mean(section**2)))>.004:
            repeated=np.resize(section[:grain],length)
            window=np.hanning(length).astype(np.float32)*.28
            result[start:start+length]=section*(1-window)+repeated*window
            events.append(round(time,3))
        time+=rng.uniform(3,7)
    return result,events

STYLES={
    'mischievous':dict(pace=1.04,pitch=.35,pause=.16,gain=1.12),
    'calm':dict(pace=1.,pitch=0.,pause=.34,gain=1.),
    'playful':dict(pace=1.02,pitch=.12,pause=.28,gain=1.02),
    'warm':dict(pace=.94,pitch=-.16,pause=.46,gain=.96),
    'focused':dict(pace=.99,pitch=-.08,pause=.30,gain=1.),
    'curious':dict(pace=.98,pitch=.12,pause=.36,gain=1.),
}

def delivery_for(text,requested):
    if requested not in ('auto','plain',*STYLES):raise ValueError('Unsupported speech delivery.')
    if requested!='auto':return requested
    if re.search(r'\b(sorry|rough day|take your time|here for you|that sounds hard|one step at a time)\b',text,re.I):return 'focused'
    if re.search(r'\b(launch request|opened|saved|on the list|task added|could not launch)\b',text,re.I):return 'focused'
    return 'mischievous'

def plan(text,requested='auto'):
    delivery=delivery_for(text,requested)
    if delivery=='plain':return delivery,[dict(text=text,pace=1.,pitch=0.,pause=0.,gain=1.)]
    # At most three calls, even for long replies. All input words remain in order.
    boundary=r'(?<=[.!?,;:])\s+' if delivery=='mischievous' else r'(?<=[.!?])\s+'
    phrases=re.split(boundary,text.strip())
    if len(phrases)>3:phrases=phrases[:2]+[' '.join(phrases[2:])]
    result=[]
    for index,phrase in enumerate(phrases):
        setting=dict(STYLES[delivery]);setting['text']=phrase
        if delivery=='mischievous':
            # An eager pounce, a conspiratorial dip, then an upward challenge.
            setting['pitch']=[1.15,-.55,.70][index]
            setting['pace']=[1.10,.94,1.04][index]
            setting['pause']=[.12,.20,.12][index]
            setting['attack']=True
        if delivery=='playful':setting['pitch']+=.16 if index==0 else -.10
        if phrase.endswith('?'):setting['pitch']+=.45 if delivery=='mischievous' else .16;setting['pace']*=.98
        elif index==len(phrases)-1 and delivery!='mischievous':setting['pace']*=.98
        if index==len(phrases)-1:setting['pause']=0.
        result.append(setting)
    return delivery,result

def phrase_config(base,phrase):
    config=dict(base);config['pitch']=max(-6,min(6,base['pitch']+phrase['pitch']));config['lift']=2**(config['pitch']/12)
    config['tempo']=base['tempo']*base['lift']/config['lift']*phrase['pace']
    config['volume']=base['volume']*phrase['gain']
    return config

def synthesize(engine,text,voice,base,requested):
    delivery,phrases=plan(text,requested);pieces=[];rate=None
    for phrase in phrases:
        config=phrase_config(base,phrase)
        samples,sample_rate=engine.create(phrase['text'],voice=voice,speed=config['tempo'],lang=config['lang'],sentence_pause=.25,clause_pause=.16)
        if rate is not None and rate!=sample_rate:raise ValueError('Speech sample rate changed mid-line.')
        rate=sample_rate;samples=apply(samples,rate,config)
        if phrase.get('attack') and len(samples):
            # Forward, varied emphasis instead of a soft uniform wash. No extra model.
            envelope=np.interp(np.linspace(0,1,len(samples)),[0,.06,.32,.52,.78,1],[1.12,1.06,.98,1.10,1.02,1.06])
            samples=(samples*envelope).astype(np.float32)
            peak=float(np.max(np.abs(samples)))
            if peak>.98:samples*=.98/peak
        # A short edge fade prevents clicks at joins without flattening the line.
        edge=min(round(rate*.005),len(samples)//2)
        if edge:samples[:edge]*=np.linspace(0,1,edge);samples[-edge:]*=np.linspace(1,0,edge)
        pieces.append(samples)
        if phrase['pause']:pieces.append(np.zeros(round(rate*phrase['pause']),dtype=np.float32))
    return np.concatenate(pieces),rate,delivery,len(phrases)
