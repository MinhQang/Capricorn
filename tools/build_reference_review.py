"""Prepare an offline listening/review page; speaker labels are hypotheses."""
from pathlib import Path
import html
import json
import subprocess
import imageio_ffmpeg

root=Path(__file__).resolve().parents[1]
out=root/'reference-analysis'
clips=[('introduction','Capri Introduce.mp4',19.29,27.29,'Candidate Capri: self-description; speaker unconfirmed'),
       ('explanation','Capri Introduce.mp4',31.29,39.29,'Candidate Capri: origin explanation; speaker unconfirmed')]
items=[]
for name,source,start,end,label in clips:
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y',
                    '-ss',str(start),'-i',str(Path('E:/Capri_data')/source),'-t',str(end-start),
                    '-vn','-ac','1','-ar','24000',str(out/(name+'.wav'))],check=True)
    items.append(f'<article><h3>{html.escape(label)}</h3><p>{html.escape(source)} · {start}–{end}s</p><audio controls src="{name}.wav"></audio></article>')
sections=[]
for file in sorted(Path('E:/Capri_data').glob('*.mp4')):
    folder=file.stem.replace(' ','_')
    rows=json.loads((out/folder/'transcript.json').read_text(encoding='utf-8'))
    buttons=''.join(f'<button data-start="{r["start"]}">{r["start"]:.2f}–{r["end"]:.2f}s · {html.escape(r["text"])}</button>' for r in rows)
    sections.append(f'<section><h2>{html.escape(file.name)}</h2><video controls preload="metadata" src="{file.as_uri()}"></video><p>Click a transcript row to seek. ASR can be wrong; timestamps are approximate.</p><div>{buttons}</div><img src="{folder}/contact-01.jpg" alt="Timestamped reference frames"></section>')
page='''<!doctype html><html lang="en"><meta charset="utf-8"><title>Capri reference review</title><style>body{font:16px system-ui;background:#15121c;color:#eee;max-width:1100px;margin:auto;padding:30px}video{width:100%;max-height:520px}img{width:100%;margin-top:25px}button{display:block;width:100%;text-align:left;background:#2e263b;color:#eee;border:1px solid #665078;padding:12px;cursor:pointer}article{padding:15px;border:1px solid #665078;margin-bottom:15px}p{line-height:1.6;color:#bcb5c7}section{margin:35px 0}audio{width:100%}</style><h1>Capri · local reference review</h1><p>Original videos remain untouched. Transcripts are machine-generated and have no speaker diarization. Candidate clips are NOT verified single-speaker training data. Review mouth movements, cuts and audible speaker changes before confirming. If original video paths move, the video links need updating.</p>'''+''.join(items)+''.join(sections)+'''<script>document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{const v=b.closest('section').querySelector('video');v.currentTime=Number(b.dataset.start);v.play().catch(()=>{});});</script></html>'''
(out/'review.html').write_text(page,encoding='utf-8')
print(out/'review.html')
