# Mapeta — Cloudflare Pages Deployment Script
param(
    [string]$ApiUrl = ""
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Mapeta — Cloudflare Pages Deployer   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

if ($ApiUrl) {
    Write-Host "[Deploy] Building frontend with VITE_API_URL=$ApiUrl" -ForegroundColor Yellow
    $env:VITE_API_URL = $ApiUrl
} else {
    Write-Host "[Deploy] Building frontend (default same-origin / relative API)..." -ForegroundColor Yellow
}

npm run client:build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[Deploy] Client build failed! Aborting." -ForegroundColor Red
    exit 1
}

Write-Host "[Deploy] Deploying dist/ to Cloudflare Pages (project: mapeta)..." -ForegroundColor Green
npx wrangler pages deploy dist --project-name mapeta

if ($LASTEXITCODE -eq 0) {
    Write-Host "[Deploy] Successfully deployed to Cloudflare Pages!" -ForegroundColor Green
} else {
    Write-Host "[Deploy] Wrangler deploy exited with code $LASTEXITCODE" -ForegroundColor Yellow
}
