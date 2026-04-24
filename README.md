# PhotoGPS Map

사진 EXIF의 GPS/촬영일시를 읽어 카카오(또는 네이버) 지도에 촬영 순서대로 번호 마커를 찍는 웹앱.

## 설치 & 실행
```bash
cd /Users/kmj/projects/photo-gps-map
npm install
cp .env.example .env   # VITE_KAKAO_MAP_KEY에 카카오 JavaScript 키 입력
npm run dev            # http://localhost:5173
```

## 빌드 & 배포
```bash
npm run build          # dist/ 생성 (정적 파일)
npm run preview        # 로컬 미리보기
# 배포: Vercel / Netlify / GitHub Pages / S3+CloudFront 등에 dist/ 업로드
# 반드시 카카오 개발자 콘솔에 배포 도메인 등록 필요
```

## 주요 구조
```
src/
├─ App.tsx
├─ main.tsx
├─ index.css
├─ types/photo.ts
├─ utils/exif.ts               # exifr 기반 GPS/촬영일시 추출 + 정렬
├─ store/photoStore.ts         # zustand 상태
├─ adapters/
│  ├─ MapAdapter.ts            # 공용 인터페이스
│  ├─ KakaoMapAdapter.ts       # MVP
│  └─ NaverMapAdapter.ts       # 확장용
└─ components/
   ├─ PhotoUploader.tsx
   ├─ MapView.tsx
   ├─ PhotoList.tsx
   └─ PhotoInfoPanel.tsx
```

## 추후 개선(백엔드)
- `POST /projects`, `POST /projects/:id/photos`, `GET /shares/:token`
- DB: PostgreSQL + PostGIS (GEOGRAPHY(Point))
- 인증: Google OAuth + JWT, 업로드 시 EXIF GPS를 선택적으로 제거(개인정보)
