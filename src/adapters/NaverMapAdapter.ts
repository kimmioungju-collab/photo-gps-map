import type { PhotoMeta } from '../types/photo';
import type { MapAdapter } from './MapAdapter';

declare global {
  interface Window { naver: any; }
}

let sdkPromise: Promise<void> | null = null;
function loadNaverSdk(clientId: string): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.naver && window.naver.maps) { resolve(); return; }
    const s = document.createElement('script');
    s.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Naver Maps SDK 로드 실패'));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

/** Stub implementation for future extension. Interface-compatible with KakaoMapAdapter. */
export class NaverMapAdapter implements MapAdapter {
  private map: any = null;
  private markers: any[] = [];

  constructor(private readonly clientId: string) {}

  async mount(container: HTMLElement): Promise<void> {
    await loadNaverSdk(this.clientId);
    const { naver } = window;
    this.map = new naver.maps.Map(container, {
      center: new naver.maps.LatLng(37.5665, 126.9780),
      zoom: 13,
    });
  }

  setMarkers(photos: PhotoMeta[], onClick: (p: PhotoMeta) => void): void {
    const { naver } = window;
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
    photos.filter((p) => p.hasGps).forEach((p) => {
      const m = new naver.maps.Marker({
        position: new naver.maps.LatLng(p.lat!, p.lng!),
        map: this.map,
        icon: {
          content: `<div class="num-marker">${p.index ?? '?'}</div>`,
          anchor: new naver.maps.Point(16, 16),
        },
      });
      naver.maps.Event.addListener(m, 'click', () => onClick(p));
      this.markers.push(m);
    });
  }

  fitBounds(photos: PhotoMeta[]): void {
    const { naver } = window;
    const gps = photos.filter((p) => p.hasGps);
    if (gps.length === 0 || !this.map) return;
    const bounds = new naver.maps.LatLngBounds();
    gps.forEach((p) => bounds.extend(new naver.maps.LatLng(p.lat!, p.lng!)));
    this.map.fitBounds(bounds);
  }

  destroy(): void {
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
    this.map = null;
  }
}
