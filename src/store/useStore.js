// src/store/useStore.js
// Zustand + react-native-mmkv store (defensive + adapter)

let createZustand;
try {
  const z = require('zustand');
  createZustand = z.default ?? z.create ?? z;
} catch (err) {
  throw new Error('zustand not found: ' + err.message);
}

let mmkvModule;
try {
  mmkvModule = require('react-native-mmkv');
} catch (err) {
  mmkvModule = null;
}

function createStorageAdapter() {
  if (mmkvModule) {
    try {
      if (typeof mmkvModule === 'function') {
        const inst = new mmkvModule({ id: 'app' });
        return wrapInstance(inst);
      }
      if (mmkvModule.MMKV && typeof mmkvModule.MMKV === 'function') {
        const inst = new mmkvModule.MMKV({ id: 'app' });
        return wrapInstance(inst);
      }
      if (typeof mmkvModule.createMMKV === 'function') {
        const inst = mmkvModule.createMMKV({ id: 'app' });
        return wrapInstance(inst);
      }
      if (typeof mmkvModule.getString === 'function' && typeof mmkvModule.set === 'function') {
        return {
          get: (k) => mmkvModule.getString(k),
          set: (k, v) => mmkvModule.set(k, v),
          delete: (k) => mmkvModule.delete?.(k),
          clearAll: () => mmkvModule.clearAll?.()
        };
      }
    } catch (err) {
      // fall through to memory fallback
    }
  }

  const map = new Map();
  return {
    get: (k) => (map.has(k) ? map.get(k) : undefined),
    set: (k, v) => map.set(k, v),
    delete: (k) => map.delete(k),
    clearAll: () => map.clear()
  };

  function wrapInstance(inst) {
    return {
      get: (k) => {
        if (!inst) return undefined;
        if (typeof inst.getString === 'function') return inst.getString(k);
        if (typeof inst.get === 'function') return inst.get(k);
        return undefined;
      },
      set: (k, v) => {
        if (!inst) return;
        if (typeof inst.set === 'function') return inst.set(k, v);
        if (typeof inst.setString === 'function') return inst.setString(k, v);
        if (typeof inst.set === 'function') return inst.set(k, String(v));
      },
      delete: (k) => {
        if (!inst) return;
        if (typeof inst.delete === 'function') return inst.delete(k);
        if (typeof inst.remove === 'function') return inst.remove(k);
      },
      clearAll: () => {
        if (!inst) return;
        if (typeof inst.clearAll === 'function') return inst.clearAll();
      }
    };
  }
}

const storage = createStorageAdapter();

const safeParse = (s, fallback) => {
  if (s === undefined || s === null) return fallback;
  if (typeof s === 'object') return s;
  try { return JSON.parse(s); } catch { return fallback; }
};

const safeStringify = (v) => {
  try { return JSON.stringify(v); } catch { return String(v); }
};

const persistedCart = safeParse(storage.get('cart'), []);
const persistedUser = safeParse(storage.get('user'), null);
const persistedScans = safeParse(storage.get('scans'), []);

const useStore = createZustand((set, get) => ({
  user: persistedUser,
  cart: persistedCart,
  scans: persistedScans,

  setUser: (user) => {
    try { storage.set('user', safeStringify(user)); } catch (e) { console.warn('storage.set user failed', e); }
    set({ user });
  },

  logout: () => {
    try { storage.delete('user'); storage.delete('cart'); storage.delete('scans'); } catch (e) {}
    set({ user: null, cart: [], scans: [] });
  },

  addToCart: (product, qty = 1) => {
    const cart = [...(get().cart || [])];
    const key = product.id ?? product.productId;
    const idx = cart.findIndex(i => i && (i.id === key || i.productId === key));
    if (idx > -1) {
      const existing = cart[idx];
      const newQty = (Number(existing.qty) || 0) + Number(qty || 1);
      cart[idx] = { ...existing, qty: newQty };
    } else {
      const snapshot = {
        id: key,
        name: product.title ?? product.name ?? product.productSnapshot?.name ?? 'Unknown',
        price: product.price ?? product.unitLevelPrice ?? product.productSnapshot?.price ?? 0,
        images: product.imageUrls ?? (product.variants && product.variants[0] && product.variants[0].images) ?? product.productSnapshot?.images ?? []
      };
      cart.push({ ...snapshot, qty: Number(qty || 1) });
    }
    try { storage.set('cart', safeStringify(cart)); } catch (e) { console.warn('storage.set cart failed', e); }
    set({ cart });
  },

  removeFromCart: (productId) => {
    const cart = (get().cart || []).filter(i => i && !(i.id === productId || i.productId === productId));
    try { storage.set('cart', safeStringify(cart)); } catch (e) { console.warn('storage.set cart failed', e); }
    set({ cart });
  },

  updateQty: (productId, qty) => {
    const cart = (get().cart || []).map(i => (i && (i.id === productId || i.productId === productId) ? { ...i, qty: Number(qty) } : i));
    try { storage.set('cart', safeStringify(cart)); } catch (e) { console.warn('storage.set cart failed', e); }
    set({ cart });
  },

  addScan: (code) => {
    if (!code) return;
    const normalized = String(code).trim();
    const prev = get().scans || [];
    const filtered = prev.filter(c => String(c) !== normalized);
    const scans = [normalized, ...filtered].slice(0, 5);
    try { storage.set('scans', safeStringify(scans)); } catch (e) { console.warn('storage.set scans failed', e); }
    set({ scans });
  },

  clearAll: () => {
    try { storage.clearAll?.(); storage.delete?.('user'); storage.delete?.('cart'); storage.delete?.('scans'); } catch(e){}
    set({ user: null, cart: [], scans: [] });
  }
}));

export default useStore;
