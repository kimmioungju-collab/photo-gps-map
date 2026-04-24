import { create } from 'zustand';
import type { PhotoMeta } from '../types/photo';
import { extractPhotoMeta, sortAndIndex } from '../utils/exif';
import { fetchDrivingRoute, type RouteResult } from '../utils/routing';

interface PhotoState {
  photos: PhotoMeta[];
  loading: boolean;
  selectedId: string | null;
  focusTick: number;                // bumps when we want map to re-center on selected
  route: RouteResult | null;
  routeLoading: boolean;

  addFiles: (files: FileList | File[]) => Promise<void>;
  removeOne: (id: string) => void;
  clear: () => void;
  select: (id: string | null) => void;
  focusOnSelected: (id: string) => void;
}

export const usePhotoStore = create<PhotoState>((set, get) => ({
  photos: [],
  loading: false,
  selectedId: null,
  focusTick: 0,
  route: null,
  routeLoading: false,

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
    recomputeRoute(set, get);
  },

  removeOne: (id) => {
    const target = get().photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    const remaining = sortAndIndex(get().photos.filter((p) => p.id !== id));
    set({
      photos: remaining,
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
    recomputeRoute(set, get);
  },

  clear: () => {
    get().photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    set({ photos: [], selectedId: null, route: null });
  },

  select: (id) => set({ selectedId: id }),

  focusOnSelected: (id) => set({ selectedId: id, focusTick: get().focusTick + 1 }),
}));

// Debounced route fetcher
let routeTimer: number | null = null;
function recomputeRoute(
  set: (s: Partial<PhotoState>) => void,
  get: () => PhotoState
) {
  if (routeTimer) window.clearTimeout(routeTimer);
  routeTimer = window.setTimeout(async () => {
    const gps = get().photos.filter((p) => p.hasGps);
    if (gps.length < 2) { set({ route: null, routeLoading: false }); return; }
    set({ routeLoading: true });
    try {
      const result = await fetchDrivingRoute(
        gps.map((p) => ({ lat: p.lat!, lng: p.lng! }))
      );
      set({ route: result, routeLoading: false });
    } catch {
      set({ routeLoading: false });
    }
  }, 300);
}
