#Requires -Version 5.1
<#
.SYNOPSIS
  Stop Vite preview/dev and other Node processes that lock frontend/node_modules on Windows.

.PARAMETER FrontendDir
  Absolute path to frontend/ (defaults to repo frontend).

.EXAMPLE
  .\scripts\stop-frontend-dev-processes.ps1
#>
param(
  [string] $FrontendDir = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

$repoRoot = Split-Path -Parent $PSScriptRoot
if (-not $FrontendDir) {
  $FrontendDir = Join-Path $repoRoot 'frontend'
}
$frontendResolved = $FrontendDir
try {
  $frontendResolved = (Resolve-Path -LiteralPath $FrontendDir).Path
} catch {
  # keep literal path
}

$LogPrefix = '[stop-frontend-dev]'
Write-Host "$LogPrefix releasing file locks under: $frontendResolved" -ForegroundColor Cyan

function Stop-ListenersOnPorts {
  param([int[]] $Ports)
  foreach ($port in $Ports) {
    try {
      $conns = @(Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
      foreach ($c in $conns) {
        $procId = [int]$c.OwningProcess
        if ($procId -le 0) { continue }
        Write-Host "$LogPrefix stop PID $procId (port $port listener)" -ForegroundColor Yellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      }
    } catch {
      Write-Host "$LogPrefix skip port scan $port : $($_.Exception.Message)" -ForegroundColor DarkGray
    }
  }
}

Stop-ListenersOnPorts -Ports @(5173, 4173)

$needles = @(
  [regex]::Escape($frontendResolved),
  'sigmaTop_WBGT\\frontend',
  'sigmaTop_WBGT/frontend',
  'vite preview',
  'vite dev',
  'vite\.js',
  'playwright',
  '@playwright/test'
)

$procNames = @('node', 'esbuild', 'rollup')
foreach ($name in $procNames) {
  $procs = @(Get-CimInstance Win32_Process -Filter "Name = '$name.exe'" -ErrorAction SilentlyContinue)
  foreach ($p in $procs) {
    $cmd = [string]$p.CommandLine
    if (-not $cmd) { continue }
    $hit = $false
    foreach ($n in $needles) {
      if ($cmd -match $n) {
        $hit = $true
        break
      }
    }
    if (-not $hit) { continue }
    Write-Host "$LogPrefix stop $($p.Name) PID $($p.ProcessId)" -ForegroundColor Yellow
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

Start-Sleep -Seconds 2
Write-Host "$LogPrefix done" -ForegroundColor Green
