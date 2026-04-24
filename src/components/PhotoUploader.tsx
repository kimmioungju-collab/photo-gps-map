import { useRef } from 'react';
import { usePhotoStore } from '../store/photoStore';

export default function PhotoUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addFiles, clear, photos, loading } = usePhotoStore();

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) await addFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="font-semibold text-slate-800">사진 업로드</p>
          <p className="text-sm text-slate-500">
            여러 장 선택 가능 · EXIF GPS 정보가 필요합니다
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white font-medium disabled:opacity-60"
          >
            {loading ? '분석 중…' : '사진 선택'}
          </button>
          {photos.length > 0 && (
            <button
              onClick={clear}
              className="px-4 py-2 rounded bg-slate-200 text-slate-700"
            >
              초기화
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        className="hidden"
      />
    </div>
  );
}
