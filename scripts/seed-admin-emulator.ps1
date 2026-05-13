#Requires -Version 5.1
<#
.SYNOPSIS
  After emulators start, run first admin bootstrap (POST bootstrap / bootstrap-superadmin).

.DESCRIPTION
  Thin wrapper for functions/npm run seed:admin. Reads AUTH_BOOTSTRAP_SECRET / SEED_* from functions/.env.

.EXAMPLE
  .\scripts\seed-admin-emulator.ps1

.NOTES
  Start Functions + Firestore emulators first (e.g. start-firebase-emulators.ps1).
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$functionsDir = Join-Path $repoRoot 'functions'
Set-Location $functionsDir

Write-Host '[seed-admin-emulator] npm run seed:admin' -ForegroundColor Green
npm run seed:admin
