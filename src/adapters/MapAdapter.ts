import type { LatLng, PhotoMeta } from '../types/photo';

export interface MapAdapter {
  mount(container: HTMLElement): Promise<void>;
  setMarkers(photos: PhotoMeta[], onClick: (p: PhotoMeta) => void): void;
  /** Draw a polyline along real roads (or straight lines as fallback). */
  setRoute(path: LatLng[]): void;
  fitBounds(photos: PhotoMeta[]): void;
  /** Pan/zoom to a specific point. */
  centerOn(lat: number, lng: number, zoomLevel?: number): void;
  destroy(): void;
}
