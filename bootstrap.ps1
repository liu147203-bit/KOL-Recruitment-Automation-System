$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Payload = Join-Path $Root "payload"

function Restore-Base64File($SourceFiles, $TargetPath) {
  $base64 = ($SourceFiles | ForEach-Object { Get-Content -LiteralPath $_ -Raw }) -join ""
  $base64 = $base64 -replace '\s', ''
  $bytes = [Convert]::FromBase64String($base64)
  $parent = Split-Path -Parent $TargetPath
  if ($parent) { New-Item -ItemType Directory -Force $parent | Out-Null }
  [IO.File]::WriteAllBytes($TargetPath, $bytes)
}

Restore-Base64File @((Join-Path $Payload "install-and-configure.ps1.b64")) (Join-Path $Root "install-and-configure.ps1")
Restore-Base64File @((Join-Path $Payload "setup_google_sheet.js.b64")) (Join-Path $Root "scripts\setup_google_sheet.js")
Restore-Base64File @((Join-Path $Payload "test_google_sheet_access.js.b64")) (Join-Path $Root "scripts\test_google_sheet_access.js")
$templateParts = Get-ChildItem -LiteralPath $Payload -Filter "template.xlsx.b64.part*" | Sort-Object Name | Select-Object -ExpandProperty FullName
Restore-Base64File $templateParts (Join-Path $Root "templates\KOL招募表结构模板.xlsx")

& (Join-Path $Root "install-and-configure.ps1")
exit $LASTEXITCODE
