import type { LatLng, PhotoMeta } from '../types/photo';
import type { MapAdapter } from './MapAdapter';

declare global {
  interface Window { kakao: any; }
}

let sdkPromise: Promise<void> | null = null;

function loadKakaoSdk(appKey: string): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) { resolve(); return; }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error('Kakao Maps SDK 로드 실패 — API 키/도메인 등록을 확인하세요.'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export class KakaoMapAdapter implements MapAdapter {
  private map: any = null;
  private overlays: any[] = [];
  private polyline: any = null;

  constructor(private readonly appKey: string) {}

  async mount(container: HTMLElement): Promise<void> {
    if (!this.appKey) throw new Error('VITE_KAKAO_MAP_KEY가 비어 있습니다.');
    await loadKakaoSdk(this.appKey);
    const { kakao } = window;
    this.map = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 5,
    });
  }

  setMarkers(photos: PhotoMeta[], onClick: (p: PhotoMeta) => void): void {
    const { kakao } = window;
    this.clearOverlays();
    if (!this.map) return;

    const gpsPhotos = photos.filter((p) => p.hasGps);
    gpsPhotos.forEach((p) => {
      const pos = new kakao.maps.LatLng(p.lat!, p.lng!);
      const wrap = document.createElement('div');
      wrap.className = 'photo-marker';
      wrap.innerHTML = `
        <span class="badge">${p.index ?? '?'}</span>
        <img src="${p.previewUrl}" alt="" />
      `;
      wrap.addEventListener('click', (e) => { e.stopPropagation(); onClick(p); });

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: wrap,
        xAnchor: 0,
        yAnchor: 0,
        clickable: true,
      });
      overlay.setMap(this.map);
      this.overlays.push(overlay);
    });
  }

  setRoute(path: LatLng[]): void {
    const { kakao } = window;
    this.clearRoute();
    if (!this.map || path.length < 2) return;

    const points = path.map((p) => new kakao.maps.LatLng(p.lat, p.lng));
    this.polyline = new kakao.maps.Polyline({
      path: points,
      strokeWeight: 5,
      strokeColor: '#2563eb',
      strokeOpacity: 0.9,
      strokeStyle: 'solid',
    });
    this.polyline.setMap(this.map);
  }

  fitBounds(photos: PhotoMeta[]): void {
    const { kakao } = window;
    if (!this.map) return;
    const gps = photos.filter((p) => p.hasGps);
    if (gps.length === 0) return;
    if (gps.length === 1) {
      this.map.setCenter(new kakao.maps.LatLng(gps[0].lat!, gps[0].lng!));
      this.map.setLevel(4);
      return;
    }
    const bounds = new kakao.maps.LatLngBounds();
    gps.forEach((p) => bounds.extend(new kakao.maps.LatLng(p.lat!, p.lng!)));
    this.map.setBounds(bounds, 60, 60, 60, 60);
  }

  centerOn(lat: number, lng: number, zoomLevel = 3): void {
    const { kakao } = window;
    if (!this.map) return;
    const pos = new kakao.maps.LatLng(lat, lng);
    this.map.setLevel(zoomLevel, { animate: true });
    this.map.panTo(pos);
  }

  destroy(): void {
    this.clearOverlays();
    this.clearRoute();
    this.map = null;
  }

  private clearOverlays() {
    this.overlays.forEach((o) => o.setMap(null));
    this.overlays = [];
  }
  private clearRoute() {
    if (this.polyline) { this.polyline.setMap(null); this.polyline = null; }
  }
}
