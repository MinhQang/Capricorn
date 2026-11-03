param([switch]$PostVerification)
$ErrorActionPreference='Stop'
$workspace=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$cache=Join-Path $workspace '.cache'
$targets=@()
if(Test-Path -LiteralPath $cache){$targets+=Get-ChildItem -LiteralPath $cache -Force | Where-Object {
 if($_.PSIsContainer){$_.Name -match '^(uv|[a-z-]+-(check|build)|emote-check-\w+|computer-ui-\w+|live-planner-\w+|runtime-(check|final\d*)|recycle-test-\w+)$' -and $_.Name -ne 'whisper'}
 else {!$PostVerification -and $_.Name -match '\.(png|wav)$|^mochi-.*\.js$|^tts-fp32-benchmark\.json$'}
} | ForEach-Object {$_.FullName}}
$targets+=@('.cache\lachy-reference\capri-voice-1.zip','.cache\lachy-reference\repository-voices.bin','.models\kokoro-v1.0.int8.onnx','public\assets\capri-cels.png','public\assets\capri-cels.json','public\assets\capri-prepared.png') | ForEach-Object {Join-Path $workspace $_}
$removed=@();$skipped=@();[long]$bytes=0
foreach($target in $targets){
 $absolute=[IO.Path]::GetFullPath($target)
 if(!$absolute.StartsWith($workspace+'\',[StringComparison]::OrdinalIgnoreCase)){throw "Target escaped workspace: $absolute"}
 if(!(Test-Path -LiteralPath $absolute)){continue}
 $item=Get-Item -LiteralPath $absolute -Force
 if($item.Attributes -band [IO.FileAttributes]::ReparsePoint){$skipped+=$item.FullName;continue}
 if($item.PSIsContainer){
  $entries=@(Get-ChildItem -LiteralPath $absolute -Recurse -Force)
  if(@($entries | Where-Object {$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count){$skipped+=$item.FullName;continue}
  [long]$size=($entries | Where-Object {!$_.PSIsContainer} | Measure-Object Length -Sum).Sum
 }else{[long]$size=$item.Length}
 try{Remove-Item -LiteralPath $absolute -Recurse -Force -ErrorAction Stop;$bytes+=$size;$removed+=@{path=$absolute.Substring($workspace.Length+1);fileBytes=$size}}catch{$skipped+=$absolute+': '+$_.Exception.Message}
}
$report=@{removed=$removed;removedFileBytes=$bytes;skipped=$skipped;preserved=@('.models active FP32 voice + speaker data','.cache\whisper','.tools Python + speech environment','node_modules','all original emotes + retained poses','licenses + provenance','user references and Capri_data outside workspace')}
$reportPath=Join-Path $workspace 'docs\CLEANUP-REPORT.json'
if($PostVerification -and (Test-Path -LiteralPath $reportPath)){$original=Get-Content -Raw -LiteralPath $reportPath | ConvertFrom-Json;$original | Add-Member -NotePropertyName postVerification -NotePropertyValue $report -Force;$original | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath $reportPath}
else {$report | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 -LiteralPath $reportPath}
@{removedTargets=$removed.Count;removedFileMB=[math]::Round($bytes/1MB,1);skippedTargets=$skipped.Count}|ConvertTo-Json -Compress
