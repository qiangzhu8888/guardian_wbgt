#Requires -Version 5.1
<#
.SYNOPSIS
  Production Firebase deploy: Firestore rules/indexes, Cloud Functions, and Hosting.

.DESCRIPTION
  Matches DEPLOY.md: builds frontend when hosting is targeted, installs functions deps when needed,
  then runs firebase deploy.

.PARAMETER Only
  Comma list for firebase --only. Default: firestore,functions,hosting

.PARAMETER Project
  firebase -P. If omitted, uses projects.default from .firebaserc.

.PARAMETER NonInteractive
  Passes --non-interactive (CI-friendly).

.PARAMETER SkipFrontendBuild
  Skip frontend npm ci/build even when hosting is deployed.

.PARAMETER SkipFunctionsInstall
  Skip npm ci under functions even when deploying functions.

.PARAMETER UseInstall
  Use npm install instead of npm ci (local convenience).

.PARAMETER FreshFrontend
  Delete frontend/node_modules before npm ci/install (helps Windows EPERM on native addons).

.PARAMETER NoFrontendEpermRecover
  Windows only: by default frontend npm deletes node_modules once on EPERM and retries. Omit that with this switch.

.PARAMETER FreshFunctions
  Delete functions/node_modules before npm ci/install when deploying functions.

.PARAMETER NoFunctionsEpermRecover
  Windows only: by default functions npm deletes node_modules once on EPERM and retries. Omit that with this switch.

.NOTES
  Not Hosting emulator workflow. firebase login required.
  Comma in --only is passed verbatim from this script.
  Omitting -Project adds -P from .firebaserc (overrides global firebase use).

.EXAMPLE
  .\scripts\deploy-production.ps1

.EXAMPLE
  .\scripts\deploy-production.ps1 -Only functions

.EXAMPLE
  .\scripts\deploy-production.ps1 -Project my-project-id -NonInteractive
#>
param(
  [string] $Only = 'firestore,functions,hosting',
  [string] $Project = '',
  [switch] $NonInteractive,
  [switch] $SkipFrontendBuild,
  [switch] $SkipFunctionsInstall,
  [switch] $UseInstall,
  [switch] $FreshFrontend,
  [switch] $NoFrontendEpermRecover,
  [switch] $FreshFunctions,
  [switch] $NoFunctionsEpermRecover
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'npm-win-hardening.ps1')

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
$firebase = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebase) {
  throw 'firebase CLI not found. Install: npm install -g firebase-tools'
}

$targets = $Only -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
if ($targets.Count -eq 0) {
  throw '-Only cannot be empty. Example: firestore,functions,hosting'
}

$onlyArg = ($targets -join ',')

$needsHosting = $targets -contains 'hosting'
$needsFunctions = $targets -contains 'functions'

if ($needsHosting -and -not $SkipFrontendBuild) {
  Write-Host '[deploy-production] frontend: npm ci/install then build' -ForegroundColor Cyan
  $frontend = Join-Path $repoRoot 'frontend'
  if (-not (Test-Path (Join-Path $frontend 'package.json'))) {
    throw "Missing frontend/package.json: $frontend"
  }

  if ($FreshFrontend) {
    Remove-TreeIfPresent '[deploy-production]' (Join-Path $frontend 'node_modules') 'fresh frontend: frontend/node_modules'
  }

  $npmDepsArgs = if ($UseInstall) { @('install') } else { @('ci') }
  Invoke-RobustNpm -LogPrefix '[deploy-production]' -Label 'frontend: npm ci or install' `
    -WorkingDirectory $frontend -NpmArguments $npmDepsArgs `
    -RecoverOnceIfEperm:$(-not $NoFrontendEpermRecover)

  Invoke-RobustNpm -LogPrefix '[deploy-production]' -Label 'frontend: npm run build' `
    -WorkingDirectory $frontend -NpmArguments @('run', 'build')
} elseif ($needsHosting -and $SkipFrontendBuild) {
  $distIndex = Join-Path $repoRoot 'frontend\dist\index.html'
  if (-not (Test-Path $distIndex)) {
    throw "Hosting requires frontend/dist. Remove SkipFrontendBuild or run npm run build first: $distIndex"
  }
  Write-Host '[deploy-production] skip frontend build (reuse existing dist)' -ForegroundColor DarkGray
}

if ($needsFunctions -and -not $SkipFunctionsInstall) {
  Write-Host '[deploy-production] functions: npm ci/install' -ForegroundColor Cyan
  $functionsDir = Join-Path $repoRoot 'functions'
  if (-not (Test-Path (Join-Path $functionsDir 'package.json'))) {
    throw "Missing functions/package.json: $functionsDir"
  }
  if ($FreshFunctions) {
    Remove-TreeIfPresent '[deploy-production]' (Join-Path $functionsDir 'node_modules') 'fresh functions: functions/node_modules'
  }
  $npmDepsArgsFn = if ($UseInstall) { @('install') } else { @('ci') }
  Invoke-RobustNpm -LogPrefix '[deploy-production]' -Label 'functions: npm ci or install' `
    -WorkingDirectory $functionsDir -NpmArguments $npmDepsArgsFn `
    -RecoverOnceIfEperm:$(-not $NoFunctionsEpermRecover)
}

Set-Location $repoRoot
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
  Write-Host "[deploy-production] firebase project=$firebaseProjectId sourcekind=$projectVia" -ForegroundColor Yellow
} else {
  Write-Host '[deploy-production] WARN: cannot read projects.default from .firebaserc; firebase CLI active project is used.' -ForegroundColor DarkYellow
}

$fbArgs = @('deploy', '--only', $onlyArg)
if (-not [string]::IsNullOrWhiteSpace($firebaseProjectId)) {
  $fbArgs += @('-P', $firebaseProjectId)
}
if ($NonInteractive) {
  $fbArgs += '--non-interactive'
}

Write-Host "[deploy-production] firebase $($fbArgs -join ' ')" -ForegroundColor Green
& firebase @fbArgs
if ($LASTEXITCODE -ne 0) {
  throw "firebase deploy failed (exit $($LASTEXITCODE))"
}
