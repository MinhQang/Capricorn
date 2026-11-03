$ErrorActionPreference='Stop'
[Console]::OutputEncoding=New-Object System.Text.UTF8Encoding($false)
$items=@()
try {$items=@(Get-StartApps | Select-Object Name,AppID)} catch {}
if($items.Count -eq 0) {
 $shell=New-Object -ComObject Shell.Application
 $folder=$shell.NameSpace('shell:AppsFolder')
 if($folder) {$items=@($folder.Items() | ForEach-Object { [PSCustomObject]@{Name=[string]$_.Name;AppID=[string]$_.Path} })}
}
ConvertTo-Json -InputObject @($items | Where-Object {$_.Name -and $_.AppID}) -Compress
