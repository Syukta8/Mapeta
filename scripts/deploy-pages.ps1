# Mapeta — Cloudflare Pages Deployment Script
param(
    [string]$ApiUrl = ""
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Mapeta — Cloudflare Pages Deployer   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Verify wrangler presence
if (-not (Test-Path "node_modules/wrangler/bin/wrangler.js")) {
    Write-Host "[Deploy] Error: wrangler is not installed in node_modules." -ForegroundColor Red
    Write-Host "[Deploy] Run 'npm install' to install pinned dependencies." -ForegroundColor Yellow
    exit 1
}

# 2. Build frontend if needed or requested
if ($ApiUrl) {
    Write-Host "[Deploy] Building frontend with VITE_API_URL=$ApiUrl" -ForegroundColor Yellow
    $env:VITE_API_URL = $ApiUrl
} else {
    Write-Host "[Deploy] Building frontend (default same-origin / relative API)..." -ForegroundColor Yellow
}

npm run client:build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Deploy] Client build failed! Aborting deploy." -ForegroundColor Red
    exit 1
}

# 3. Verify dist directory
if (-not (Test-Path "dist/index.html")) {
    Write-Host "[Deploy] Error: dist/index.html was not found after build. Aborting deploy." -ForegroundColor Red
    exit 1
}

Write-Host "[Deploy] Deploying dist/ to Cloudflare Pages (project: mapeta)..." -ForegroundColor Green
npx wrangler pages deploy dist --project-name mapeta

if ($LASTEXITCODE -eq 0) {
    Write-Host "[Deploy] Successfully deployed to Cloudflare Pages!" -ForegroundColor Green
} else {
    Write-Host "[Deploy] Wrangler deploy exited with code $LASTEXITCODE" -ForegroundColor Yellow
}
