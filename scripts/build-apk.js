#!/usr/bin/env node
/**
 * Mapeta APK Builder
 * Orchestrates: web build -> capacitor sync -> gradle assembleDebug -> copy to root
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ANDROID_DIR = path.join(ROOT, 'android');
const APK_SRC = path.join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const APK_DEST = path.join(ROOT, 'mapeta-debug.apk');

console.log('\x1b[36m%s\x1b[0m', '=========================================');
console.log('\x1b[36m%s\x1b[0m', '        Mapeta — Android APK Build       ');
console.log('\x1b[36m%s\x1b[0m', '=========================================');

// 1. Build web assets
console.log('\x1b[33m%s\x1b[0m', '[1/4] Building web assets (npm run client:build)...');
execSync('npm run client:build', { stdio: 'inherit', cwd: ROOT });

// 2. Sync web assets into Android project
console.log('\x1b[33m%s\x1b[0m', '[2/4] Syncing assets to native Android project (npx cap sync android)...');
execSync('npx cap sync android', { stdio: 'inherit', cwd: ROOT });

// 3. Detect JDK 17
let javaHome = process.env.JAVA_HOME;
const possibleJdkPaths = [
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.20.101-hotspot',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.12.7-hotspot',
  'C:\\Program Files\\Android\\Android Studio\\jbr',
  'C:\\Program Files\\Java\\jdk-17',
];

if (!javaHome || !fs.existsSync(javaHome)) {
  for (const p of possibleJdkPaths) {
    if (fs.existsSync(p)) {
      javaHome = p;
      break;
    }
  }
}

const env = { ...process.env };
if (javaHome) {
  env.JAVA_HOME = javaHome;
  env.PATH = `${path.join(javaHome, 'bin')};${env.PATH}`;
  console.log('\x1b[32m%s\x1b[0m', `[Java] Using JDK at: ${javaHome}`);
}

// 4. Compile Debug APK via Gradle wrapper
console.log('\x1b[33m%s\x1b[0m', '[3/4] Compiling debug APK via Gradle wrapper...');
try {
  execSync('.\\gradlew.bat assembleDebug', { stdio: 'inherit', cwd: ANDROID_DIR, env });
} catch {
  console.error('\x1b[31m%s\x1b[0m', '\n[Notice] Gradle build requires JDK 17 and Android SDK.');
  console.error('\x1b[33m%s\x1b[0m', 'Run "powershell -ExecutionPolicy Bypass -File scripts/setup-android.ps1" once to set up the Android SDK toolchain.\n');
  process.exit(1);
}

// 5. Copy APK to project root
console.log('\x1b[33m%s\x1b[0m', '[4/4] Finalizing APK package...');
if (fs.existsSync(APK_SRC)) {
  fs.copyFileSync(APK_SRC, APK_DEST);
  const stat = fs.statSync(APK_DEST);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
  console.log('\x1b[32m%s\x1b[0m', `\n[Success] APK generated successfully: mapeta-debug.apk (${sizeMB} MB)`);
  console.log('\x1b[36m%s\x1b[0m', `Output: ${APK_DEST}`);
} else {
  console.error('\x1b[31m%s\x1b[0m', `[Error] Expected output APK not found at ${APK_SRC}`);
  process.exit(1);
}
