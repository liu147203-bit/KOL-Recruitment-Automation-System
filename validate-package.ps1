$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$errors = New-Object System.Collections.Generic.List[string]

function Add-Error($Message) {
  $script:errors.Add($Message) | Out-Null
  Write-Host "FAIL: $Message"
}

function Add-Ok($Message) {
  Write-Host "OK: $Message"
}

Write-Host "Validating package: $Root"

$forbiddenPaths = @(
  "runtime",
  "logs",
  "config.local.json",
  "runtime\private",
  "runtime\n8n-data"
)

foreach ($relative in $forbiddenPaths) {
  if (Test-Path (Join-Path $Root $relative)) {
    Add-Error "Forbidden path exists: $relative"
  } else {
    Add-Ok "Forbidden path not present: $relative"
  }
}

$files = Get-ChildItem $Root -Recurse -File | Where-Object {
  $_.FullName -notlike "*\validate-package.ps1"
}

$forbiddenFileNames = @(
  "*.local.json",
  "*credential_import*",
  "*service_account*.json",
  "*service-account*.json"
)

foreach ($pattern in $forbiddenFileNames) {
  $hits = $files | Where-Object { $_.Name -like $pattern }
  if ($hits) {
    Add-Error "Forbidden credential-like file found: $pattern"
    $hits | Select-Object FullName | Format-Table -AutoSize
  } else {
    Add-Ok "No credential-like file found: $pattern"
  }
}

$secretRegexes = @(
  "-----BEGIN\s+PRIVATE\s+KEY-----",
  '"private_key"\s*:',
  '"client_email"\s*:\s*"[^"]+@[^"]+\.iam\.gserviceaccount\.com"',
  '"password"\s*:\s*"[^"]{8,}"'
)

foreach ($regex in $secretRegexes) {
  $hits = $files | Select-String -Pattern $regex -ErrorAction SilentlyContinue
  if ($hits) {
    Add-Error "Potential secret content found by regex: $regex"
    $hits | Select-Object Path, LineNumber | Format-Table -AutoSize
  } else {
    Add-Ok "No secret content found by regex: $regex"
  }
}

$psFiles = @(
  "install-and-configure.ps1",
  "start-n8n.ps1",
  "stop-n8n.ps1",
  "validate-package.ps1"
)

foreach ($relative in $psFiles) {
  $path = Join-Path $Root $relative
  try {
    $null = [scriptblock]::Create((Get-Content -Raw $path))
    Add-Ok "PowerShell parses: $relative"
  } catch {
    Add-Error "PowerShell parse failed: $relative - $($_.Exception.Message)"
  }
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
  $jsFiles = @(
    "scripts\build_workflows_from_config.js",
    "scripts\setup_google_sheet.js",
    "scripts\test_google_sheet_access.js",
    "scripts\activate_latest_workflows.js"
  )
  foreach ($relative in $jsFiles) {
    $path = Join-Path $Root $relative
    & node --check $path
    if ($LASTEXITCODE -eq 0) {
      Add-Ok "Node syntax checks: $relative"
    } else {
      Add-Error "Node syntax check failed: $relative"
    }
  }
} else {
  Write-Host "WARN: node not found. Skipping JS syntax checks."
}

if ($errors.Count -gt 0) {
  Write-Host ""
  Write-Host "Validation failed with $($errors.Count) issue(s)."
  exit 1
}

Write-Host ""
Write-Host "Validation passed."
