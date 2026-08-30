const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'server', 'data');
const targetFile = path.join(targetDir, 'malaysia.pmtiles');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('========================================================================');
console.log('       ✦ MAPETA -- OFFLINE MALAYSIA VECTOR MAP HELPER ✦                 ');
console.log('========================================================================\n');

console.log(`Target location: ${targetFile}`);
console.log(`Note: This directory is ignored by Git (.gitignore) and will not be committed.\n`);

console.log(`[INSTRUCTIONS] To add the offline Malaysia vector map:`);
console.log(`1. Download or copy your 'malaysia.pmtiles' or 'malaysia.mbtiles' file into:`);
console.log(`   -> ${targetDir}`);
console.log(`2. Mapeta backend will automatically detect and serve it with 0 network latency!`);
