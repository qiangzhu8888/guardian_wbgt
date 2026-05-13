#Requires -Version 5.1
<#
.SYNOPSIS
  Start the Vite dev server (frontend/).

.DESCRIPTION
  /api requests are forwarded by vite.config.js to the Firebase Functions emulator.
  Use -LaunchEmulators to spawn a second terminal that runs start-firebase-emulators.ps1.
  Emulator-side env comes from functions/.env when loaded by that process.
  If node_modules is missing or vite is not installed, npm install is run automatically unless you use -SkipDepsCheck.

.PARAMETER LaunchEmulators
  Start scripts/start-firebase-emulators.ps1 in a new powershell.exe window (ApiOnly mode).

.PARAMETER InstallDeps
  Always run npm install inside frontend before npm run dev.

.PARAMETER SkipDepsCheck
  Do not auto-run npm install when vite is missing.

.NOTES
  Keep .firebaserc default project ID aligned with frontend/vite.config.js rewrite for /api.

.EXAMPLE
  .\scripts\start-local-frontend-dev.ps1

.EXAMPLE
  .\scripts\start-local-frontend-dev.ps1 -LaunchEmulators
#>
param(
  [switch] $LaunchEmulators,
  [switch] $InstallDeps,
  [switch] $SkipDepsCheck
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$emuScript = Join-Path $repoRoot 'scripts\start-firebase-emulators.ps1'

if ($LaunchEmulators) {
  if (-not (Test-Path $emuScript)) {
    throw "Emulator script not found: $emuScript"
  }
  Write-Host '[start-local-frontend-dev] Opening a new window for emulators...' -ForegroundColor Cyan
  Start-Process -FilePath 'powershell.exe' -WorkingDirectory $repoRoot -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-File', $emuScript,
    '-Mode', 'ApiOnly'
  )
  Write-Host '[start-local-frontend-dev] Waiting 8 seconds for emulator startup...' -ForegroundColor DarkGray
  Start-Sleep -Seconds 8
}

$frontend = Join-Path $repoRoot 'frontend'
if (-not (Test-Path (Join-Path $frontend 'package.json'))) {
  throw "frontend/package.json not found: $frontend"
}

Set-Location $frontend

function Test-FrontendVitePresent {
  $binViteCmd = Join-Path $frontend 'node_modules\.bin\vite.cmd'
  $binVite = Join-Path $frontend 'node_modules\.bin\vite'
  $pkgVite = Join-Path $frontend 'node_modules\vite\package.json'
  return (
    (Test-Path -LiteralPath $binViteCmd) -or
    (Test-Path -LiteralPath $binVite) -or
    (Test-Path -LiteralPath $pkgVite)
  )
}

if ($InstallDeps -or ((-not $SkipDepsCheck) -and -not (Test-FrontendVitePresent))) {
  if ($InstallDeps) {
    Write-Host '[start-local-frontend-dev] InstallDeps: npm install' -ForegroundColor Cyan
  } else {
    Write-Host '[start-local-frontend-dev] vite missing; running npm install' -ForegroundColor Yellow
  }
  npm install
  if ($LASTEXITCODE -ne 0) {
    throw "npm install failed (exit $LASTEXITCODE)"
  }
}

Write-Host '[start-local-frontend-dev] npm run dev (Ctrl+C to stop)' -ForegroundColor Green
npm run dev
