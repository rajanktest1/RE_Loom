# =============================================================================
# Build Docker Images Locally (PowerShell)
# Builds all service images for local testing before pushing.
# Usage: .\build-images.ps1 [-Tag "latest"] [-Service "gateway"]
# =============================================================================

param(
    [string]$Tag = "local",
    [string]$Service = ""
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$Services = @(
    @{ Name = "gateway"; Port = 4000; Dockerfile = "docker/Dockerfile.service" },
    @{ Name = "auth-service"; Port = 4001; Dockerfile = "docker/Dockerfile.service" },
    @{ Name = "inventory-service"; Port = 4002; Dockerfile = "docker/Dockerfile.service" },
    @{ Name = "supply-chain-service"; Port = 4003; Dockerfile = "docker/Dockerfile.service" },
    @{ Name = "crm-service"; Port = 4004; Dockerfile = "docker/Dockerfile.service" },
    @{ Name = "notification-service"; Port = 4005; Dockerfile = "docker/Dockerfile.service" },
    @{ Name = "document-service"; Port = 4006; Dockerfile = "docker/Dockerfile.service" },
    @{ Name = "web"; Port = 80; Dockerfile = "docker/Dockerfile.web" }
)

# Filter to single service if specified
if ($Service) {
    $Services = $Services | Where-Object { $_.Name -eq $Service }
    if ($Services.Count -eq 0) {
        throw "Service '$Service' not found. Valid: gateway, auth-service, inventory-service, supply-chain-service, crm-service, notification-service, document-service, web"
    }
}

Write-Host "=== Building Docker Images ===" -ForegroundColor Cyan
Write-Host "Tag: $Tag"
Write-Host "Context: $RepoRoot"
Write-Host ""

foreach ($Svc in $Services) {
    $ImageName = "realestate/$($Svc.Name):$Tag"
    Write-Host "Building $ImageName..." -ForegroundColor Yellow

    $BuildArgs = @(
        "build",
        "-f", (Join-Path $RepoRoot $Svc.Dockerfile),
        "--build-arg", "SERVICE_NAME=$($Svc.Name)",
        "--build-arg", "SERVICE_PORT=$($Svc.Port)",
        "-t", $ImageName,
        $RepoRoot
    )

    docker @BuildArgs
    if ($LASTEXITCODE -ne 0) { throw "Failed to build $($Svc.Name)" }
    Write-Host "  Built: $ImageName" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== All Images Built ===" -ForegroundColor Green
Write-Host ""
Write-Host "Run 'docker images | Select-String realestate' to see images"
