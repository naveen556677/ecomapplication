// src/store/useStore.js
// Robust zustand + MMKV store with safe parsing and persistence.

let createZustand;
try {
  const z = require('zustand');
  createZustand = z.default ?? z.create ?? z;
} catch (err) {
  throw new Error('Failed to import zustand. Please npm install zustand. ' + err.message);
}

let createMMKVInstance = null;
try {
  const mmkvModule = require('react-native-mmkv');
  createMMKVInstance =
    mmkvModule.createMMKV?.bind(mmkvModule) ??
    mmkvModule.MMKV?.bind(mmkvModule) ??
    (typeof mmkvModule === 'function' ? (...args) => new mmkvModule(...args) : null);
} catch (err) {
  createMMKVInstance = null;
}

if (!createMMKVInstance) {
  // in-memory shim (non-persistent) — app still works
  createMMKVInstance = () => {
    const map = new Map();
    return {
      getString: (k) => (map.has(k) ? map.get(k) : undefined),
      set: (k, v) => map.set(k, v),
      delete: (k) => map.delete(k),
      clearAll: () => map.clear(),
    };
  };
}

const storage = createMMKVInstance({ id: 'app' });

const safeParse = (s, fallback) => {
  if (s === undefined || s === null) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
};

const persistedCart = safeParse(storage.getString('cart'), []);
const persistedUser = safeParse(storage.getString('user'), null);

const useStore = createZustand((set, get) => ({
  user: persistedUser,
  cart: persistedCart,
  scans: [],

  setUser: (user) => {
    try { storage.set('user', JSON.stringify(user)); } catch (e) { console.warn(e.message); }
    set({ user });
  },

  logout: () => {
    try { storage.delete('user'); storage.delete('cart'); } catch (e) { console.warn(e.message); }
    set({ user: null, cart: [] });
  },

  addToCart: (product, qty = 1) => {
    const cart = [...(get().cart || [])];
    const idx = cart.findIndex((i) => i && i.id === product.id);
    if (idx > -1) cart[idx] = { ...cart[idx], qty: (Number(cart[idx].qty) || 0) + Number(qty) };
    else cart.push({ ...product, qty: Number(qty || 1) });
    try { storage.set('cart', JSON.stringify(cart)); } catch (e) { console.warn(e.message); }
    set({ cart });
  },

  removeFromCart: (productId) => {
    const cart = (get().cart || []).filter(i => i && i.id !== productId);
    try { storage.set('cart', JSON.stringify(cart)); } catch (e) { console.warn(e.message); }
    set({ cart });
  },

  updateQty: (productId, qty) => {
    const cart = (get().cart || []).map(i => (i && i.id === productId ? { ...i, qty: Number(qty) } : i));
    try { storage.set('cart', JSON.stringify(cart)); } catch (e) { console.warn(e.message); }
    set({ cart });
  },

  addScan: (code) => {
    if (!code) return;
    const scans = [code, ...get().scans].filter(Boolean).slice(0, 5);
    set({ scans });
  },

  clearAll: () => {
    try { storage.clearAll?.(); storage.delete('user'); storage.delete('cart'); } catch (e) { console.warn(e.message); }
    set({ user: null, cart: [], scans: [] });
  },
}));

export default useStore;
