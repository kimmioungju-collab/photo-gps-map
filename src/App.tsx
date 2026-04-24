import PhotoUploader from './components/PhotoUploader';
import MapView from './components/MapView';
import PhotoList from './components/PhotoList';
import PhotoInfoPanel from './components/PhotoInfoPanel';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 py-3 bg-white border-b border-slate-200">
        <h1 className="text-lg font-bold text-slate-800">📍 PhotoGPS Map</h1>
        <p className="text-xs text-slate-500">
          사진 EXIF의 GPS/촬영일시를 읽어 지도에 순서대로 표시합니다.
        </p>
      </header>

      <main className="flex-1 grid md:grid-cols-[1fr_360px] gap-3 p-3">
        <section className="flex flex-col gap-3 min-h-[420px]">
          <PhotoUploader />
          <div className="flex-1 min-h-[360px]">
            <MapView />
          </div>
        </section>
        <aside className="bg-white rounded-lg border border-slate-200 p-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          <PhotoList />
        </aside>
      </main>

      <PhotoInfoPanel />
    </div>
  );
}
