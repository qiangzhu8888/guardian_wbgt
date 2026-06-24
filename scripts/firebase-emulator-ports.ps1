#Requires -Version 5.1
# Shared helpers: read firebase.json emulator ports and find listening processes.
# Dot-source from other scripts: . (Join-Path $PSScriptRoot 'firebase-emulator-ports.ps1')

Set-StrictMode -Version Latest

function Get-FirebaseEmulatorPortMap {
  param(
    [Parameter(Mandatory = $true)]
    [string] $FirebaseJsonPath
  )

  if (-not (Test-Path -LiteralPath $FirebaseJsonPath)) {
    throw "firebase.json not found: $FirebaseJsonPath"
  }

  $config = Get-Content -LiteralPath $FirebaseJsonPath -Raw | ConvertFrom-Json
  $emu = $config.emulators
  if ($null -eq $emu) {
    throw 'firebase.json has no emulators section'
  }

  return [ordered]@{
    Hub       = [int]($emu.hub.port)
    Logging   = [int]($emu.logging.port)
    Functions = [int]($emu.functions.port)
    Firestore = [int]($emu.firestore.port)
    Hosting   = [int]($emu.hosting.port)
    Ui        = [int]($emu.ui.port)
  }
}

function Get-PidsListeningOnPort {
  param(
    [Parameter(Mandatory = $true)]
    [int] $Port
  )

  $pids = @(
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  )
  return @($pids | Where-Object { $_ -gt 0 } | Select-Object -Unique)
}

function Test-FirebaseEmulatorPortsInUse {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable] $PortMap
  )

  $used = @()
  foreach ($entry in $PortMap.GetEnumerator()) {
    $pids = @(Get-PidsListeningOnPort -Port $entry.Value)
    if ($pids.Count -gt 0) {
      $used += [pscustomobject]@{
        Name = $entry.Key
        Port = $entry.Value
        Pids = @($pids)
      }
    }
  }
  return @($used)
}

function Get-FirebaseEmulatorListenerPids {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable] $PortMap
  )

  $all = @()
  foreach ($entry in $PortMap.GetEnumerator()) {
    $all += @(Get-PidsListeningOnPort -Port $entry.Value)
  }
  return @($all | Where-Object { $_ -gt 0 } | Select-Object -Unique)
}
