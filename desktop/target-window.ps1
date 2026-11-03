param([ValidateSet('notepad','calculator','explorer','documents','downloads','desktop','chrome','edge','vscode','discord','spotify','steam')][string]$Target)
$ErrorActionPreference='Stop'
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class CapriWindow {
 [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left,Top,Right,Bottom; }
 [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
 [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out Rect r);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
}
'@
$expected=switch($Target){'notepad'{@('notepad')};'calculator'{@('CalculatorApp','Calculator')};'chrome'{@('chrome')};'edge'{@('msedge')};'vscode'{@('Code')};'discord'{@('Discord')};'spotify'{@('Spotify')};'steam'{@('steam')};default{@('explorer')}}
# Packaged Windows apps (notably Notepad) can take several seconds on a cold
# start. Keep looking before telling the user the window could not be located.
for($attempt=0;$attempt -lt 80;$attempt++){
 $handle=[CapriWindow]::GetForegroundWindow();[uint32]$windowPid=0
 [void][CapriWindow]::GetWindowThreadProcessId($handle,[ref]$windowPid)
 $process=Get-Process -Id $windowPid -ErrorAction SilentlyContinue
 # Windows may keep the companion in the foreground while starting a browser.
 # Only fall back to a real main window belonging to the requested app.
 if($attempt -ge 5 -and (!$process -or $expected -notcontains $process.ProcessName)){
  $candidate=Get-Process -Name $expected -ErrorAction SilentlyContinue |
   Where-Object { $_.MainWindowHandle -ne 0 -and [CapriWindow]::IsWindowVisible($_.MainWindowHandle) -and ![CapriWindow]::IsIconic($_.MainWindowHandle) } | Select-Object -First 1
  if($candidate){$process=$candidate;$handle=$candidate.MainWindowHandle}
 }
 if($process -and $expected -contains $process.ProcessName -and [CapriWindow]::IsWindowVisible($handle) -and ![CapriWindow]::IsIconic($handle)){
  $rect=New-Object CapriWindow+Rect
  if([CapriWindow]::GetWindowRect($handle,[ref]$rect)){
   @{x=$rect.Left;y=$rect.Top;width=$rect.Right-$rect.Left;height=$rect.Bottom-$rect.Top}|ConvertTo-Json -Compress
   exit
  }
 }
 Start-Sleep -Milliseconds 100
}
Write-Output 'null'
