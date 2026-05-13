#Requires -Version 5.1
<#
.SYNOPSIS
  Run acceptance checks (frontend build + tests + functions tests + optional tests/).

.DESCRIPTION
  - frontend: npm ci, npm run build, npm test
  - functions: npm ci, seed-test-data --dry-run, npm test
  - If tests/package.json exists: npm ci, npm run test:functional / test:e2e (--if-present)

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

.EXAMPLE
  .\scripts\run-acceptance-tests.ps1

.EXAMPLE
  .\scripts\run-acceptance-tests.ps1 -FreshFrontend -UseInstall
#>
param(
  [switch] $UseInstall,
  [switch] $FreshFrontend,
  [switch] $SkipFrontendBuild,
  [switch] $SkipSeedDryRun,
  [switch] $SkipOptionalTestsDir
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-LikelyNpmEpremFileLock {
  param([long] $ExitCode)
  # Windows: EPERM on unlink frequently surfaces as errno -4048 / unsigned rollover.
  return ($ExitCode -eq -4048) -or ($ExitCode -eq 4294963248)
}

function Write-NpmFileLockHintIfNeeded {
  param([string] $WorkingDirectory, [long] $ExitCode)
  if (-not (Test-LikelyNpmEpremFileLock -ExitCode $ExitCode)) {
    return
  }
  $wd = Resolve-Path $WorkingDirectory -ErrorAction SilentlyContinue
  $pathShow = if ($wd) { $wd.Path } else { $WorkingDirectory }
  Write-Host ''
  Write-Host 'hint: npm hit EPERM (file in use while replacing node_modules). Typical fixes:' -ForegroundColor Yellow
  Write-Host '  - Stop Vite dev servers, test runners, and other terminals using tools in:' -ForegroundColor Yellow
  Write-Host ('    "{0}"' -f $pathShow) -ForegroundColor DarkGray
  Write-Host '    (often @esbuild/*/esbuild.exe).' -ForegroundColor DarkGray
  Write-Host '  - Close antivirus real-time scan for the repo folder, then retry.' -ForegroundColor Yellow
  Write-Host '  - Retry with:' -ForegroundColor Yellow
  Write-Host '      .\scripts\run-acceptance-tests.ps1 -FreshFrontend' -ForegroundColor DarkGray
  Write-Host '    or manually delete frontend\node_modules, then rerun.' -ForegroundColor Yellow
  Write-Host '  - If policy allows, use `-UseInstall` instead of npm ci:' -ForegroundColor Yellow
  Write-Host '      .\scripts\run-acceptance-tests.ps1 -FreshFrontend -UseInstall' -ForegroundColor DarkGray
}

function Invoke-NpmCommand {
  param(
    [string] $Label,
    [string[]] $Arguments,
    [string] $WorkingDirectory
  )
  Write-Host "[acceptance] $Label" -ForegroundColor Cyan
  Push-Location $WorkingDirectory
  try {
    & npm @Arguments
    $code = [long]$LASTEXITCODE
    if ($LASTEXITCODE -ne 0) {
      Write-NpmFileLockHintIfNeeded -WorkingDirectory $PWD.Path -ExitCode $code
      throw "npm failed (exit $($LASTEXITCODE)): $Label"
    }
  }
  finally {
    Pop-Location
  }
}

function Remove-TreeIfPresent {
  param(
    [string] $AbsolutePath,
    [string] $Description
  )
  if (-not (Test-Path -LiteralPath $AbsolutePath)) {
    Write-Host "[acceptance] skip $Description (missing): $AbsolutePath" -ForegroundColor DarkGray
    return
  }
  Write-Host "[acceptance] removing $Description" -ForegroundColor Cyan
  Remove-Item -LiteralPath $AbsolutePath -Recurse -Force -ErrorAction Stop
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
  Remove-TreeIfPresent (Join-Path $frontend 'node_modules') 'fresh frontend: frontend/node_modules'
}

Invoke-NpmCommand 'frontend: npm ci or install' $npmInstallArgs $frontend

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
