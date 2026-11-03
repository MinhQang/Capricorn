"""Token-protected loopback English STT/TTS. No recording or audio retained."""
import base64
import io
import json
import os
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer
import wave
import threading
from effects import settings
from prosody import synthesize,delivery_for,digital_artifacts

ROOT=Path(__file__).resolve().parents[1]
TOKEN=os.environ['CAPRI_SPEECH_TOKEN']
def watch_parent():
    # Windows' venv launcher can hold stdin open. Watch the Node parent directly.
    if os.name=='nt':
        import ctypes
        parent=int(os.environ['CAPRI_PARENT_PID'])
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.OpenProcess.argtypes=[ctypes.c_ulong,ctypes.c_int,ctypes.c_ulong]
        kernel.OpenProcess.restype=ctypes.c_void_p
        kernel.WaitForSingleObject.argtypes=[ctypes.c_void_p,ctypes.c_ulong]
        kernel.CloseHandle.argtypes=[ctypes.c_void_p]
        handle=kernel.OpenProcess(0x00100000,False,parent)
        if not handle:os._exit(0)
        kernel.WaitForSingleObject(handle,0xffffffff)
        kernel.CloseHandle(handle)
        os._exit(0)
if os.environ.get('CAPRI_PARENT_PID'):threading.Thread(target=watch_parent,daemon=True).start()
whisper=None
kokoro=None

class Handler(BaseHTTPRequestHandler):
    def log_message(self,*args):pass
    def respond(self,status,value):
        data=json.dumps(value).encode()
        self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
    def do_POST(self):
        global whisper,kokoro
        if self.headers.get('X-Capri-Speech')!=TOKEN:return self.respond(403,{'error':'Invalid speech session.'})
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<8_000_000:raise ValueError('Audio request too large.')
            body=json.loads(self.rfile.read(length))
            if self.path=='/stt':
                raw=base64.b64decode(body['audio'],validate=True)
                with wave.open(io.BytesIO(raw)) as w:
                    if w.getnchannels()!=1 or w.getsampwidth()!=2 or w.getnframes()/w.getframerate()>31:raise ValueError('Send a mono PCM16 WAV under 30 seconds.')
                from faster_whisper import WhisperModel
                if whisper is None:whisper=WhisperModel('base.en',device='cpu',compute_type='int8',cpu_threads=2,num_workers=1,download_root=str(ROOT/'.cache'/'whisper'),local_files_only=True)
                segments,_=whisper.transcribe(io.BytesIO(raw),language='en',beam_size=3,vad_filter=True,condition_on_previous_text=False)
                text=' '.join(s.text.strip() for s in segments).strip()
                return self.respond(200,{'text':text})
            if self.path=='/tts':
                text=body.get('text','').strip()
                if not text or len(text)>1200:raise ValueError('Speech text must contain 1–1200 characters.')
                config=settings(body)
                requested=body.get('delivery','auto' if config['name']=='capri' else 'plain')
                delivery_for(text,requested)
                glitches=body.get('voiceGlitches',config['name']=='capri')
                if not isinstance(glitches,bool):raise ValueError('Voice glitches must be on or off.')
                from kokoro_onnx import Kokoro
                import onnxruntime as ort
                import soundfile as sf
                if kokoro is None:
                    options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
                    session=ort.InferenceSession(str(ROOT/'.models'/'kokoro-v1.0.onnx'),sess_options=options,providers=['CPUExecutionProvider'])
                    kokoro=Kokoro.from_session(session,str(ROOT/'.models'/'voices-v1.0.bin'))
                voice=config['voice']
                if voice=='capri':
                    import numpy as np
                    reference=ROOT/'.models'/'capri-reference.npy'
                    if not reference.exists():raise ValueError('Capri synthetic voice data is not installed. Choose Bright or run the voice import tool.')
                    voice=np.load(reference,allow_pickle=False)
                samples,sample_rate,delivery,phrase_count=synthesize(kokoro,text,voice,config,requested)
                signal_events=[]
                if glitches and delivery=='mischievous':samples,signal_events=digital_artifacts(samples,sample_rate,text)
                buffer=io.BytesIO();sf.write(buffer,samples,sample_rate,format='WAV',subtype='PCM_16')
                return self.respond(200,{'audio':base64.b64encode(buffer.getvalue()).decode(),'mime':'audio/wav','sampleRate':sample_rate,'profile':config['name'],'delivery':delivery,'phrases':phrase_count,'signalEvents':signal_events})
            self.respond(404,{'error':'Unknown speech route.'})
        except Exception as e:self.respond(400,{'error':str(e)})

server=HTTPServer(('127.0.0.1',0),Handler)
print(f'SPEECH_READY http://127.0.0.1:{server.server_port}',flush=True)
server.serve_forever()
