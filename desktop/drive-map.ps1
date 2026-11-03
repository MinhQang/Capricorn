$ErrorActionPreference='Stop'
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
Add-Type @'
using System;using System.Text;using System.Runtime.InteropServices;
public class CapriDrives {
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode)] public static extern uint QueryDosDevice(string name,StringBuilder buffer,int size);
}
'@
$mapping=@{}
foreach($code in 65..90){$drive=([char]$code).ToString()+':';$buffer=New-Object System.Text.StringBuilder 2048;if([CapriDrives]::QueryDosDevice($drive,$buffer,2048) -gt 0){$mapping[$drive]=$buffer.ToString()}}
ConvertTo-Json -InputObject $mapping -Compress
