// src/api/productService.js
import api from './axiosClient';

// fallback mock products (safe to use immediately)
const MOCK_PRODUCTS = Array.from({ length: 12 }).map((_, i) => ({
  id: String(i + 1),
  name: `Mock Product ${i + 1}`,
  description: `This is mock product ${i + 1}.`,
  price: (i + 1) * 100,
  image: 'https://via.placeholder.com/300',
  variants: [{ id: `v${i+1}`, barcodes: [`code-${i+1}`] }],
}));

export async function fetchProducts({ page = 1, pageSize = 12 } = {}) {
  // Try real API; if it fails (401/other), return mock
  try {
    const body = {
      page: String(page),
      pageSize: String(pageSize),
      sort: { creationDateSortOption: 'DESC' },
    };
    const res = await api.post('/cms/product/v2/filter/product', body, { headers: { 'x-internal-call': 'true' } });
    const data = res?.data;
    // attempt to find array in common spots
    if (!data) return MOCK_PRODUCTS;
    if (Array.isArray(data.products)) return data.products;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    // try find first array field
    const arr = Object.values(data).find(v => Array.isArray(v));
    if (arr) return arr;
    // fallback to mock
    return MOCK_PRODUCTS;
  } catch (err) {
    console.warn('fetchProducts failed, using mock products:', err?.message || err);
    return MOCK_PRODUCTS;
  }
}

export async function fetchProductByBarcode(barcode) {
  // simple local search over mock + try API if needed (simple approach)
  // Try API: for demo we scan mock list
  const items = await fetchProducts({ page: 1, pageSize: 100 });
  return items.find(p => p.variants?.some(v => v.barcodes?.includes(barcode))) || null;
}
