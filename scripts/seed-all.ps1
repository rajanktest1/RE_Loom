# =============================================================================
# Seed All Services (PowerShell)
# Seeds all databases with test data.
# Prerequisites: Docker containers running (MongoDB, Redis, RabbitMQ)
# Usage: .\seed-all.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "=== Seeding All Services ===" -ForegroundColor Cyan
Write-Host ""

$Services = @(
    @{ Name = "auth-service"; Path = "services/auth-service" },
    @{ Name = "inventory-service"; Path = "services/inventory-service" },
    @{ Name = "supply-chain-service"; Path = "services/supply-chain-service" },
    @{ Name = "crm-service"; Path = "services/crm-service" }
)

# Build packages first
Write-Host "Building packages..." -ForegroundColor Yellow
npx turbo build --filter='./packages/*'
if ($LASTEXITCODE -ne 0) { throw "Failed to build packages" }

foreach ($Service in $Services) {
    Write-Host ""
    Write-Host "Seeding $($Service.Name)..." -ForegroundColor Yellow

    # Build the service
    npx turbo build --filter="@realestate/$($Service.Name)"
    if ($LASTEXITCODE -ne 0) { throw "Failed to build $($Service.Name)" }

    # Run seed
    Push-Location $Service.Path
    try {
        npx ts-node src/seed.ts
        if ($LASTEXITCODE -ne 0) { throw "Failed to seed $($Service.Name)" }
        Write-Host "  $($Service.Name) seeded successfully" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "=== All Services Seeded ===" -ForegroundColor Green
Write-Host ""
