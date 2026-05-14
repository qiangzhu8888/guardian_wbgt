# Dot-source helpers for npm on Windows (EPERM on unlink of native addons in node_modules).
# English messages only.

function Test-LikelyNpmEpremFileLock {
  param([long] $ExitCode)
  return ($ExitCode -eq -4048) -or ($ExitCode -eq 4294963248)
}

function Remove-TreeIfPresent {
  param(
    [Parameter(Mandatory)][string] $LogPrefix,
    [Parameter(Mandatory)][string] $AbsolutePath,
    [Parameter(Mandatory)][string] $Description
  )
  if (-not (Test-Path -LiteralPath $AbsolutePath)) {
    Write-Host "$LogPrefix skip $Description (missing): $AbsolutePath" -ForegroundColor DarkGray
    return
  }
  Write-Host "$LogPrefix removing $Description" -ForegroundColor Cyan
  Remove-Item -LiteralPath $AbsolutePath -Recurse -Force -ErrorAction Stop
}

function Write-NpmFileLockHintIfNeeded {
  param(
    [string] $WorkingDirectory,
    [long] $ExitCode
  )
  if (-not (Test-LikelyNpmEpremFileLock -ExitCode $ExitCode)) {
    return
  }
  $wd = Resolve-Path $WorkingDirectory -ErrorAction SilentlyContinue
  $pathShow = if ($wd) { $wd.Path } else { $WorkingDirectory }
  Write-Host ''
  Write-Host 'hint: npm hit EPERM (file in use while replacing node_modules). Typical fixes:' -ForegroundColor Yellow
  Write-Host '  - Stop Vite dev servers, test runners, and other terminals locking tools in:' -ForegroundColor Yellow
  Write-Host ('    "{0}"' -f $pathShow) -ForegroundColor DarkGray
  Write-Host '    (rollup.exe, esbuild.exe, or rollup/esbuild *.node).' -ForegroundColor DarkGray
  Write-Host '  - Close antivirus real-time scan for the repo folder, then retry.' -ForegroundColor Yellow
  Write-Host '  - Retry after a clean frontend install:' -ForegroundColor Yellow
  Write-Host '      .\scripts\deploy-production.ps1 -FreshFrontend -UseInstall' -ForegroundColor DarkGray
  Write-Host '      .\scripts\run-acceptance-tests.ps1 -FreshFrontend -UseInstall' -ForegroundColor DarkGray
  Write-Host '  - On Windows EPERM retry may delete node_modules and re-run npm ci; if deletion fails too, npm install is tried once instead.' -ForegroundColor Yellow
}

function Invoke-RobustNpm {
  param(
    [Parameter(Mandatory)][string] $LogPrefix,
    [Parameter(Mandatory)][string] $Label,
    [Parameter(Mandatory)][string] $WorkingDirectory,
    [Parameter(Mandatory)][string[]] $NpmArguments,
    [switch] $RecoverOnceIfEperm
  )
  $isWin = $env:OS -eq 'Windows_NT'
  $maxAttempts = 1
  if ($RecoverOnceIfEperm -and $isWin) {
    $maxAttempts = 2
  }

  Push-Location $WorkingDirectory
  try {
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
      if ($attempt -gt 1) {
        Write-Host "$LogPrefix $Label (retry $attempt/$maxAttempts after removing node_modules)" -ForegroundColor Cyan
      } else {
        Write-Host "$LogPrefix $Label" -ForegroundColor Cyan
      }
      & npm @NpmArguments
      $code = [long]$LASTEXITCODE
      if ($LASTEXITCODE -eq 0) {
        return
      }

      $canRecover = (
        $RecoverOnceIfEperm -and
        $isWin -and
        $attempt -lt $maxAttempts -and
        (Test-LikelyNpmEpremFileLock -ExitCode $code)
      )
      if ($canRecover) {
        Write-Host "$LogPrefix npm EPERM: removing node_modules in this workspace and retrying once" -ForegroundColor Yellow
        $nm = Join-Path $PWD.Path 'node_modules'
        try {
          Remove-TreeIfPresent $LogPrefix $nm 'locked npm workspace: node_modules'
        }
        catch {
          # npm ci が esbuild.exe などをロックしているとフォルダごと削除できない。削除なしで npm install ならよく完了する。
          $usedCi = $NpmArguments -contains 'ci'
          if (-not $usedCi) {
            throw "cannot remove $($nm): stop Vite npm rollup locks: $($_.Exception.Message)"
          }
          Write-Host "$LogPrefix cannot remove $($nm): $($_.Exception.Message)" -ForegroundColor Yellow
          Write-Host "$LogPrefix fallback once: npm install (in-place) instead of npm ci—stop other Vite/webpack terminals later for a clean install." -ForegroundColor Yellow
          $installArgs = @()
          foreach ($a in $NpmArguments) {
            if ($a -eq 'ci') { $installArgs += 'install' } else { $installArgs += $a }
          }
          & npm @installArgs
          if ($LASTEXITCODE -eq 0) {
            return
          }
          Write-NpmFileLockHintIfNeeded -WorkingDirectory $PWD.Path -ExitCode ([long]$LASTEXITCODE)
          throw "npm failed after EPERM fallback to install (exit $($LASTEXITCODE)): $Label"
        }
        continue
      }

      Write-NpmFileLockHintIfNeeded -WorkingDirectory $PWD.Path -ExitCode $code
      throw "npm failed (exit $($LASTEXITCODE)): $Label"
    }
  }
  finally {
    Pop-Location
  }
}
