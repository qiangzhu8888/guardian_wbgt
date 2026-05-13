#Requires -Version 5.1
<#
.SYNOPSIS
  Bootstrap first admin via POST /api/auth/bootstrap (idempotent on 409).

.DESCRIPTION
  Loads functions/.env for missing keys, then runs functions/scripts/bootstrap-first-admin.cjs.

.PARAMETER BootstrapBaseUrl
  Hosting origin without trailing slash, e.g. https://your-site.web.app

.PARAMETER EnvFile
  Path to .env. Default: <repo>/functions/.env

.EXAMPLE
  .\scripts\bootstrap-first-admin.ps1 -BootstrapBaseUrl "https://example.web.app" -AuthBootstrapSecret "secret" -AdminEmail "admin@example.com" -AdminPassword "SecurePass123"

.EXAMPLE
  .\scripts\bootstrap-first-admin.ps1

  Use Set-ExecutionPolicy -Scope CurrentUser RemoteSigned if script execution is blocked.
#>
param(
  [string] $BootstrapBaseUrl = $env:BOOTSTRAP_BASE_URL,
  [string] $AuthBootstrapSecret = $env:AUTH_BOOTSTRAP_SECRET,
  [string] $AdminEmail = $(if ($env:BOOTSTRAP_ADMIN_EMAIL) { $env:BOOTSTRAP_ADMIN_EMAIL } else { $env:SEED_ADMIN_EMAIL }),
  [string] $AdminPassword = $(if ($env:BOOTSTRAP_ADMIN_PASSWORD) { $env:BOOTSTRAP_ADMIN_PASSWORD } else { $env:SEED_ADMIN_PASSWORD }),
  [string] $EnvFile = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $EnvFile) {
  $EnvFile = Join-Path $repoRoot "functions\.env"
}

function Import-DotEnvKeys {
  param([string] $Path, [string[]] $Keys)
  if (-not (Test-Path -LiteralPath $Path)) { return }
  Get-Content -LiteralPath $Path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return }
    $name = $line.Substring(0, $eq).Trim()
    if ($Keys -notcontains $name) { return }
    $raw = $line.Substring($eq + 1).Trim()
    if ($raw.Length -ge 2 -and $raw.StartsWith('"') -and $raw.EndsWith('"')) {
      $raw = $raw.Substring(1, $raw.Length - 2)
    }
    if (-not [string]::IsNullOrEmpty([Environment]::GetEnvironmentVariable($name, 'Process'))) { return }
    Set-Item -Path "Env:$name" -Value $raw
  }
}

$dotenvKeys = @(
  'BOOTSTRAP_BASE_URL',
  'AUTH_BOOTSTRAP_SECRET',
  'BOOTSTRAP_ADMIN_EMAIL',
  'BOOTSTRAP_ADMIN_PASSWORD',
  'SEED_ADMIN_EMAIL',
  'SEED_ADMIN_PASSWORD'
)
Import-DotEnvKeys -Path $EnvFile -Keys $dotenvKeys

if ($BootstrapBaseUrl) { Set-Item -Path 'Env:BOOTSTRAP_BASE_URL' -Value $BootstrapBaseUrl.TrimEnd('/') }
if ($AuthBootstrapSecret) { Set-Item -Path 'Env:AUTH_BOOTSTRAP_SECRET' -Value $AuthBootstrapSecret }
if ($AdminEmail) { Set-Item -Path 'Env:BOOTSTRAP_ADMIN_EMAIL' -Value $AdminEmail }
if ($AdminPassword) { Set-Item -Path 'Env:BOOTSTRAP_ADMIN_PASSWORD' -Value $AdminPassword }

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  throw 'Node.js not found on PATH. Install Node.js 22.'
}

$scriptJs = Join-Path $repoRoot $(Join-Path "functions" $(Join-Path "scripts" "bootstrap-first-admin.cjs"))
if (-not (Test-Path -LiteralPath $scriptJs)) {
  throw "Script not found: $scriptJs"
}

Push-Location $repoRoot
try {
  & node $scriptJs
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
