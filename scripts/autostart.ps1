param(
  [ValidateSet("install", "uninstall", "status")]
  [string]$Action = "install"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$exe = Join-Path $root "Gr8rStudio.exe"
$runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$name = "Gr8rStudio"

switch ($Action) {
  "install" {
    if (-not (Test-Path $exe)) {
      & (Join-Path $PSScriptRoot "build-exe.ps1")
    }
    if (-not (Test-Path $runKey)) {
      New-Item -Path $runKey -Force | Out-Null
    }
    $cmd = "`"$exe`" --autostart"
    Set-ItemProperty -Path $runKey -Name $name -Value $cmd
    Write-Host "Autoinicio activado en Windows ($runKey\$name -> $cmd)"
  }
  "uninstall" {
    if (Test-Path $runKey) {
      Remove-ItemProperty -Path $runKey -Name $name -ErrorAction SilentlyContinue
    }
    Write-Host "Autoinicio desactivado."
  }
  "status" {
    $val = (Get-ItemProperty -Path $runKey -Name $name -ErrorAction SilentlyContinue).$name
    if ($val) {
      Write-Host "Autoinicio ACTIVO: $val"
    } else {
      Write-Host "Autoinicio DESACTIVADO"
    }
  }
}
