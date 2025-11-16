export function matchBarcode(product, scannedCode) {
  if (!product || !Array.isArray(product.variants)) return null;
  const code = String(scannedCode || '').trim();
  if (!code) return null;
  for (const variant of product.variants) {
    const bcodes = variant.barcodes || [];
    for (const bc of bcodes) {
      if (!bc) continue;
      if (String(bc).trim() === code) return { product, variant };
    }
  }
  return null;
}

export function findProductByBarcode(products = [], scannedCode) {
  for (const p of products) {
    const m = matchBarcode(p, scannedCode);
    if (m) return m;
  }

  
  return null;
}
