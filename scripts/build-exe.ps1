$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$src = Join-Path $PSScriptRoot "launcher\Gr8rStudio.cs"
$out = Join-Path $root "Gr8rStudio.exe"

$cscCandidates = @(
  "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
  "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)
$csc = $cscCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $csc) {
  $cmd = Get-Command csc.exe -ErrorAction SilentlyContinue
  if ($cmd) { $csc = $cmd.Source }
}
if (-not $csc) {
  throw "No se encontró el compilador C# (.NET Framework csc.exe)."
}

& $csc /nologo /target:winexe /optimize+ /platform:anycpu /out:$out `
  /r:System.dll /r:System.Drawing.dll /r:System.Windows.Forms.dll $src

if ($LASTEXITCODE -ne 0) {
  throw "Error compilando Gr8rStudio.exe (código $LASTEXITCODE)"
}

Write-Host "Ejecutable generado en: $out"
