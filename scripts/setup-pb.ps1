$ErrorActionPreference = "Stop"
$dir = Join-Path $PSScriptRoot "..\pocketbase"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$exe = Join-Path $dir "pocketbase.exe"
if (Test-Path $exe) {
  Write-Host "PocketBase ya está instalado en $exe"
  & $exe --version
  exit 0
}
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/pocketbase/pocketbase/releases/latest"
$url = ($release.assets | Where-Object { $_.name -match "windows_amd64\.zip$" }).browser_download_url
$zip = Join-Path $dir "pb.zip"
Write-Host "Descargando $($release.tag_name)..."
Invoke-WebRequest -Uri $url -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $dir -Force
Remove-Item $zip
& $exe --version
