# Helper script to launch FigCraft with live control port 7979 on Windows
param (
    [string]$File = "blc_procurement_design_system.figcraft",
    [int]$Port = 7979
)

$figcraftExe = "C:\Program Files\ArtCraft\FigCraft\figcraft.exe"
if (-not (Test-Path $figcraftExe)) {
    Write-Error "FigCraft executable not found at $figcraftExe"
    exit 1
}

$fullFilePath = (Resolve-Path $File).Path
$conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if ($conn) {
    Write-Host "FigCraft is already listening on control port $Port."
} else {
    $running = Get-Process -Name "figcraft" -ErrorAction SilentlyContinue
    if ($running) {
        Write-Warning "FigCraft is currently running without --control $Port. You may restart FigCraft or use the app directly."
    }
    Write-Host "Launching FigCraft on port $Port with document: $fullFilePath..."
    Start-Process $figcraftExe -ArgumentList @("--control", $Port, "`"$fullFilePath`"")
}
