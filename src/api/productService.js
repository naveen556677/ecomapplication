// src/api/productService.js
import api from './axiosClient';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
const LOCAL_KEY = 'local_products_v1';

// Helper: safe path access
const safeGet = (obj, path, fallback = undefined) => {
  return path.split('.').reduce((acc, seg) => (acc && acc[seg] !== undefined) ? acc[seg] : undefined, obj) ?? fallback;
};

// Map server product -> app product model
export function mapServerProduct(srv) {
  // srv is the big object in your "data.data.data" array
  // create a minimal product model used in UI
  const id = srv.productId || srv.id || String(Math.random());
  const name = srv.name || srv.title || srv.shortDescription || 'Unnamed';
  const description = srv.description || srv.shortDescription || '';
  // pick price from first variant's unitLevelPrice or null (server uses inventory.mrpData etc)
  const firstVar = Array.isArray(srv.variants) && srv.variants.length ? srv.variants[0] : null;
  const price = (firstVar && (firstVar.unitLevelPrice || firstVar.mrp || firstVar.sellingPrice)) ?? null;

  // image fallback: server has images inside variants.images or top-level imageUrls
  const image = safeGet(firstVar, 'images[0]') || (Array.isArray(srv.imageUrls) && srv.imageUrls[0]) || 'https://via.placeholder.com/400';

  // map variants -> keep barcodes array for scanner
  const variants = (Array.isArray(srv.variants) ? srv.variants : []).map(v => ({
    id: v.variantId || v.id || String(Math.random()),
    name: v.name || '',
    description: v.description || '',
    barcodes: Array.isArray(v.barcodes) ? v.barcodes : (v.barcode ? [v.barcode] : []),
    stockStatus: v.stockStatus || null,
    images: v.images || null,
    raw: v // keep raw variant for debugging if needed
  }));

  return {
    id,
    productId: id,
    name,
    title: srv.title || name,
    description,
    price,
    image,
    variants,
    raw: srv
  };
}

// Fetch products (paged) from server, map them, return array
export async function fetchProductsFromServer({ page = 1, pageSize = 10, search = '' } = {}) {
  const body = {
    page: String(page),
    pageSize: String(pageSize),
    sort: { creationDateSortOption: 'DESC' }
  };
  // if API supports search, include (your server may accept different key)
  if (search && search.trim()) {
    // adjust payload shape depending on server
    body.searchQuery = { name: search.trim() };
  }

  const res = await api.post('/cms/product/v2/filter/product', body);
  // response shape from your example: { data: { data: [ ... ] } }
  const items = safeGet(res, 'data.data.data', []);
  if (!Array.isArray(items)) return [];
  return items.map(mapServerProduct);
}

/*
  fetchProducts: public method for UI
  - tries server first, falls back to persisted local products + mock if needed
*/
export async function fetchProducts({ page = 1, pageSize = 10, search = '' } = {}) {
  try {
    const serverProducts = await fetchProductsFromServer({ page, pageSize, search });
    // prepend local persisted created products (if any)
    const local = readLocalProducts();
    if (Array.isArray(local) && local.length) {
      return [...local, ...serverProducts];
    }
    return serverProducts;
  } catch (err) {
    console.warn('fetchProducts error, falling back to local:', err?.message || err);
    const local = readLocalProducts();
    return local;
  }
}

/* Barcode search: try server pages (you can increase pageSize) then local
   This is efficient if server result set contains the variants with barcodes.
*/
export async function fetchProductByBarcode(barcode) {
  if (!barcode) return null;
  // quick server search: request a page with large pageSize - server may support filter but if not we must search client-side
  try {
    // you can increase pageSize to cover more results if you want, but beware of payload size
    const pageSize = 50;
    const data = await fetchProductsFromServer({ page: 1, pageSize });
    const found = data.find(p => p.variants.some(v => v.barcodes.includes(barcode)));
    if (found) return found;
  } catch (e) {
    console.warn('server barcode search failed', e?.message || e);
  }

  // fallback to local persisted products
  const local = readLocalProducts();
  const foundLocal = local.find(p => p.variants && p.variants.some(v => Array.isArray(v.barcodes) && v.barcodes.includes(barcode)));
  if (foundLocal) return foundLocal;

  return null;
}

/* ---- local persistence helpers (same as earlier) ---- */
function safeParse(s, fallback) {
  if (s === undefined || s === null) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
}
function persistLocalProducts(arr) {
  try { storage.set(LOCAL_KEY, JSON.stringify(arr)); } catch (e) { console.warn('persistLocalProducts', e); }
}
function readLocalProducts() {
  return safeParse(storage.getString(LOCAL_KEY), []);
}
export function createProductLocal(product) {
  if (!product || !product.name) throw new Error('Invalid product');
  const local = readLocalProducts();
  const newItem = {
    id: `local-${Date.now()}`,
    name: product.name,
    description: product.description || '',
    price: Number(product.price || 0),
    image: product.image || 'https://via.placeholder.com/400',
    variants: Array.isArray(product.variants) ? product.variants : [],
    createdAt: new Date().toISOString()
  };
  const next = [newItem, ...local];
  persistLocalProducts(next);
  return newItem;
}
