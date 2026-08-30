import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Collect local IPv4 network addresses
function getLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
        results.push({ name, ip: net.address });
      }
    }
  }
  return results;
}

console.clear();
console.log('Mapeta launch\n');

// 2. Start Backend Node Server
console.log('[1/2] Starting Mapeta Backend Server (Express + SQLite + WebSockets)...');
let serverProc = null;
const pids = {};

function startBackend() {
  serverProc = spawn('node', ['dist-server/index.js'], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pids.server = serverProc.pid;
  try {
    fs.writeFileSync(path.join(rootDir, '.mapeta.pid'), JSON.stringify(pids), 'utf-8');
  } catch (e) {}

  serverProc.stdout.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('listening on')) {
      console.log('  -> Backend Server active on http://127.0.0.1:3000');
    }
  });

  serverProc.stderr.on('data', (d) => {
    console.error('  [Server STDERR]:', d.toString().trim());
  });

  serverProc.on('exit', (code) => {
    console.error(`[Server Exit] Backend exited with code ${code}. Auto-restarting in 1s...`);
    setTimeout(startBackend, 1000);
  });
}

startBackend();

// 3. Start Cloudflare Tunnel
console.log('[2/2] Generating secure remote HTTPS tunnel for 4G/5G phone access...\n');
const cloudflaredPath = path.join(rootDir, 'bin', 'cloudflared.exe');

let tunnelProc = null;
let tunnelUrl = 'Connecting...';

if (fs.existsSync(cloudflaredPath)) {
  tunnelProc = spawn(cloudflaredPath, ['tunnel', '--url', 'http://127.0.0.1:3000'], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pids.tunnel = tunnelProc.pid;

  const handleTunnelLog = (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match && tunnelUrl === 'Connecting...') {
      tunnelUrl = match[0];
      printDashboard();
    }
  };

  tunnelProc.stdout.on('data', handleTunnelLog);
  tunnelProc.stderr.on('data', handleTunnelLog);
} else {
  printDashboard();
}

fs.writeFileSync(path.join(rootDir, '.mapeta.pid'), JSON.stringify(pids), 'utf-8');

function printDashboard() {
  const ips = getLocalIPs();
  console.log('\n========================================================================');
  console.log('  ✦ MAPETA IS READY TO NAVIGATE! ✦\n');
  
  if (ips.length > 0) {
    console.log('  📱 ON SAME WIFI / PHONE HOTSPOT (Instant & Zero Lag):');
    ips.forEach((item) => {
      console.log(`     http://${item.ip}:3000   (${item.name})`);
    });
    console.log('');
  }

  if (tunnelUrl !== 'Connecting...') {
    console.log('  🚀 ON 4G/5G CELLULAR DATA ANYWHERE:');
    console.log(`     ${tunnelUrl}\n`);
  }

  console.log('  💻 LOCAL DESKTOP BROWSER:');
  console.log('     http://localhost:3000\n');
  console.log('========================================================================');
  console.log('  Keep this window open while driving.');
  console.log('  To stop: Press Ctrl+C or run stop-mapeta.cmd');
  console.log('========================================================================\n');
}

// Cleanup on exit
function shutdown() {
  console.log('\n[STOPPING] Shutting down Mapeta server...');
  try {
    if (serverProc && !serverProc.killed) serverProc.kill();
    if (tunnelProc && !tunnelProc.killed) tunnelProc.kill();
    const pidFile = path.join(rootDir, '.mapeta.pid');
    if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
