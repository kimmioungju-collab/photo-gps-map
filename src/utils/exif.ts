import exifr from 'exifr';
import type { PhotoMeta } from '../types/photo';

/** Safely extract EXIF GPS + DateTimeOriginal. Never throws. */
export async function extractPhotoMeta(
  file: File,
  uploadOrder: number
): Promise<PhotoMeta> {
  let lat: number | null = null;
  let lng: number | null = null;
  let altitude: number | null = null;
  let takenAt: Date | null = null;
  let debug = '';

  // Try the dedicated gps() helper first — most reliable for GPS across JPEG/HEIC/TIFF.
  try {
    const gps = await exifr.gps(file);
    if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
      lat = gps.latitude;
      lng = gps.longitude;
    }
  } catch (err) {
    debug += `gps() fail: ${(err as Error).message}; `;
  }

  // Then full parse for date + altitude + fallback.
  try {
    const data = await exifr.parse(file, {
      tiff: true, exif: true, gps: true, xmp: true,
      translateValues: true, reviveValues: true,
    } as any);
    if (data) {
      if (lat === null && typeof data.latitude === 'number') lat = data.latitude;
      if (lng === null && typeof data.longitude === 'number') lng = data.longitude;
      if (typeof data.GPSAltitude === 'number') altitude = data.GPSAltitude;
      const dt = data.DateTimeOriginal || data.CreateDate || data.ModifyDate || data.DateTime;
      if (dt instanceof Date && !isNaN(dt.getTime())) takenAt = dt;
      else if (typeof dt === 'string') {
        const d = new Date(dt.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
        if (!isNaN(d.getTime())) takenAt = d;
      }
      if (!takenAt) debug += 'no-date-tag; ';
      if (lat === null) debug += `no-gps-tag (keys: ${Object.keys(data).slice(0,6).join(',')}); `;
    } else {
      debug += 'parse-returned-null; ';
    }
  } catch (err) {
    debug += `parse fail: ${(err as Error).message}; `;
  }

  const hasGps =
    lat !== null && lng !== null &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    !(lat === 0 && lng === 0);

  // Fallback: try to read file lastModified for upload order tie-break
  if (!takenAt && file.lastModified) {
    const d = new Date(file.lastModified);
    // only use if it looks reasonable (not epoch)
    if (d.getFullYear() > 2000) takenAt = d;
  }

  if (debug) console.warn('[exif]', file.name, debug);

  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    previewUrl: URL.createObjectURL(file),
    takenAt,
    lat: hasGps ? lat : null,
    lng: hasGps ? lng : null,
    altitude,
    hasGps,
    uploadOrder,
    debug: debug || undefined,
  };
}

/** Sort by takenAt asc; fallback to uploadOrder. Assigns 1-based index to GPS photos. */
export function sortAndIndex(photos: PhotoMeta[]): PhotoMeta[] {
  const sorted = [...photos].sort((a, b) => {
    const at = a.takenAt ? a.takenAt.getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.takenAt ? b.takenAt.getTime() : Number.MAX_SAFE_INTEGER;
    if (at !== bt) return at - bt;
    return a.uploadOrder - b.uploadOrder;
  });

  let i = 0;
  return sorted.map((p) => (p.hasGps ? { ...p, index: ++i } : { ...p, index: undefined }));
}

export function formatDate(d: Date | null): string {
  if (!d) return '촬영일시 없음';
  return d.toLocaleString('ko-KR', { hour12: false });
}
