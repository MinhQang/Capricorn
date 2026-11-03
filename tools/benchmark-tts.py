from pathlib import Path
import time
import json
import onnxruntime as ort
from kokoro_onnx import Kokoro

root=Path(__file__).resolve().parents[1]
options=ort.SessionOptions();options.intra_op_num_threads=2;options.inter_op_num_threads=1
started=time.perf_counter()
session=ort.InferenceSession(str(root/'.models'/'kokoro-v1.0.onnx'),sess_options=options,providers=['CPUExecutionProvider'])
model=Kokoro.from_session(session,str(root/'.models'/'voices-v1.0.bin'))
print(json.dumps({'fp32LoadSeconds':round(time.perf_counter()-started,3)}),flush=True)
results=[]
for i in range(2):
    started=time.perf_counter();samples,rate=model.create('Capri online. Pick a target, and let us get moving.',voice='af_bella',speed=1.0,lang='en-us')
    result={'run':i+1,'seconds':round(time.perf_counter()-started,3),'audioSeconds':round(len(samples)/rate,3)}
    results.append(result);print(json.dumps(result),flush=True)
(root/'.cache'/'tts-fp32-benchmark.json').write_text(json.dumps(results,indent=2))
