"""Import only the synthetic voice embedding used by Lachy's local Capri preset.

Downloads the pinned voice pack once. Verifies SHA-256; does not extract or run DLLs.
Uses the Kokoro runtime already installed by Setup-Local.cmd.
"""
from pathlib import Path
import hashlib
import json
import urllib.request
import zipfile
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
URL='https://github.com/lachydotmcg/capri-desktop/releases/download/voice-pack-1/capri-voice-1.zip'
SHA='9fae085696d68a580d6b1a953d7b253129bfe506a2c016421b306b7237d3214c'
REVISION='eb1aecd4831829285044b87111497668024a0695'

def digest(file):
    result=hashlib.sha256()
    with file.open('rb') as source:
        while block:=source.read(1024*1024):result.update(block)
    return result.hexdigest()

def main():
    archive=ROOT/'.cache'/'lachy-reference'/'capri-voice-1.zip'
    archive.parent.mkdir(parents=True,exist_ok=True)
    if not archive.exists():
        temporary=archive.with_suffix('.part')
        with urllib.request.urlopen(URL,timeout=60) as source,temporary.open('wb') as dest:
            while data:=source.read(1024*1024):dest.write(data)
        if digest(temporary)!=SHA:raise ValueError('Downloaded voice pack checksum mismatch.')
        temporary.replace(archive)
    if digest(archive)!=SHA:raise ValueError('Cached voice pack is incomplete or has the wrong checksum. Remove it and retry.')
    with zipfile.ZipFile(archive) as pack:
        entries=[info for info in pack.infolist() if info.filename.endswith('/voices.bin') or info.filename=='voices.bin']
        if len(entries)!=1:raise ValueError('Voice pack must contain one voices.bin.')
        raw=pack.read(entries[0])
    values=np.frombuffer(raw,dtype='<f4')
    # Sherpa Kokoro exports use 510 or 512 style-length rows, with 256 channels.
    candidates=[rows for rows in (510,512) if len(values)%(rows*256)==0 and len(values)//(rows*256)>53]
    if len(candidates)!=1:raise ValueError('Unexpected Kokoro voice matrix dimensions.')
    rows=candidates[0];voices=values.reshape(-1,rows,256)
    own=voices[53,:510,:].copy().reshape(510,1,256)
    if not np.isfinite(own).all():raise ValueError('Invalid voice embedding.')
    target=ROOT/'.models'/'capri-reference.npy';target.parent.mkdir(parents=True,exist_ok=True)
    np.save(target,own,allow_pickle=False)
    metadata=dict(repository='https://github.com/lachydotmcg/capri-desktop',revision=REVISION,url=URL,sha256=SHA,speaker=53,shape=list(own.shape),embeddingSha256=digest(target),notes='Synthetic Kokoro speaker selected by upstream LocalVoice.Styles[0]; not an actor recording or voice clone. Runtime uses existing Kokoro ONNX.')
    target.with_suffix('.source.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
    print(json.dumps(metadata),flush=True)

if __name__=='__main__':main()
