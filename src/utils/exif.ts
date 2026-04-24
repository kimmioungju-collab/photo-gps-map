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

  try {
    const data = await exifr.parse(file, {
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate',
             'GPSLatitude', 'GPSLongitude', 'GPSAltitude',
             'latitude', 'longitude'],
    });
    if (data) {
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        lat = data.latitude;
        lng = data.longitude;
      }
      if (typeof data.GPSAltitude === 'number') altitude = data.GPSAltitude;
      const dt = data.DateTimeOriginal || data.CreateDate || data.ModifyDate;
      if (dt instanceof Date && !isNaN(dt.getTime())) takenAt = dt;
    }
  } catch (err) {
    // swallow — some files (HEIC in Safari, stripped EXIF, etc.) may fail
    console.warn('[exif] parse failed for', file.name, err);
  }

  const hasGps =
    lat !== null && lng !== null &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    !(lat === 0 && lng === 0);

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
