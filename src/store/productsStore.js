// src/store/productsStore.js
// Defensive zustand + defensive requires so it works across bundlers

let createZustand;
try {
  const z = require('zustand');
  createZustand = z.default ?? z.create ?? z;
  if (typeof createZustand !== 'function') {
    throw new Error('zustand create not found');
  }
} catch (err) {
  throw new Error('zustand is required for productsStore: ' + (err && err.message ? err.message : String(err)));
}

// Defensive requires for local modules (works whether transpiled as CJS/ESM)
const { fetchProducts } = require('../api/products');
const { parseProductsResponse } = require('../utils/parseProductsResponse');

export const useProductsStore = createZustand((set, get) => ({
  items: [],
  page: 1,
  pageSize: 10,
  loading: false,
  refreshing: false,
  hasMore: true,
  error: null,

  /**
   * loadInitial: load page 1 (or configured)
   * Accepts: { page = 1, pageSize = 10, search = '' }
   */
  loadInitial: async ({ page = 1, pageSize = 10, search = '' } = {}) => {
    set({ loading: true, error: null });
    try {
      console.log('[productsStore] loadInitial -> page:', page, 'pageSize:', pageSize, 'search:', search);
      const res = await fetchProducts({ page, pageSize, search });
      console.log('[productsStore] raw response:', res);

      const parsed = parseProductsResponse(res || {});
      const products = Array.isArray(parsed.products) ? parsed.products : [];
      const meta = parsed.meta || {};

      console.log('[productsStore] parsed products length:', products.length, 'meta:', meta);

      set({
        items: products,
        page: meta.currentPage ?? page,
        pageSize: meta.pageSize ?? pageSize,
        hasMore: (meta.totalPages != null) ? ((meta.currentPage ?? page) < meta.totalPages) : (products.length >= pageSize),
        loading: false,
      });
    } catch (e) {
      console.warn('[productsStore] loadInitial error', e);
      set({ error: e.message ?? String(e), loading: false });
    }
  },

  /**
   * loadMore: appends next page
   */
  loadMore: async () => {
    const state = get();
    if (state.loading || !state.hasMore) return;
    set({ loading: true, error: null });
    try {
      const next = (state.page || 1) + 1;
      console.log('[productsStore] loadMore -> next page:', next, 'pageSize:', state.pageSize);
      const res = await fetchProducts({ page: next, pageSize: state.pageSize });
      console.log('[productsStore] raw loadMore response:', res && typeof res === 'object' ? { statusCode: res.statusCode } : res);

      const parsed = parseProductsResponse(res || {});
      const newProducts = Array.isArray(parsed.products) ? parsed.products : [];
      const meta = parsed.meta || {};

      console.log('[productsStore] loadMore parsed length:', newProducts.length, 'meta:', meta);

      set({
        items: [...(state.items || []), ...newProducts],
        page: meta.currentPage ?? next,
        pageSize: meta.pageSize ?? state.pageSize,
        hasMore: (meta.totalPages != null) ? ((meta.currentPage ?? next) < meta.totalPages) : (newProducts.length >= (state.pageSize || 10)),
        loading: false,
      });
    } catch (e) {
      console.warn('[productsStore] loadMore error', e);
      set({ error: e.message ?? String(e), loading: false });
    }
  },

  /**
   * refresh: reload page 1
   */
  refresh: async () => {
    set({ refreshing: true, error: null });
    try {
      const pageSize = get().pageSize ?? 10;
      console.log('[productsStore] refresh -> pageSize:', pageSize);
      const res = await fetchProducts({ page: 1, pageSize });
      console.log('[productsStore] raw refresh response:', res && typeof res === 'object' ? { statusCode: res.statusCode } : res);

      const parsed = parseProductsResponse(res || {});
      const products = Array.isArray(parsed.products) ? parsed.products : [];
      const meta = parsed.meta || {};

      console.log('[productsStore] refresh parsed length:', products.length, 'meta:', meta);

      set({
        items: products,
        page: meta.currentPage ?? 1,
        refreshing: false,
        hasMore: (meta.totalPages != null) ? ((meta.currentPage ?? 1) < meta.totalPages) : (products.length >= pageSize),
      });
    } catch (e) {
      console.warn('[productsStore] refresh error', e);
      set({ error: e.message ?? String(e), refreshing: false });
    }
  },

  
}));
