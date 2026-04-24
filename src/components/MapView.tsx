import { useEffect, useRef, useState } from 'react';
import { usePhotoStore } from '../store/photoStore';
import { KakaoMapAdapter } from '../adapters/KakaoMapAdapter';
import { NaverMapAdapter } from '../adapters/NaverMapAdapter';
import type { MapAdapter } from '../adapters/MapAdapter';
import type { MapProviderId } from '../types/photo';
import { formatDistance, formatDuration } from '../utils/routing';

const DEFAULT_PROVIDER =
  (import.meta.env.VITE_MAP_PROVIDER as MapProviderId) || 'kakao';

const LS_KAKAO = 'photogps.kakaoKey';
const LS_NAVER = 'photogps.naverClientId';

function getKakaoKey(): string {
  return localStorage.getItem(LS_KAKAO) || (import.meta.env.VITE_KAKAO_MAP_KEY as string) || '';
}
function getNaverId(): string {
  return localStorage.getItem(LS_NAVER) || (import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string) || '';
}

function createAdapter(provider: MapProviderId): MapAdapter {
  if (provider === 'naver') return new NaverMapAdapter(getNaverId());
  return new KakaoMapAdapter(getKakaoKey());
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<MapAdapter | null>(null);
  const [provider, setProvider] = useState<MapProviderId>(DEFAULT_PROVIDER);
  const [error, setError] = useState<string | null>(null);
  const [needKey, setNeedKey] = useState<boolean>(() => !getKakaoKey() && DEFAULT_PROVIDER === 'kakao');
  const [keyInput, setKeyInput] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const { photos, route, routeLoading, selectedId, focusTick } = usePhotoStore();

  // mount / switch provider
  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (!containerRef.current) return;
    const key = provider === 'kakao' ? getKakaoKey() : getNaverId();
    if (!key) { setNeedKey(true); return; }
    setNeedKey(false);

    adapterRef.current?.destroy();
    const adapter = createAdapter(provider);
    adapterRef.current = adapter;

    adapter.mount(containerRef.current).then(() => {
      if (cancelled) return;
      adapter.setMarkers(photos, (p) => {
        // Clicking a map marker also centers on it
        usePhotoStore.getState().focusOnSelected(p.id);
      });
      if (route?.path) adapter.setRoute(route.path);
      adapter.fitBounds(photos);
    }).catch((e) => !cancelled && setError(e.message));

    return () => { cancelled = true; adapter.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, reloadTick]);

  // Update markers when photos change (but keep current map center, don't fit)
  useEffect(() => {
    const a = adapterRef.current;
    if (!a) return;
    a.setMarkers(photos, (p) => usePhotoStore.getState().focusOnSelected(p.id));
    // Only auto-fit when no photo is focused (i.e. initial load or full reset)
    if (!selectedId) a.fitBounds(photos);
  }, [photos, selectedId]);

  // Update route polyline when route changes
  useEffect(() => {
    const a = adapterRef.current;
    if (!a) return;
    a.setRoute(route?.path ?? []);
  }, [route]);

  // Pan to selected photo when focus is requested (focusTick bumps on every click,
  // even when selecting the same id again)
  useEffect(() => {
    if (focusTick === 0) return;
    const a = adapterRef.current;
    if (!a || !selectedId) return;
    const p = photos.find((ph) => ph.id === selectedId);
    if (p?.hasGps) {
      console.log('[focus] centering on', p.name, p.lat, p.lng);
      a.centerOn(p.lat!, p.lng!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);

  const saveKey = () => {
    const v = keyInput.trim();
    if (!v) return;
    localStorage.setItem(provider === 'kakao' ? LS_KAKAO : LS_NAVER, v);
    setKeyInput('');
    setReloadTick((t) => t + 1);
  };
  const resetKey = () => {
    localStorage.removeItem(provider === 'kakao' ? LS_KAKAO : LS_NAVER);
    setNeedKey(true);
    setError(null);
  };

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute top-2 right-2 z-10 bg-white/95 rounded shadow px-2 py-1 text-sm flex items-center gap-2">
        <label className="text-slate-600">지도:</label>
        <select value={provider} onChange={(e) => setProvider(e.target.value as MapProviderId)} className="outline-none">
          <option value="kakao">카카오</option>
          <option value="naver">네이버</option>
        </select>
        <button onClick={resetKey} className="text-xs text-slate-500 underline">키 변경</button>
      </div>

      {/* Route info panel */}
      {(route || routeLoading) && (
        <div className="absolute top-2 left-2 z-10 bg-white/95 rounded shadow px-3 py-2 text-sm">
          {routeLoading ? (
            <span className="text-slate-600">🚗 경로 계산 중…</span>
          ) : route && route.path.length > 1 ? (
            <div>
              <div className="font-semibold text-slate-800">
                🚗 {route.provider === 'osrm' ? '실제 주행경로' : '직선 거리'}
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                거리: <b>{formatDistance(route.distanceM)}</b>
                {route.durationS > 0 && <> · 예상: <b>{formatDuration(route.durationS)}</b></>}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {(needKey || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/95 p-6 z-20">
          <div className="max-w-sm w-full space-y-3 text-center">
            <p className="text-sm text-slate-700 font-semibold">
              {provider === 'kakao' ? '카카오 JavaScript 키' : '네이버 NCP Client ID'}를 입력하세요
            </p>
            {error && <p className="text-xs text-red-600 break-all">{error}</p>}
            <input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              placeholder="여기에 붙여넣기"
              className="w-full px-3 py-2 border border-slate-300 rounded outline-none focus:border-blue-500"
            />
            <button onClick={saveKey} className="w-full px-4 py-2 bg-blue-600 text-white rounded font-medium">
              저장 후 지도 로드
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
