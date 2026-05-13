#Requires -Version 5.1
<#
.SYNOPSIS
  Run acceptance checks (frontend build + tests + functions tests + optional tests/).

.DESCRIPTION
  - frontend: npm ci, npm run build, npm test
  - functions: npm ci, seed-test-data dry-run, npm test
  - If tests/package.json exists: npm ci, npm run test:functional / test:e2e (--if-present)
  - Windows: if frontend npm hits EPERM, node_modules under frontend is deleted and npm runs again once (omit with -NoFrontendEpermRecover).

.PARAMETER UseInstall
  Use npm install instead of npm ci.

.PARAMETER SkipFrontendBuild
  Skip frontend npm run build.

.PARAMETER SkipSeedDryRun
  Skip seed-test-data --dry-run.

.PARAMETER SkipOptionalTestsDir
  Skip tests/ entirely even if package.json exists.

.PARAMETER FreshFrontend
  Delete frontend/node_modules before npm ci/install (helps when npm fails with EPERM unlink on Windows).

.PARAMETER NoFrontendEpermRecover
  On Windows only: by default one EPERM npm failure deletes frontend/node_modules and retries npm once. Pass this switch to disable that behavior.

.EXAMPLE
  .\scripts\run-acceptance-tests.ps1

.EXAMPLE
  .\scripts\run-acceptance-tests.ps1 -FreshFrontend -UseInstall

.EXAMPLE
  .\scripts\run-acceptance-tests.ps1 -NoFrontendEpermRecover
#>
param(
  [switch] $UseInstall,
  [switch] $FreshFrontend,
  [switch] $NoFrontendEpermRecover,
  [switch] $SkipFrontendBuild,
  [switch] $SkipSeedDryRun,
  [switch] $SkipOptionalTestsDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'npm-win-hardening.ps1')

function Invoke-NpmCommand {
  param(
    [string] $Label,
    [string[]] $Arguments,
    [string] $WorkingDirectory,
    [switch] $RecoverOnceIfEperm
  )
  Invoke-RobustNpm -LogPrefix '[acceptance]' -Label $Label -WorkingDirectory $WorkingDirectory `
    -NpmArguments $Arguments -RecoverOnceIfEperm:$RecoverOnceIfEperm
}

function Invoke-NodeCommand {
  param(
    [string] $Label,
    [string[]] $Arguments,
    [string] $WorkingDirectory
  )
  Write-Host "[acceptance] $Label" -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    & node @Arguments
    if ($LASTEXITCODE -ne 0) {
      throw "node failed (exit $LASTEXITCODE): $Label"
    }
  }
  finally {
    Pop-Location
  }
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$npmInstallArgs = if ($UseInstall) { @('install') } else { @('ci') }

$frontend = Join-Path $repoRoot 'frontend'
if (-not (Test-Path (Join-Path $frontend 'package.json'))) {
  throw "Missing frontend/package.json: $frontend"
}

if ($FreshFrontend) {
  Remove-TreeIfPresent '[acceptance]' (Join-Path $frontend 'node_modules') 'fresh frontend: frontend/node_modules'
}

Invoke-NpmCommand 'frontend: npm ci or install' $npmInstallArgs $frontend -RecoverOnceIfEperm:$(-not $NoFrontendEpermRecover)

if ($SkipFrontendBuild) {
  Write-Host '[acceptance] skip frontend build' -ForegroundColor DarkGray
} else {
  Invoke-NpmCommand 'frontend: npm run build' @('run', 'build') $frontend
}

Invoke-NpmCommand 'frontend: npm test' @('test') $frontend

$functionsDir = Join-Path $repoRoot 'functions'
if (-not (Test-Path (Join-Path $functionsDir 'package.json'))) {
  throw "Missing functions/package.json: $functionsDir"
}

Invoke-NpmCommand 'functions: npm ci or install' $npmInstallArgs $functionsDir

if ($SkipSeedDryRun) {
  Write-Host '[acceptance] skip seed-test-data dry-run' -ForegroundColor DarkGray
} else {
  $dryRunLabel = 'functions: seed-test-data dry-run'
  $dryRunArgs = @('scripts/seed-test-data.cjs', '--dry-run')
  Invoke-NodeCommand $dryRunLabel $dryRunArgs $functionsDir
}

Invoke-NpmCommand 'functions: npm test' @('test') $functionsDir

$testsDir = Join-Path $repoRoot 'tests'
$testsPkg = Join-Path $testsDir 'package.json'
$runTestsDir = (-not $SkipOptionalTestsDir) -and (Test-Path -LiteralPath $testsPkg)

if ($runTestsDir) {
  Invoke-NpmCommand 'tests: npm ci or install' $npmInstallArgs $testsDir
  Write-Host '[acceptance] tests: optional npm scripts' -ForegroundColor Cyan
  Push-Location $testsDir
  try {
    & npm run test:functional --if-present
    if ($LASTEXITCODE -ne 0) { throw 'tests: test:functional failed' }
    & npm run test:e2e --if-present
    if ($LASTEXITCODE -ne 0) { throw 'tests: test:e2e failed' }
  }
  finally {
    Pop-Location
  }
}

Write-Host '[acceptance] OK' -ForegroundColor Green
