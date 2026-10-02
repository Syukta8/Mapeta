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

export interface TileStreamResult {
  statusCode: number;
  headers: Record<string, string | number>;
  stream: fs.ReadStream | null;
}

/**
 * Returns metadata describing the locally hosted Malaysia basemap asset.
 */
export function getTileMetadata() {
  const status = getOfflineStatus();
  return {
    coverage: 'Malaysia (Peninsular, Sabah, Sarawak)',
    bounds: [99.5, 0.8, 119.5, 7.5],
    format: 'pmtiles',
    minZoom: 0,
    maxZoom: 16,
    attribution: '© OpenStreetMap contributors',
    ...status,
  };
}

/**
 * Returns headers for a HEAD request against the offline map tile archive.
 */
export function headTiles(): { statusCode: number; headers: Record<string, string | number> } | null {
  if (!fs.existsSync(MALAYSIA_PMTILES_PATH)) {
    return null;
  }
  const stats = fs.statSync(MALAYSIA_PMTILES_PATH);
  return {
    statusCode: 200,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': stats.size,
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  };
}

/**
 * Streams the offline map tiles file, supporting RFC-compliant HTTP Range requests (including suffix & open-ended ranges).
 * @param rangeHeader - The HTTP Range header if present.
 * @returns Object containing status code, headers, and the read stream, or null if file not found.
 */
export function streamTiles(rangeHeader: string | undefined): TileStreamResult | null {
  if (!fs.existsSync(MALAYSIA_PMTILES_PATH)) {
    return null;
  }

  const stats = fs.statSync(MALAYSIA_PMTILES_PATH);
  const fileSize = stats.size;

  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const rawRange = rangeHeader.replace('bytes=', '').trim();
    const parts = rawRange.split('-');

    let start = 0;
    let end = fileSize - 1;

    if (parts[0] === '' && parts[1]) {
      // Suffix range: bytes=-N (last N bytes)
      const suffixLength = parseInt(parts[1], 10);
      if (isNaN(suffixLength) || suffixLength <= 0) {
        return {
          statusCode: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
          stream: null,
        };
      }
      start = Math.max(0, fileSize - suffixLength);
      end = fileSize - 1;
    } else {
      start = parseInt(parts[0], 10);
      end = parts[1] !== '' && parts[1] !== undefined ? parseInt(parts[1], 10) : fileSize - 1;
    }

    if (isNaN(start) || isNaN(end) || start < 0 || start >= fileSize || start > end) {
      return {
        statusCode: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`,
          'Accept-Ranges': 'bytes',
        },
        stream: null,
      };
    }

    // Clamp end to file bounds
    end = Math.min(end, fileSize - 1);
    const chunksize = end - start + 1;
    const stream = fs.createReadStream(MALAYSIA_PMTILES_PATH, { start, end });

    return {
      statusCode: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
      stream,
    };
  }

  // Full file stream
  const stream = fs.createReadStream(MALAYSIA_PMTILES_PATH);
  return {
    statusCode: 200,
    headers: {
      'Accept-Ranges': 'bytes',
      'Content-Length': fileSize,
      'Content-Type': 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400, immutable',
    },
    stream,
  };
}

