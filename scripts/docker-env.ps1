# =============================================================================
# Docker Environment Management (PowerShell)
# Start/stop local Docker containers for development.
# Usage: .\docker-env.ps1 -Action up|down|status
# =============================================================================

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("up", "down", "status")]
    [string]$Action
)

$ErrorActionPreference = "Stop"
$ComposeFile = Join-Path $PSScriptRoot ".." "docker" "docker-compose.dev.yml"

switch ($Action) {
    "up" {
        Write-Host "Starting Docker containers..." -ForegroundColor Cyan
        docker compose -f $ComposeFile up -d
        if ($LASTEXITCODE -ne 0) { throw "Failed to start containers" }

        Write-Host ""
        Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5

        Write-Host ""
        Write-Host "=== Services Running ===" -ForegroundColor Green
        docker compose -f $ComposeFile ps
    }
    "down" {
        Write-Host "Stopping Docker containers..." -ForegroundColor Cyan
        docker compose -f $ComposeFile down
        if ($LASTEXITCODE -ne 0) { throw "Failed to stop containers" }
        Write-Host "Containers stopped." -ForegroundColor Green
    }
    "status" {
        Write-Host "=== Container Status ===" -ForegroundColor Cyan
        docker compose -f $ComposeFile ps
    }
}
