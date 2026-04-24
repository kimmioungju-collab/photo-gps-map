export interface PhotoMeta {
  id: string;
  file: File;
  name: string;
  previewUrl: string;      // object URL for thumbnail
  takenAt: Date | null;    // EXIF DateTimeOriginal
  lat: number | null;
  lng: number | null;
  altitude: number | null;
  hasGps: boolean;
  index?: number;          // 1-based order on map (only for GPS photos)
  uploadOrder: number;     // fallback when takenAt missing
}

export interface LatLng {
  lat: number;
  lng: number;
}

export type MapProviderId = 'kakao' | 'naver';
