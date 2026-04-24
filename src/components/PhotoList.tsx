import { usePhotoStore } from '../store/photoStore';
import { formatDate } from '../utils/exif';

export default function PhotoList() {
  const { photos, selectedId, select } = usePhotoStore();

  const gpsPhotos = photos.filter((p) => p.hasGps);
  const noGpsPhotos = photos.filter((p) => !p.hasGps);

  if (photos.length === 0) {
    return (
      <div className="p-4 text-slate-500 text-sm">
        업로드된 사진이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section>
        <h3 className="font-semibold text-slate-800 mb-2">
          GPS 포함 ({gpsPhotos.length})
        </h3>
        <ul className="space-y-1">
          {gpsPhotos.map((p) => (
            <li
              key={p.id}
              onClick={() => select(p.id)}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                selectedId === p.id ? 'bg-blue-50 ring-1 ring-blue-300' : 'hover:bg-slate-50'
              }`}
            >
              <span className="num-marker shrink-0">{p.index}</span>
              <img src={p.previewUrl} alt="" className="w-10 h-10 object-cover rounded" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="text-xs text-slate-500">{formatDate(p.takenAt)}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {noGpsPhotos.length > 0 && (
        <section>
          <h3 className="font-semibold text-slate-800 mb-2">
            위치정보 없음 ({noGpsPhotos.length})
          </h3>
          <ul className="space-y-1">
            {noGpsPhotos.map((p) => (
              <li
                key={p.id}
                onClick={() => select(p.id)}
                className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center text-xs shrink-0">
                  ?
                </span>
                <img src={p.previewUrl} alt="" className="w-10 h-10 object-cover rounded" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">{formatDate(p.takenAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
