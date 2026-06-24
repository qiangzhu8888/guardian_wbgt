#Requires -Version 5.1
# UTF-8 BOM recommended for Windows PowerShell 5.1 when path contains non-ASCII.
# start-firebase-emulators.ps1 - Run Firebase emulators (repo root).
# Default emulator ports: see firebase.json (e.g. Functions 65001, Firestore 63130, UI 63140, Hub 63100).
# ApiOnly: functions + firestore. Mode Full: also hosting (requires frontend/dist).
# Usage: .\scripts\start-firebase-emulators.ps1
#        .\scripts\start-firebase-emulators.ps1 -Mode Full -BuildFrontend

param(
  [ValidateSet("ApiOnly", "Full")]
  [string] $Mode = "ApiOnly",
  [switch] $BuildFrontend,
  [switch] $Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$firebaseJson = Join-Path $repoRoot "firebase.json"
. (Join-Path $PSScriptRoot "firebase-emulator-ports.ps1")

if (-not (Test-Path -LiteralPath $firebaseJson)) {
  throw "firebase.json not found: $firebaseJson"
}

$portMap = Get-FirebaseEmulatorPortMap -FirebaseJsonPath $firebaseJson
$inUse = @(Test-FirebaseEmulatorPortsInUse -PortMap $portMap)
if ($inUse.Count -gt 0) {
  $uiPort = $portMap.Ui
  $fnPort = $portMap.Functions
  if ($Force) {
    Write-Host "[start-firebase-emulators] Stopping existing emulator (-Force)..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "stop-firebase-emulators.ps1")
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to stop existing emulator. Run .\scripts\stop-firebase-emulators.ps1 manually."
    }
  }
  else {
    Write-Host "[start-firebase-emulators] Emulator ports already in use (likely already running)." -ForegroundColor Yellow
    Write-Host ('  Functions: http://127.0.0.1:{0}/' -f $fnPort) -ForegroundColor DarkGray
    Write-Host ('  Emulator UI: http://127.0.0.1:{0}/' -f $uiPort) -ForegroundColor DarkGray
    Write-Host '  Run seed without restarting: .\scripts\seed-admin-emulator.ps1' -ForegroundColor Green
    Write-Host '  To restart emulators: .\scripts\stop-firebase-emulators.ps1 then run this script again.' -ForegroundColor DarkGray
    Write-Host '  Or: .\scripts\start-firebase-emulators.ps1 -Force' -ForegroundColor DarkGray
    exit 0
  }
}

$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
  throw "firebase CLI not found. Install: npm install -g firebase-tools"
}

Set-Location -LiteralPath $repoRoot

switch ($Mode) {
  "Full" {
    $distIndex = Join-Path $repoRoot "frontend\dist\index.html"
    if ($BuildFrontend -or -not (Test-Path -LiteralPath $distIndex)) {
      Write-Host "[start-firebase-emulators] building frontend..." -ForegroundColor Cyan
      Push-Location -LiteralPath (Join-Path $repoRoot "frontend")
      try {
        npm install
        if ($LASTEXITCODE -ne 0) { throw "npm install failed in frontend" }
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed in frontend" }
      }
      finally {
        Pop-Location
      }
    }
    # PowerShell: comma in --only MUST be inside quotes or it splits into multiple argv tokens.
    Write-Host "[start-firebase-emulators] functions, firestore, hosting" -ForegroundColor Green
    firebase emulators:start --only "functions,firestore,hosting"
  }
  default {
    Write-Host "[start-firebase-emulators] functions, firestore (no hosting)" -ForegroundColor Green
    firebase emulators:start --only "functions,firestore"
  }
}
