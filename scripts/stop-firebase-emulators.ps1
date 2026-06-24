#Requires -Version 5.1
<#
.SYNOPSIS
  Stop Firebase emulator processes that hold ports from firebase.json.

.EXAMPLE
  .\scripts\stop-firebase-emulators.ps1
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$firebaseJson = Join-Path $repoRoot 'firebase.json'
. (Join-Path $PSScriptRoot 'firebase-emulator-ports.ps1')

$ports = Get-FirebaseEmulatorPortMap -FirebaseJsonPath $firebaseJson
$inUse = @(Test-FirebaseEmulatorPortsInUse -PortMap $ports)

if ($inUse.Count -eq 0) {
  Write-Host '[stop-firebase-emulators] No emulator listeners found on configured ports.' -ForegroundColor DarkGray
  exit 0
}

foreach ($row in $inUse) {
  $pidList = ($row.Pids -join ', ')
  Write-Host ('[stop-firebase-emulators] {0} port {1} -> PID {2}' -f $row.Name, $row.Port, $pidList) -ForegroundColor Yellow
}

$pids = @(Get-FirebaseEmulatorListenerPids -PortMap $ports)
foreach ($procId in $pids) {
  try {
    $proc = Get-Process -Id $procId -ErrorAction Stop
    Write-Host ('[stop-firebase-emulators] Stopping {0} (PID {1})' -f $proc.ProcessName, $procId) -ForegroundColor Cyan
    Stop-Process -Id $procId -Force -ErrorAction Stop
  }
  catch {
    Write-Host ('[stop-firebase-emulators] Could not stop PID {0}: {1}' -f $procId, $_.Exception.Message) -ForegroundColor Red
  }
}

Start-Sleep -Seconds 2

$still = @(Test-FirebaseEmulatorPortsInUse -PortMap $ports)
if ($still.Count -gt 0) {
  Write-Host '[stop-firebase-emulators] Some ports are still in use. Close the emulator terminal (Ctrl+C) or reboot stale java/node manually.' -ForegroundColor Red
  exit 1
}

Write-Host '[stop-firebase-emulators] Emulator ports released.' -ForegroundColor Green
