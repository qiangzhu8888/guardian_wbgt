# Dot-source helpers for npm on Windows (EPERM/EBUSY on unlink under node_modules).
# English messages only.

function Test-LikelyNpmEpremFileLock {
  param([long] $ExitCode)
  return ($ExitCode -eq -4048) -or ($ExitCode -eq 4294963248)
}

# Windows: EBUSY when another process holds a file under node_modules (AV sync, OneDrive, IDE, stray node).
function Test-LikelyNpmEbusyFileLock {
  param([long] $ExitCode)
  return ($ExitCode -eq -4082) -or ($ExitCode -eq 4294963214)
}

function Test-LikelyNpmWindowsFileLockRecover {
  param([long] $ExitCode)
  return (Test-LikelyNpmEpremFileLock -ExitCode $ExitCode) -or (Test-LikelyNpmEbusyFileLock -ExitCode $ExitCode)
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
  if (-not (Test-LikelyNpmWindowsFileLockRecover -ExitCode $ExitCode)) {
    return
  }
  $wd = Resolve-Path $WorkingDirectory -ErrorAction SilentlyContinue
  $pathShow = if ($wd) { $wd.Path } else { $WorkingDirectory }
  Write-Host ''
  Write-Host 'hint: npm hit EPERM/EBUSY (file in use while replacing node_modules). Typical fixes:' -ForegroundColor Yellow
  Write-Host '  - Stop Vite dev servers, test runners, and other terminals locking tools in:' -ForegroundColor Yellow
  Write-Host ('    "{0}"' -f $pathShow) -ForegroundColor DarkGray
  Write-Host '    (rollup.exe, esbuild.exe, or rollup/esbuild *.node).' -ForegroundColor DarkGray
  Write-Host '  - Close antivirus / pause OneDrive or cloud sync for the repo, then retry.' -ForegroundColor Yellow
  Write-Host '  - Retry after a clean install:' -ForegroundColor Yellow
  Write-Host '      .\scripts\deploy-production.ps1 -FreshFrontend -UseInstall' -ForegroundColor DarkGray
  Write-Host '      .\scripts\deploy-production.ps1 -FreshFunctions -UseInstall' -ForegroundColor DarkGray
  Write-Host '      .\scripts\run-acceptance-tests.ps1 -FreshFrontend -UseInstall' -ForegroundColor DarkGray
  Write-Host '  - On Windows the script may delete node_modules and retry (including npm install on the last try if npm ci was used).' -ForegroundColor Yellow
}

function Normalize-NpmCiToInstall {
  param([Parameter(Mandatory)][string[]] $NpmArguments)
  $out = [System.Collections.ArrayList]@()
  foreach ($a in $NpmArguments) {
    if ($a -eq 'ci') {
      [void]$out.Add('install')
    } else {
      [void]$out.Add($a)
    }
  }
  return ,$out.ToArray()
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
  # Windows file locks often need: clean retry, then sleep + clean retry, then npm install instead of ci.
  $maxAttempts = 1
  if ($RecoverOnceIfEperm -and $isWin) {
    $maxAttempts = 3
  }

  Push-Location $WorkingDirectory
  try {
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
      $invokeArgs = $NpmArguments
      if (
        $attempt -eq 3 -and
        $RecoverOnceIfEperm -and
        $isWin -and
        ($NpmArguments -contains 'ci')
      ) {
        $invokeArgs = Normalize-NpmCiToInstall -NpmArguments $NpmArguments
        Write-Host "$LogPrefix $Label (attempt $($attempt)/$($maxAttempts): npm install after file-lock retries)" -ForegroundColor Cyan
      } elseif ($attempt -gt 1) {
        Write-Host "$LogPrefix $Label (retry $attempt/$maxAttempts after removing node_modules)" -ForegroundColor Cyan
      } else {
        Write-Host "$LogPrefix $Label" -ForegroundColor Cyan
      }
      & npm @invokeArgs
      $code = [long]$LASTEXITCODE
      if ($LASTEXITCODE -eq 0) {
        return
      }

      $canRecover = (
        $RecoverOnceIfEperm -and
        $isWin -and
        $attempt -lt $maxAttempts -and
        (Test-LikelyNpmWindowsFileLockRecover -ExitCode $code)
      )

      if ($canRecover) {
        Write-Host "$LogPrefix npm file lock (EPERM/EBUSY): removing node_modules in this workspace" -ForegroundColor Yellow
        $nm = Join-Path $PWD.Path 'node_modules'
        $mayFallbackToInstall = $NpmArguments -contains 'ci'
        $removed = $false
        try {
          Remove-TreeIfPresent $LogPrefix $nm 'locked npm workspace: node_modules'
          $removed = $true
        } catch {
          if (-not $mayFallbackToInstall) {
            throw "cannot remove $($nm): stop Vite npm rollup locks: $($_.Exception.Message)"
          }
          Write-Host "$LogPrefix cannot remove $($nm): $($_.Exception.Message)" -ForegroundColor Yellow
          Write-Host "$LogPrefix fallback: npm install (in-place) instead of npm ci - stop other Vite/webpack terminals later for a clean install." -ForegroundColor Yellow
          $installArgs = Normalize-NpmCiToInstall -NpmArguments $NpmArguments
          & npm @installArgs
          if ($LASTEXITCODE -eq 0) {
            return
          }
          Write-NpmFileLockHintIfNeeded -WorkingDirectory $PWD.Path -ExitCode ([long]$LASTEXITCODE)
          throw "npm failed after file-lock fallback to install (exit $($LASTEXITCODE)): $Label"
        }
        if ($removed) {
          if ($attempt -ge 2) {
            Write-Host "$LogPrefix waiting 4s before next npm (release AV/file locks)" -ForegroundColor DarkGray
            Start-Sleep -Seconds 4
          }
          continue
        }
      }

      Write-NpmFileLockHintIfNeeded -WorkingDirectory $PWD.Path -ExitCode $code
      throw "npm failed (exit $($LASTEXITCODE)): $Label"
    }
  } finally {
    Pop-Location
  }
}
