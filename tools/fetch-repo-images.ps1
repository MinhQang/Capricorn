$ErrorActionPreference = 'Stop'
$capriRepo = 'mochiiwuff/capri-desktop'
$capriDestination = 'E:\Capri_data\mochiiwuff-capri-desktop'
$capriCommit = (Invoke-RestMethod -Uri "https://api.github.com/repos/$capriRepo/commits/main" -Headers @{ 'User-Agent' = 'Capri-reference-import' }).sha
$capriBase = "https://raw.githubusercontent.com/$capriRepo/$capriCommit/"
$capriReadme = (Invoke-WebRequest -Uri ($capriBase + 'README.md') -UseBasicParsing).Content
$capriMatches = [regex]::Matches($capriReadme, '!\[([^\]]*)\]\((docs/[^)]+\.(?:png|jpg|jpeg|webp))\)')
if ($capriMatches.Count -eq 0) { throw 'No README image links found.' }
New-Item -ItemType Directory -Path $capriDestination -Force | Out-Null
$capriRecords = @()
foreach ($capriMatch in $capriMatches) {
    $capriRelative = $capriMatch.Groups[2].Value
    $capriName = [System.IO.Path]::GetFileName($capriRelative)
    $capriTarget = Join-Path $capriDestination $capriName
    $capriUrl = $capriBase + $capriRelative
    if (-not (Test-Path -LiteralPath $capriTarget)) {
        $capriTemp = $capriTarget + '.download'
        Invoke-WebRequest -Uri $capriUrl -OutFile $capriTemp -UseBasicParsing
        Move-Item -LiteralPath $capriTemp -Destination $capriTarget
    }
    $capriBytes = [System.IO.File]::ReadAllBytes($capriTarget)
    if ($capriName.EndsWith('.png') -and ($capriBytes.Length -lt 24 -or [BitConverter]::ToString($capriBytes[0..7]) -ne '89-50-4E-47-0D-0A-1A-0A')) {
        throw "Invalid PNG: $capriName"
    }
    $capriRecords += [pscustomobject]@{
        file = $capriName
        description = $capriMatch.Groups[1].Value
        repositoryPath = $capriRelative
        source = $capriUrl
        bytes = $capriBytes.Length
        sha256 = (Get-FileHash -LiteralPath $capriTarget -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    Write-Output "Verified $capriName ($($capriBytes.Length) bytes)"
}
$capriManifest = [ordered]@{
    repository = "https://github.com/$capriRepo"
    commit = $capriCommit
    retrievedUtc = [DateTime]::UtcNow.ToString('o')
    purpose = 'README illustrations for local Capri art and animation reference; not a complete rigged model.'
    rights = 'Repository code license does not cover character artwork. Preserve attribution; see upstream README and LICENSE.'
    images = $capriRecords
}
$capriManifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $capriDestination 'SOURCES.json') -Encoding UTF8
$capriNotice = @"
# Capri reference images

Source: https://github.com/$capriRepo
Revision: $capriCommit

These images are linked from the upstream README. They are presentation/reference images, not a complete layered or rigged character model.

Upstream credits Capri / Cyberpunk to CD PROJEKT RED, Studio Trigger and Netflix and says character artwork is excluded from the code license. The current code license is PolyForm Noncommercial 1.0.0. Downloading these images does not grant additional rights to the character or artwork.

Original filenames are preserved. SOURCES.json records each URL, description, file size and SHA-256. Existing user-supplied files outside this folder are unchanged.
"@
Set-Content -LiteralPath (Join-Path $capriDestination 'SOURCE-NOTES.md') -Value $capriNotice -Encoding UTF8
Write-Output "Saved $($capriRecords.Count) images to $capriDestination"
