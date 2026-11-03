$ErrorActionPreference='Stop'
Add-Type @'
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class CapricornDraft {
 public delegate bool Callback(IntPtr h,IntPtr p);
 [DllImport("user32.dll")] static extern bool EnumWindows(Callback c,IntPtr p);
 [DllImport("user32.dll")] static extern bool EnumChildWindows(IntPtr h,Callback c,IntPtr p);
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h,StringBuilder b,int n);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] static extern int GetClassName(IntPtr h,StringBuilder b,int n);
 [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h,out uint id);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] public static extern IntPtr SendMessageTimeout(IntPtr h,uint m,IntPtr w,string l,uint flags,uint timeout,out IntPtr result);
 [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr h,uint m,IntPtr w,IntPtr l);
 public static string Title(IntPtr h){var b=new StringBuilder(1024);GetWindowText(h,b,1024);return b.ToString();}
 public static long[] Windows(){var list=new List<long>();EnumWindows((h,p)=>{if(IsWindowVisible(h))list.Add(h.ToInt64());return true;},IntPtr.Zero);return list.ToArray();}
 public static long[] Editors(IntPtr h){var list=new List<long>();EnumChildWindows(h,(c,p)=>{var b=new StringBuilder(128);GetClassName(c,b,128);var n=b.ToString();if(n.Equals("Edit",StringComparison.OrdinalIgnoreCase)||n.StartsWith("RichEdit",StringComparison.OrdinalIgnoreCase))list.Add(c.ToInt64());return true;},IntPtr.Zero);return list.ToArray();}
}
'@
$text=[string]$request.text
if (!$text.Trim() -or $text.Length -gt 2000 -or $text -match '[\x00-\x08\x0b\x0c\x0e-\x1f]') {throw 'Provide up to 2,000 plain-text characters.'}
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$createdTabs = New-Object 'System.Collections.Generic.HashSet[long]'
Start-Process -FilePath (Join-Path $env:SystemRoot 'System32/notepad.exe') -WindowStyle Normal
for($attempt=0;$attempt -lt 40;$attempt++) {
 foreach($number in [CapricornDraft]::Windows()) {
  $handle=[IntPtr]$number;[uint32]$owner=0
  [void][CapricornDraft]::GetWindowThreadProcessId($handle,[ref]$owner)
  $process=Get-Process -Id $owner -ErrorAction SilentlyContinue
  $title=[CapricornDraft]::Title($handle)
  if (!$process -or $process.ProcessName -ne 'notepad') {continue}
  if ($title -notmatch '^(Untitled|Chưa có tiêu đề|Không có tiêu đề)(?:\s|$)') {
   if (!$createdTabs.Contains($number)) {
    $root=[System.Windows.Automation.AutomationElement]::FromHandle($handle)
    $condition=New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty,'AddButton')
    $button=$root.FindFirst([System.Windows.Automation.TreeScope]::Descendants,$condition)
    if($button -and $button.Current.IsEnabled){$invoke=$button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern);$invoke.Invoke();[void]$createdTabs.Add($number)}
   }
   continue
  }
  foreach($editorNumber in [CapricornDraft]::Editors($handle)) {
   $editor=[IntPtr]$editorNumber
   if([CapricornDraft]::SendMessage($editor,0x000E,[IntPtr]::Zero,[IntPtr]::Zero).ToInt64() -ne 0){continue}
   [uint32]$editorOwner=0;[void][CapricornDraft]::GetWindowThreadProcessId($editor,[ref]$editorOwner)
   if($editorOwner -ne $owner){continue}
   $normalized=$text.Replace("`r`n","`n").Replace("`n","`r`n")
   [IntPtr]$result=[IntPtr]::Zero
   $sent=[CapricornDraft]::SendMessageTimeout($editor,0x000C,[IntPtr]::Zero,$normalized,2,3000,[ref]$result)
   if($sent -eq [IntPtr]::Zero -or $result -eq [IntPtr]::Zero){throw 'Notepad did not accept the text. Nothing was saved.'}
   @{ok=$true;message='Wrote your text into an unsaved Notepad document. No file was saved.';window=[string]$number;characters=$text.Length}|ConvertTo-Json -Compress;exit
  }
 }
 Start-Sleep -Milliseconds 150
}
throw 'Could not locate a blank Untitled Notepad editor. Nothing was typed. Close any Notepad dialogs and try /write again.'
