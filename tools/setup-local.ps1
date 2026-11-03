$ErrorActionPreference = 'Stop'
$capriRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $capriRoot
$env:UV_CACHE_DIR = Join-Path $capriRoot '.cache\uv'
$env:UV_PYTHON_INSTALL_DIR = Join-Path $capriRoot '.tools\python'
$capriPython = Join-Path $capriRoot '.tools\speech\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $capriPython)) {
    uv venv --python 3.11 (Join-Path $capriRoot '.tools\speech')
    if ($LASTEXITCODE -ne 0) { throw 'Python environment setup failed.' }
}
uv pip install --python $capriPython 'faster-whisper==1.2.1' 'kokoro-onnx==0.6.0' 'soundfile>=0.13,<0.14' 'espeakng-loader'
if ($LASTEXITCODE -ne 0) { throw 'Speech dependency installation failed.' }
$capriModelDir = Join-Path $capriRoot '.models'
New-Item -ItemType Directory -Path $capriModelDir -Force | Out-Null
$ProgressPreference = 'SilentlyContinue'
foreach ($capriFile in @('kokoro-v1.0.onnx','voices-v1.0.bin')) {
    $capriTarget = Join-Path $capriModelDir $capriFile
    if (-not (Test-Path -LiteralPath $capriTarget)) {
        Write-Output "Downloading $capriFile"
        Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/$capriFile" -OutFile ($capriTarget + '.download')
        Move-Item -LiteralPath ($capriTarget + '.download') -Destination $capriTarget
    }
}
& $capriPython -c "from faster_whisper import WhisperModel; WhisperModel('base.en',device='cpu',compute_type='int8',cpu_threads=2,download_root=r'$capriRoot\.cache\whisper'); print('English recognition ready.')"
if ($LASTEXITCODE -ne 0) { throw 'Whisper model setup failed.' }
if (-not (Test-Path -LiteralPath (Join-Path $capriModelDir 'capri-reference.npy'))) {
    Write-Output 'Preparing the repository synthetic Capri voice (one-time 316 MB download).'
    & $capriPython (Join-Path $PSScriptRoot 'import-reference-voice.py')
    if ($LASTEXITCODE -ne 0) { throw 'Reference voice setup failed. Bright and Bella voices remain available.' }
}
Write-Output 'Local speech installed. Ollama also needs: ollama pull qwen3:1.7b'
