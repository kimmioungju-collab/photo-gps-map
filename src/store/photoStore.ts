import { create } from 'zustand';
import type { PhotoMeta } from '../types/photo';
import { extractPhotoMeta, sortAndIndex } from '../utils/exif';

interface PhotoState {
  photos: PhotoMeta[];
  loading: boolean;
  selectedId: string | null;
  addFiles: (files: FileList | File[]) => Promise<void>;
  clear: () => void;
  select: (id: string | null) => void;
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photos: [],
  loading: false,
  selectedId: null,

  addFiles: async (files) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (incoming.length === 0) return;
    set({ loading: true });
    const base = get().photos.length;
    const parsed = await Promise.all(
      incoming.map((f, i) => extractPhotoMeta(f, base + i))
    );
    const merged = sortAndIndex([...get().photos, ...parsed]);
    set({ photos: merged, loading: false });
  },

  clear: () => {
    get().photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    set({ photos: [], selectedId: null });
  },

  select: (id) => set({ selectedId: id }),
}));
