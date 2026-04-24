import { usePhotoStore } from '../store/photoStore';
import { formatDate } from '../utils/exif';

export default function PhotoInfoPanel() {
  const { photos, selectedId, select } = usePhotoStore();
  const photo = photos.find((p) => p.id === selectedId);
  if (!photo) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 md:inset-auto md:top-4 md:right-4 md:w-80 z-20
                    bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-slate-200 p-3">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-slate-800">
          {photo.index ? `#${photo.index} ` : ''}{photo.name}
        </h3>
        <button
          onClick={() => select(null)}
          className="text-slate-400 hover:text-slate-700 text-xl leading-none"
          aria-label="닫기"
        >×</button>
      </div>
      <img
        src={photo.previewUrl}
        alt={photo.name}
        className="w-full max-h-72 object-contain rounded mt-2 bg-slate-50"
      />
      <dl className="mt-2 text-sm text-slate-700 space-y-1">
        <div className="flex justify-between"><dt className="text-slate-500">촬영일시</dt>
          <dd>{formatDate(photo.takenAt)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">파일명</dt>
          <dd className="truncate ml-2">{photo.name}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">위도</dt>
          <dd>{photo.lat?.toFixed(6) ?? '—'}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">경도</dt>
          <dd>{photo.lng?.toFixed(6) ?? '—'}</dd></div>
        {photo.altitude !== null && (
          <div className="flex justify-between"><dt className="text-slate-500">고도</dt>
            <dd>{photo.altitude?.toFixed(1)} m</dd></div>
        )}
      </dl>
    </div>
  );
}
