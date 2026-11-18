import { create } from 'zustand';

import { MAX_SCREENSHOTS } from '../constants';

const EMPTY_FOCUS = { hovered: null, selected: null };
const EMPTY_SAVE = { savedId: null, savedSignature: null };

export const useInsightOcrStore = create((set, get) => ({
  items: [],
  selectedId: null,
  ...EMPTY_FOCUS,
  ...EMPTY_SAVE,

  addFiles: (files) =>
    set((state) => {
      const added = files
        .slice(0, MAX_SCREENSHOTS - state.items.length)
        .map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
      return { items: [...state.items, ...added], selectedId: state.selectedId ?? added[0]?.id ?? null };
    }),

  removeItem: (id) =>
    set((state) => {
      const index = state.items.findIndex((item) => item.id === id);
      URL.revokeObjectURL(state.items[index].url);
      const items = state.items.filter((item) => item.id !== id);
      const next = items[index] ?? items[index - 1];
      return { items, selectedId: state.selectedId === id ? next?.id ?? null : state.selectedId, ...EMPTY_FOCUS };
    }),

  clear: () => {
    get().items.forEach((item) => URL.revokeObjectURL(item.url));
    set({ items: [], selectedId: null, ...EMPTY_FOCUS, ...EMPTY_SAVE });
  },

  select: (id) => set({ selectedId: id, hovered: null }),

  step: (delta) => {
    const { items, selectedId } = get();
    const index = items.findIndex((item) => item.id === selectedId);
    const next = items[index + delta];
    if (next) set({ selectedId: next.id, hovered: null });
  },

  setHovered: (key) => set({ hovered: key }),

  markSaved: (savedId, savedSignature) => set({ savedId, savedSignature }),

  toggleSelected: (key, itemId) =>
    set((state) => ({
      selected: state.selected === key ? null : key,
      selectedId: itemId ?? state.selectedId,
    })),
}));
