"""Local reference inspection. Leaves source videos untouched."""
import argparse
import json
from pathlib import Path
import av
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('--transcribe', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
out = root / 'reference-analysis'
out.mkdir(exist_ok=True)
videos = sorted(Path('E:/Capri_data').glob('*.mp4'))
metadata = []
for source in videos:
    dest = out / source.stem.replace(' ', '_')
    dest.mkdir(exist_ok=True)
    with av.open(str(source)) as container:
        stream = container.streams.video[0]
        duration = float(container.duration / av.time_base) if container.duration else float(stream.duration * stream.time_base)
        metadata.append({'file':str(source),'duration_seconds':duration,'width':stream.width,'height':stream.height,
                         'streams':[{'type':s.type,'codec':s.codec_context.name,'metadata':dict(s.metadata)} for s in container.streams]})
        frames = []
        for seconds in range(0, int(duration), 4):
            container.seek(int(seconds / stream.time_base), stream=stream)
            for frame in container.decode(stream):
                if frame.time is not None and frame.time >= seconds:
                    picture = frame.to_image()
                    picture.thumbnail((384,216))
                    tile = Image.new('RGB',(384,242),'#18181f')
                    tile.paste(picture,((384-picture.width)//2,0))
                    ImageDraw.Draw(tile).text((8,220),f'{seconds//60:02}:{seconds%60:02}',fill='white')
                    frames.append(tile)
                    break
        for offset in range(0,len(frames),20):
            batch = frames[offset:offset+20]
            sheet = Image.new('RGB',(384*4,242*((len(batch)+3)//4)),'#18181f')
            for i,tile in enumerate(batch):sheet.paste(tile,((i%4)*384,(i//4)*242))
            sheet.save(dest / f'contact-{offset//20+1:02}.jpg')
    print(json.dumps(metadata[-1]),flush=True)
(out/'metadata.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
if args.transcribe:
    from faster_whisper import WhisperModel
    model = WhisperModel('base.en', device='cpu', compute_type='int8',cpu_threads=2,num_workers=1,
                         download_root=str(root/'.cache'/'whisper'))
    for source in videos:
        dest = out/source.stem.replace(' ','_')
        segments,info=model.transcribe(str(source),language='en',beam_size=3,vad_filter=True)
        result=[]
        for s in segments:
            item={'start':round(s.start,2),'end':round(s.end,2),'text':s.text.strip()}
            result.append(item)
            print(source.name,json.dumps(item),flush=True)
        (dest/'transcript.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
        (dest/'transcript.txt').write_text('\n'.join(f"[{s['start']:.2f}–{s['end']:.2f}] {s['text']}" for s in result),encoding='utf-8')
