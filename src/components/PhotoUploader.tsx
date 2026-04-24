import { useEffect, useRef, useState } from 'react';
import { usePhotoStore } from '../store/photoStore';

export default function PhotoUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { addFiles, clear, photos, loading } = usePhotoStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  // Global drag-drop anywhere on the page for easier desktop use
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      dragCounter.current += 1;
      setIsDragging(true);
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
    };
    const onDragOver = (e: DragEvent) => { e.preventDefault(); };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      if (e.dataTransfer?.files?.length) await addFiles(e.dataTransfer.files);
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [addFiles]);

  // Paste support (Cmd+V photos from clipboard)
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) await addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [addFiles]);

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-lg p-4 bg-white transition-colors
                    ${isDragging ? 'drop-active' : 'border-slate-300'}`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="font-semibold text-slate-800">
              사진 업로드 {photos.length > 0 && `(${photos.length}장)`}
            </p>
            <p className="text-sm text-slate-500">
              화면 아무 곳에나 <b>드래그</b> · <b>Ctrl/Cmd+V</b> 붙여넣기 · 버튼 클릭 모두 가능
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

      {/* Fullscreen drop overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/25 border-[6px] border-dashed border-blue-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 px-6 py-4 rounded-2xl shadow-2xl text-center">
            <div className="text-4xl mb-2">📥</div>
            <div className="text-lg font-bold text-blue-700">여기에 사진을 놓아주세요</div>
            <div className="text-sm text-slate-600">여러 장 동시 가능</div>
          </div>
        </div>
      )}
    </>
  );
}
