# Mapeta — Android Build Environment Setup
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Mapeta — Android Build Environment   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Check / Install JDK 17
$jdk17Installed = $false
$currentJava = java -version 2>&1 | Out-String
if ($currentJava -match '17\.') {
    Write-Host "[JDK] Java 17 already detected on PATH." -ForegroundColor Green
    $jdk17Installed = $true
} else {
    Write-Host "[JDK] Checking for Eclipse Adoptium Temurin 17..." -ForegroundColor Yellow
    $temurinDir = "C:\Program Files\Eclipse Adoptium"
    if (Test-Path $temurinDir) {
        $jdk17 = Get-ChildItem $temurinDir -Directory | Where-Object { $_.Name -like "*jdk-17*" } | Select-Object -First 1
        if ($jdk17) {
            $jdkPath = $jdk17.FullName
            Write-Host "[JDK] Found JDK 17 at: $jdkPath" -ForegroundColor Green
            $env:JAVA_HOME = $jdkPath
            $env:Path = "$jdkPath\bin;$env:Path"
            $jdk17Installed = $true
        }
    }

    if (-not $jdk17Installed) {
        Write-Host "[JDK] Installing Eclipse Adoptium Temurin 17 JDK via winget..." -ForegroundColor Cyan
        winget install --id EclipseAdoptium.Temurin.17.JDK -e --silent --accept-package-agreements --accept-source-agreements
        $jdk17 = Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory | Where-Object { $_.Name -like "*jdk-17*" } | Select-Object -First 1
        if ($jdk17) {
            $jdkPath = $jdk17.FullName
            [Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkPath, "User")
            $env:JAVA_HOME = $jdkPath
            $env:Path = "$jdkPath\bin;$env:Path"
            Write-Host "[JDK] Configured JAVA_HOME to: $jdkPath" -ForegroundColor Green
        }
    }
}

# 2. Check / Install Android SDK & Command-line Tools
$sdkDir = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $sdkDir)) {
    Write-Host "[Android SDK] SDK directory not found at $sdkDir. Installing Android Studio..." -ForegroundColor Yellow
    winget install --id Google.AndroidStudio -e --silent --accept-package-agreements --accept-source-agreements
}

# 3. Configure local.properties for Gradle
$escapedSdk = $sdkDir -replace '\\', '/'
$localProp = "C:\Users\PC\Mapeta\android\local.properties"
if (Test-Path "C:\Users\PC\Mapeta\android") {
    "sdk.dir=$escapedSdk" | Out-File -FilePath $localProp -Encoding ascii
    Write-Host "[Gradle] Written android/local.properties with sdk.dir=$escapedSdk" -ForegroundColor Green
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Setup complete! Ready to build APK   " -ForegroundColor Cyan
Write-Host "   Run: npm run build:apk               " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
