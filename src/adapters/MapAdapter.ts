import type { PhotoMeta } from '../types/photo';

export interface MapAdapter {
  /** Mount the map inside the given container element. */
  mount(container: HTMLElement): Promise<void>;
  /** Replace all markers with photos that have GPS. */
  setMarkers(photos: PhotoMeta[], onClick: (p: PhotoMeta) => void): void;
  /** Fit viewport to include all markers. */
  fitBounds(photos: PhotoMeta[]): void;
  /** Tear down listeners / script state. */
  destroy(): void;
}
