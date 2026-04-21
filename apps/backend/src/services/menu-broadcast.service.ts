type MenuUpdateListener = () => void;

const listeners = new Set<MenuUpdateListener>();

export const menuBroadcastService = {
  subscribe(fn: MenuUpdateListener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  publish(): void {
    for (const fn of listeners) {
      try { fn(); } catch { /* non-critical */ }
    }
  },
};
