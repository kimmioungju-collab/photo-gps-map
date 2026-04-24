/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_KEY?: string;
  readonly VITE_NAVER_MAP_CLIENT_ID?: string;
  readonly VITE_MAP_PROVIDER?: 'kakao' | 'naver';
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
