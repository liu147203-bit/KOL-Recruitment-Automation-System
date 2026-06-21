$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$N8nLocal = Join-Path $Root "runtime\n8n-local"
$N8nData = Join-Path $Root "runtime\n8n-data"
$LogDir = Join-Path $Root "logs"
$OutLog = Join-Path $LogDir "n8n.out.log"

New-Item -ItemType Directory -Force $N8nData, $LogDir | Out-Null

$env:N8N_USER_FOLDER = $N8nData
$env:N8N_HOST = "127.0.0.1"
$env:N8N_LISTEN_ADDRESS = "127.0.0.1"
$env:N8N_PORT = "5678"
$env:N8N_PROTOCOL = "http"
$env:N8N_SECURE_COOKIE = "false"
$env:N8N_DIAGNOSTICS_ENABLED = "false"
$env:N8N_VERSION_NOTIFICATIONS_ENABLED = "false"
$env:N8N_DISABLED_MODULES = "insights"
$env:DB_SQLITE_POOL_SIZE = "2"

if (!(Test-Path (Join-Path $N8nLocal "node_modules\n8n\bin\n8n"))) {
  throw "n8n is not installed. Run 一键安装配置.cmd first."
}

$node = (Get-Command node -ErrorAction Stop).Source
$cmd = "set N8N_USER_FOLDER=$N8nData&& set N8N_HOST=127.0.0.1&& set N8N_LISTEN_ADDRESS=127.0.0.1&& set N8N_PORT=5678&& set N8N_PROTOCOL=http&& set N8N_SECURE_COOKIE=false&& set N8N_DIAGNOSTICS_ENABLED=false&& set N8N_VERSION_NOTIFICATIONS_ENABLED=false&& set N8N_DISABLED_MODULES=insights&& set DB_SQLITE_POOL_SIZE=2&& `"$node`" node_modules\n8n\bin\n8n start > `"$OutLog`" 2>&1"

Start-Process -FilePath "cmd.exe" -ArgumentList "/c $cmd" -WorkingDirectory $N8nLocal -WindowStyle Hidden
Start-Sleep -Seconds 8

Write-Host "n8n is starting at http://127.0.0.1:5678"
Write-Host "Log: $OutLog"
Start-Process "http://127.0.0.1:5678"
