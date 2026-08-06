# Purpose: Free common dev ports safely on Windows
param(
  [int[]]$Ports = @(
    if ($Env:HTTP_PORT) { [int]$Env:HTTP_PORT } else { 3000 },
    if ($Env:API_PORT) { [int]$Env:API_PORT } else { 3001 },
    if ($Env:WS_PORT) { [int]$Env:WS_PORT } else { 3002 }
  )
)

function Kill-Port {
  param([int]$Port)
  $lines = netstat -ano | Select-String ":$Port\s+.*LISTENING"
  if ($lines) {
    $pids = ($lines -replace '.*\s(\d+)$','$1') | Sort-Object -Unique
    foreach ($pid in $pids) {
      try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {}
      Start-Sleep -Milliseconds 200
    }
    Write-Output "Killed PIDs on :$Port -> $($pids -join ',')"
  } else {
    Write-Output "No listeners on :$Port"
  }
}

foreach ($p in $Ports) {
  Kill-Port -Port $p
}

Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Path -match 'node' } | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Output "Ports freed."
