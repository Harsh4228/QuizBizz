# db-setup.ps1
# Run this script once to create and seed the database.
# Requires: dotnet-ef installed globally + PostgreSQL accessible.

param(
    [string]$Password        = "[YOUR-PASSWORD]",   # <-- replace or pass -Password yourpass
    [string]$ConnectionString = "",
    [switch]$SeedOnly
)

if (-not $ConnectionString) {
    $ConnectionString = "Host=db.pxpfcutxnentcxpnonch.supabase.co;Port=5432;Database=postgres;Username=postgres;Password=$Password;SSL Mode=Require;Trust Server Certificate=true"
}

$apiDir = "$PSScriptRoot\backend\QuizAPI"
$sqlFile = "$PSScriptRoot\database\init.sql"

Write-Host ""
Write-Host "=== Quiz App — Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# ── Option A: Raw SQL (no EF migrations needed) ───────────────────────────────
# Apply the hand-written SQL schema directly via psql.
# This matches every table, constraint, and index defined in database/init.sql.
Write-Host "Option A — Applying SQL schema via psql..." -ForegroundColor Yellow

$env:PGPASSWORD = "postgres"
psql -h localhost -U postgres -d quizdb -f $sqlFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Schema applied successfully!" -ForegroundColor Green
} else {
    Write-Host "  psql not found or failed. Trying EF Core migrations instead..." -ForegroundColor Yellow

    # ── Option B: EF Core Migrations ─────────────────────────────────────────
    # Use this if you prefer managing the schema through EF Core.
    Write-Host ""
    Write-Host "Option B — EF Core migrations..." -ForegroundColor Yellow
    Push-Location $apiDir

    # Install dotnet-ef if not present
    $efTool = dotnet tool list -g | Select-String "dotnet-ef"
    if (-not $efTool) {
        Write-Host "  Installing dotnet-ef..." -ForegroundColor Gray
        dotnet tool install --global dotnet-ef
    }

    dotnet ef migrations add InitialCreate `
        --connection $ConnectionString 2>$null

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Migration already exists or already up-to-date. Updating..." -ForegroundColor Gray
    }

    dotnet ef database update --connection $ConnectionString

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  EF Core migration applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "  Migration failed. Check your connection string." -ForegroundColor Red
    }

    Pop-Location
}

Write-Host ""
Write-Host "Done! Start the API with:  cd backend\QuizAPI && dotnet run" -ForegroundColor Cyan
Write-Host ""
