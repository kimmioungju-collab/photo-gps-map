import type { PhotoMeta } from '../types/photo';
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
  private markers: any[] = [];
  private overlays: any[] = [];

  constructor(private readonly appKey: string) {}

  async mount(container: HTMLElement): Promise<void> {
    if (!this.appKey) throw new Error('VITE_KAKAO_MAP_KEY가 비어 있습니다.');
    await loadKakaoSdk(this.appKey);
    const { kakao } = window;
    this.map = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(37.5665, 126.9780), // Seoul City Hall
      level: 5,
    });
  }

  setMarkers(photos: PhotoMeta[], onClick: (p: PhotoMeta) => void): void {
    const { kakao } = window;
    this.clearMarkers();
    if (!this.map) return;

    photos.filter((p) => p.hasGps).forEach((p) => {
      const pos = new kakao.maps.LatLng(p.lat!, p.lng!);
      const content = document.createElement('div');
      content.className = 'num-marker';
      content.textContent = String(p.index ?? '?');

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content,
        yAnchor: 1,
        clickable: true,
      });
      overlay.setMap(this.map);
      content.addEventListener('click', () => onClick(p));
      this.overlays.push(overlay);
    });
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
    this.map.setBounds(bounds);
  }

  destroy(): void {
    this.clearMarkers();
    this.map = null;
  }

  private clearMarkers() {
    this.overlays.forEach((o) => o.setMap(null));
    this.overlays = [];
    this.markers.forEach((m) => m.setMap(null));
    this.markers = [];
  }
}
