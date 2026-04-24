import { useEffect, useRef, useState } from 'react';
import { usePhotoStore } from '../store/photoStore';
import { KakaoMapAdapter } from '../adapters/KakaoMapAdapter';
import { NaverMapAdapter } from '../adapters/NaverMapAdapter';
import type { MapAdapter } from '../adapters/MapAdapter';
import type { MapProviderId } from '../types/photo';

const DEFAULT_PROVIDER =
  (import.meta.env.VITE_MAP_PROVIDER as MapProviderId) || 'kakao';

const LS_KAKAO = 'photogps.kakaoKey';
const LS_NAVER = 'photogps.naverClientId';

function getKakaoKey(): string {
  return (
    localStorage.getItem(LS_KAKAO) ||
    (import.meta.env.VITE_KAKAO_MAP_KEY as string) ||
    ''
  );
}
function getNaverId(): string {
  return (
    localStorage.getItem(LS_NAVER) ||
    (import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string) ||
    ''
  );
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

  const { photos, select } = usePhotoStore();

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

    adapter
      .mount(containerRef.current)
      .then(() => {
        if (cancelled) return;
        adapter.setMarkers(photos, (p) => select(p.id));
        adapter.fitBounds(photos);
      })
      .catch((e) => !cancelled && setError(e.message));

    return () => { cancelled = true; adapter.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, reloadTick]);

  useEffect(() => {
    const a = adapterRef.current;
    if (!a) return;
    a.setMarkers(photos, (p) => select(p.id));
    a.fitBounds(photos);
  }, [photos, select]);

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
            <p className="text-[11px] text-slate-500 leading-snug">
              키는 브라우저(localStorage)에만 저장됩니다.<br/>
              카카오 개발자 콘솔 → 앱 → 플랫폼 → Web 에<br/>
              <span className="font-mono">이 사이트의 도메인</span> 등록이 필요합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
