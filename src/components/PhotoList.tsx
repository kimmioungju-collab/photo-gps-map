import { usePhotoStore } from '../store/photoStore';
import { formatDate } from '../utils/exif';

function formatGap(ms: number): string {
  if (ms < 60_000) return `+${Math.round(ms / 1000)}초`;
  if (ms < 3_600_000) return `+${Math.round(ms / 60_000)}분`;
  if (ms < 86_400_000) return `+${(ms / 3_600_000).toFixed(1)}시간`;
  return `+${Math.round(ms / 86_400_000)}일`;
}

export default function PhotoList() {
  const { photos, selectedId, focusOnSelected, select, removeOne } = usePhotoStore();

  const gpsPhotos = photos.filter((p) => p.hasGps);
  const noGpsPhotos = photos.filter((p) => !p.hasGps);

  const handleClick = (id: string, hasGps: boolean) => {
    if (hasGps) focusOnSelected(id);     // also pans the map
    else select(id);                     // just shows info panel
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('이 사진을 목록에서 제거할까요?')) removeOne(id);
  };

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
        <h3 className="font-semibold text-slate-800 mb-1">
          GPS 포함 ({gpsPhotos.length})
        </h3>
        <p className="text-[11px] text-slate-500 mb-2">
          📅 촬영시간순 · 클릭하면 지도 이동
        </p>
        <ul className="space-y-1">
          {gpsPhotos.map((p, i) => {
            const prev = gpsPhotos[i - 1];
            const gap =
              prev && p.takenAt && prev.takenAt
                ? p.takenAt.getTime() - prev.takenAt.getTime()
                : null;
            return (
              <li
                key={p.id}
                onClick={() => handleClick(p.id, true)}
                className={`group flex items-center gap-2 p-2 rounded cursor-pointer ${
                  selectedId === p.id ? 'bg-blue-50 ring-1 ring-blue-300' : 'hover:bg-slate-50'
                }`}
              >
                <span className="num-marker shrink-0">{p.index}</span>
                <img src={p.previewUrl} alt="" className="w-10 h-10 object-cover rounded" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500 flex gap-2">
                    <span>{formatDate(p.takenAt)}</span>
                    {gap !== null && <span className="text-blue-600">{formatGap(gap)}</span>}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 md:opacity-60 hover:!opacity-100
                             text-slate-400 hover:text-red-500 px-2 py-1 text-lg leading-none transition"
                  aria-label="사진 삭제"
                  title="삭제"
                >×</button>
              </li>
            );
          })}
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
                onClick={() => handleClick(p.id, false)}
                className="group flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
              >
                <span className="w-8 h-8 rounded-full bg-slate-300 text-white flex items-center justify-center text-xs shrink-0">
                  ?
                </span>
                <img src={p.previewUrl} alt="" className="w-10 h-10 object-cover rounded" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">{formatDate(p.takenAt)}</div>
                  {p.debug && (
                    <div className="text-[10px] text-amber-600 truncate" title={p.debug}>
                      ⚠ {p.debug}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400">
                    {(p.file.size / 1024 / 1024).toFixed(1)}MB · {p.file.type || '?'}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 md:opacity-60 hover:!opacity-100
                             text-slate-400 hover:text-red-500 px-2 py-1 text-lg leading-none transition"
                  aria-label="사진 삭제"
                  title="삭제"
                >×</button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            💡 iOS 사진이 HEIC면 EXIF가 안 읽힐 수 있습니다.<br/>
            설정 → 카메라 → 포맷 → <b>호환성 우선</b>으로 바꾸거나,<br/>
            전송 시 <b>모든 사진 데이터</b> 옵션을 선택하세요.<br/>
            카톡/텔레그램으로 받은 사진은 GPS가 삭제됩니다!
          </p>
        </section>
      )}
    </div>
  );
}
