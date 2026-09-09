/**
 * Offline map tile service.
 */
import fs from 'fs';
import path from 'path';

const OFFLINE_MAP_DIR = path.join(process.cwd(), 'server', 'data');
const MALAYSIA_PMTILES_PATH = path.join(OFFLINE_MAP_DIR, 'malaysia.pmtiles');

/**
 * Checks the status of the offline map file.
 * @returns Object containing the status of the offline map.
 */
export function getOfflineStatus(): { hasOfflineMap: boolean; filename?: string; sizeBytes?: number; sizeMB?: string; message?: string } {
  if (fs.existsSync(MALAYSIA_PMTILES_PATH)) {
    const stats = fs.statSync(MALAYSIA_PMTILES_PATH);
    return {
      hasOfflineMap: true,
      filename: 'malaysia.pmtiles',
      sizeBytes: stats.size,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
    };
  }
  return {
    hasOfflineMap: false,
    message: 'Offline map file not found.'
  };
}

/**
 * Streams the offline map tiles file, supporting range requests.
 * @param rangeHeader - The HTTP Range header if present.
 * @returns Object containing status code, headers, and the read stream, or null if file not found.
 */
export function streamTiles(rangeHeader: string | undefined): { statusCode: number; headers: Record<string, string | number>; stream: fs.ReadStream } | null {
  if (!fs.existsSync(MALAYSIA_PMTILES_PATH)) {
    return null;
  }

  const stats = fs.statSync(MALAYSIA_PMTILES_PATH);
  const fileSize = stats.size;

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      const stream = fs.createReadStream(MALAYSIA_PMTILES_PATH);
      return {
        statusCode: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`
        },
        stream
      };
    }

    const chunksize = (end - start) + 1;
    const stream = fs.createReadStream(MALAYSIA_PMTILES_PATH, { start, end });
    
    return {
      statusCode: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/octet-stream'
      },
      stream
    };
  } else {
    const stream = fs.createReadStream(MALAYSIA_PMTILES_PATH);
    return {
      statusCode: 200,
      headers: {
        'Content-Length': fileSize,
        'Content-Type': 'application/octet-stream'
      },
      stream
    };
  }
}
