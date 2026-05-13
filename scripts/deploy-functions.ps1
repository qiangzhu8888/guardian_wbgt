#Requires -Version 5.1
<#
.SYNOPSIS
  Deploy Cloud Functions to Firebase (production or selected project).

.DESCRIPTION
  Wrapper for firebase deploy --only functions. Not for the local emulator. Requires firebase login.

.PARAMETER Project
  Passed to firebase -P. If omitted, reads projects.default from repo root .firebaserc.

.PARAMETER NonInteractive
  Adds --non-interactive (CI-friendly).

.NOTES
  For Hosting/Firestore rules only, invoke the Firebase CLI directly.
  Omitting -Project passes -P from .firebaserc (repository wins over global firebase use).

.EXAMPLE
  .\scripts\deploy-functions.ps1

.EXAMPLE
  .\scripts\deploy-functions.ps1 -Project my-firebase-project
#>
param(
  [string] $Project = '',
  [switch] $NonInteractive
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Read-FirebaseDefaultProjectId {
  param([string] $RepoRoot)
  $rcPath = Join-Path $RepoRoot '.firebaserc'
  if (-not (Test-Path -LiteralPath $rcPath)) { return '' }
  try {
    $j = Get-Content -LiteralPath $rcPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $id = $j.projects.default
    if (-not [string]::IsNullOrWhiteSpace([string]$id)) {
      return [string]$id
    }
  } catch {
    return ''
  }
  return ''
}

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$firebase = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebase) {
  throw 'firebase CLI not found. Install: npm install -g firebase-tools'
}

$firebaseProjectId = if (-not [string]::IsNullOrWhiteSpace($Project)) {
  $Project.Trim()
} else {
  Read-FirebaseDefaultProjectId -RepoRoot $repoRoot
}

if (-not [string]::IsNullOrWhiteSpace($firebaseProjectId)) {
  if (-not [string]::IsNullOrWhiteSpace($Project)) {
    $projectVia = 'explicitProjectParameter'
  } else {
    $projectVia = 'implicitFirebasercDefault'
  }
  Write-Host "[deploy-functions] firebase project=$firebaseProjectId sourcekind=$projectVia" -ForegroundColor Yellow
} else {
  Write-Host '[deploy-functions] WARN: cannot read projects.default from .firebaserc; firebase CLI active project is used.' -ForegroundColor DarkYellow
}

$fbArgs = @('deploy', '--only', 'functions')
if (-not [string]::IsNullOrWhiteSpace($firebaseProjectId)) {
  $fbArgs += @('-P', $firebaseProjectId)
}
if ($NonInteractive) {
  $fbArgs += '--non-interactive'
}

Write-Host "[deploy-functions] firebase $($fbArgs -join ' ')" -ForegroundColor Green
& firebase @fbArgs
