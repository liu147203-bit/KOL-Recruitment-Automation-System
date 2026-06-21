$listeners = netstat -ano | Select-String ':5678' | ForEach-Object {
  ($_ -split '\s+')[-1]
} | Sort-Object -Unique

if (!$listeners) {
  Write-Host "No n8n process found on port 5678."
  exit 0
}

foreach ($pidText in $listeners) {
  try {
    Stop-Process -Id ([int]$pidText) -Force
    Write-Host "Stopped process $pidText."
  } catch {
    Write-Host "Could not stop process ${pidText}: $($_.Exception.Message)"
  }
}
