$ErrorActionPreference='Stop'
[Console]::InputEncoding=[System.Text.Encoding]::UTF8
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
$request=[Console]::In.ReadToEnd() | ConvertFrom-Json
if($request.op -eq 'draft') { . (Join-Path $PSScriptRoot 'write-draft.ps1'); exit }
if($request.op -eq 'trash') {
 # Inputs are canonicalized and checked by path-policy before reaching this helper.
 $target=[string]$request.path
 if($target -notmatch '^[a-bd-zA-BD-Z]:[\\/].+' -or $target.Substring(2).Contains(':')) {throw 'Excluded path.'}
 Add-Type -AssemblyName Microsoft.VisualBasic
 if(Test-Path -LiteralPath $target -PathType Container) {[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($target,'OnlyErrorDialogs','SendToRecycleBin','ThrowException')}
 else {[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($target,'OnlyErrorDialogs','SendToRecycleBin','ThrowException')}
 @{ok=$true;message='Sent to Recycle Bin.'}|ConvertTo-Json -Compress;exit
}
Add-Type @'
using System;
using System.Collections.Generic;
using System.Text;
using System.Runtime.InteropServices;
public class CapriControl {
 public delegate bool Callback(IntPtr h, IntPtr p);
 [DllImport("user32.dll")] public static extern bool EnumWindows(Callback c, IntPtr p);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr h, StringBuilder b, int n);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
 [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h,int n);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
 [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h,uint m,IntPtr w,IntPtr l);
 public static long[] Handles() {var result=new List<long>();EnumWindows((h,p)=>{if(IsWindowVisible(h))result.Add(h.ToInt64());return true;},IntPtr.Zero);return result.ToArray();}
}
'@
$windows=@(foreach($number in [CapriControl]::Handles()) {
 $handle=[IntPtr]$number;$title=New-Object System.Text.StringBuilder 1024
 [void][CapriControl]::GetWindowText($handle,$title,1024);[uint32]$windowPid=0
 [void][CapriControl]::GetWindowThreadProcessId($handle,[ref]$windowPid)
 $process=Get-Process -Id $windowPid -ErrorAction SilentlyContinue
 if($title.Length -gt 0 -and $process -and $process.ProcessName -ne 'electron') {@{id=[string]$number;title=$title.ToString();app=$process.ProcessName}}
})
if($request.op -eq 'windows') {ConvertTo-Json -InputObject @($windows | Select-Object -First 50) -Compress;exit}
if($request.op -notin @('focus','minimize','maximize','restore','close')) {throw 'Unsupported window operation.'}
$aliases=@{chrome='chrome';'google chrome'='chrome';edge='msedge';'microsoft edge'='msedge';explorer='explorer';'file explorer'='explorer';vscode='Code';'vs code'='Code';notepad='notepad';calculator='CalculatorApp'}
$name=([string]$request.app).ToLowerInvariant().Trim()
if(!$name -or $name.Length -gt 200){throw 'Name an app or exact window title.'}
$expected=if($aliases.ContainsKey($name)){$aliases[$name]}else{$name}
$matches=@($windows | Where-Object {$_.app -ieq $expected -or $_.title -ieq $name -or $_.id -eq $name})
if($matches.Count -eq 0){throw 'No matching visible window. Open the app first, or ask me to list windows.'}
if($matches.Count -gt 1){throw 'More than one window matches. Ask me to list windows, then use an exact title or window ID.'}
$window=$matches[0];$handle=[IntPtr][long]$window.id
switch($request.op) {
 'focus' {[void][CapriControl]::ShowWindowAsync($handle,9);if(![CapriControl]::SetForegroundWindow($handle)){throw 'Windows did not grant foreground focus.'}}
 'minimize' {[void][CapriControl]::ShowWindowAsync($handle,6)}
 'maximize' {[void][CapriControl]::ShowWindowAsync($handle,3)}
 'restore' {[void][CapriControl]::ShowWindowAsync($handle,9)}
 'close' {if(![CapriControl]::PostMessage($handle,0x0010,[IntPtr]::Zero,[IntPtr]::Zero)){throw 'Windows rejected the close request.'}}
}
@{ok=$true;message=($request.op+' request sent to '+$window.title+'.');window=$window}|ConvertTo-Json -Depth 4 -Compress
