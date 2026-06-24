#Requires -Version 5.1
<#
.SYNOPSIS
  After emulators start, run first admin bootstrap (POST bootstrap / bootstrap-superadmin).

.DESCRIPTION
  Thin wrapper for functions/npm run seed:admin. Reads AUTH_BOOTSTRAP_SECRET / SEED_* from functions/.env.
  Fails fast when Functions emulator is not listening on firebase.json emulators.functions.port.

.EXAMPLE
  .\scripts\seed-admin-emulator.ps1

.NOTES
  Start Functions + Firestore emulators first (e.g. start-firebase-emulators.ps1).
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$functionsDir = Join-Path $repoRoot 'functions'
$firebaseJson = Join-Path $repoRoot 'firebase.json'

if (-not (Test-Path -LiteralPath $firebaseJson)) {
  throw "firebase.json not found: $firebaseJson"
}

$config = Get-Content -LiteralPath $firebaseJson -Raw | ConvertFrom-Json
$fnPort = [int]$config.emulators.functions.port
if ($fnPort -le 0) {
  $fnPort = 65001
}

$tcp = Test-NetConnection -ComputerName '127.0.0.1' -Port $fnPort -WarningAction SilentlyContinue
if (-not $tcp.TcpTestSucceeded) {
  $msg = '[seed-admin-emulator] Functions emulator is not listening on 127.0.0.1:{0} (ECONNREFUSED).' -f $fnPort
  Write-Host $msg -ForegroundColor Red
  Write-Host '  Start emulators first in another terminal:' -ForegroundColor Yellow
  Write-Host '    .\scripts\start-firebase-emulators.ps1' -ForegroundColor Yellow
  Write-Host '  Emulator UI: http://127.0.0.1:63140/' -ForegroundColor DarkGray
  exit 1
}

Set-Location -LiteralPath $functionsDir

$runMsg = '[seed-admin-emulator] npm run seed:admin (Functions port {0})' -f $fnPort
Write-Host $runMsg -ForegroundColor Green
npm run seed:admin
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
