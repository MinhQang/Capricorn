"""Inspect user-selected voice intervals locally; no automatic speaker identity claim."""
import html
import json
from pathlib import Path
import subprocess
import av
from PIL import Image, ImageDraw
import imageio_ffmpeg
from faster_whisper import WhisperModel

root = Path(__file__).resolve().parents[1]
source = Path('E:/Capri_data/Capri_voice_1.mp4')
out = root/'reference-analysis'/'Capri_voice_1'
out.mkdir(parents=True,exist_ok=True)
spans = [(0,3),(6,9),(12,14),(18,37)]
model = WhisperModel('base.en',device='cpu',compute_type='int8',cpu_threads=2,
                     download_root=str(root/'.cache'/'whisper'),local_files_only=True)
report=[]
for start,end in spans:
    stem=f'{start:02}-{end:02}'
    wav=out/(stem+'.wav')
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-hide_banner','-loglevel','error','-y',
                    '-i',str(source),'-ss',str(start),'-t',str(end-start),'-vn',
                    '-ac','1','-ar','16000',str(wav)],check=True)
    segments,_=model.transcribe(str(wav),language='en',beam_size=5,word_timestamps=True,vad_filter=False,
                               condition_on_previous_text=False)
    transcript=[{'start':round(s.start+start,2),'end':round(s.end+start,2),'text':s.text.strip(),
                 'words':[{'start':round(w.start+start,2),'end':round(w.end+start,2),'word':w.word} for w in s.words or []]} for s in segments]
    item={'start':start,'end':end,'speaker_status':'user-selected reference interval; not independently diarized',
          'audio':wav.name,'transcript':transcript}
    report.append(item)
    print(json.dumps(item),flush=True)
    tiles=[]
    with av.open(str(source)) as container:
        stream=container.streams.video[0]
        for sec in range(start,end):
            container.seek(int(sec/stream.time_base),stream=stream)
            for frame in container.decode(stream):
                if frame.time is not None and frame.time>=sec:
                    picture=frame.to_image();picture.thumbnail((320,210))
                    tile=Image.new('RGB',(320,234),'#18151e');tile.paste(picture,((320-picture.width)//2,0))
                    ImageDraw.Draw(tile).text((8,214),f'{sec}s',fill='white');tiles.append(tile);break
    sheet=Image.new('RGB',(320*4,234*((len(tiles)+3)//4)),'#18151e')
    for i,tile in enumerate(tiles):sheet.paste(tile,((i%4)*320,(i//4)*234))
    sheet.save(out/(stem+'.jpg'))
(out/'selected-spans.json').write_text(json.dumps({'source':str(source),'intervals':report},indent=2),encoding='utf-8')
sections=[]
for item in report:
    stem=f'{item["start"]:02}-{item["end"]:02}'
    text='\n'.join(f"[{s['start']:.2f}–{s['end']:.2f}] {s['text']}" for s in item['transcript'])
    sections.append(f'<section><h2>{item["start"]}–{item["end"]} seconds</h2><audio controls src="{stem}.wav"></audio><pre>{html.escape(text)}</pre><img src="{stem}.jpg" alt="Timestamped frames"></section>')
(out/'review.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><title>Capri selected voice references</title><style>body{background:#19141f;color:#eee;font:16px system-ui;max-width:1100px;margin:auto;padding:25px}section{border-top:1px solid #80658c;margin-top:25px}img,audio{width:100%}pre{white-space:pre-wrap;line-height:1.6}p{line-height:1.7}</style><h1>Capri · selected voice intervals</h1><p>Intervals supplied by the user. Audio clipped exactly at the supplied boundaries, without denoising or speaker separation. ASR text and timestamps can be wrong. This page does not certify speaker identity or clean training data.</p>'''+''.join(sections),encoding='utf-8')
print(str(out/'review.html'),flush=True)
