// src/utils/priceHelpers.js
// Lightweight helpers expected by other screens (getDisplayPrice + formatPrice)

export function getDisplayPrice(product, variant = null) {
  // variant fallback
  const v = variant || (Array.isArray(product?.variants) && product.variants[0]) || null;
  if (!v) return null;

  const safeNum = (x) => {
    if (x === null || x === undefined || x === '') return null;
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  };

  // 1) direct unitLevelPrice on variant
  const unitLevel = safeNum(v.unitLevelPrice);
  if (unitLevel !== null) return unitLevel;

  // 2) variant.inventorySync fields (common in your payload)
  const inv = v.inventorySync || {};
  const invOffer = safeNum(inv.offerPrice);
  const invSelling = safeNum(inv.sellingPrice);
  const invMrp = safeNum(inv.mrp);
  if (invOffer !== null) return invOffer;
  if (invSelling !== null) return invSelling;
  if (invMrp !== null) return invMrp;

  // 3) mrpData array on variant (sometimes provided)
  if (Array.isArray(v.mrpData) && v.mrpData.length > 0) {
    const first = v.mrpData[0] || {};
    const mdOffer = safeNum(first.offerPrice);
    const mdSelling = safeNum(first.sellingPrice);
    const mdMrp = safeNum(first.mrp);
    if (mdOffer !== null) return mdOffer;
    if (mdSelling !== null) return mdSelling;
    if (mdMrp !== null) return mdMrp;
  }

  // 4) product-level snapshot price (if you stored it on the product)
  const prodPrice = safeNum(product?.price ?? product?.productSnapshot?.price);
  if (prodPrice !== null) return prodPrice;

  // nothing found
  return null;
}

export function formatPrice(value, currencySymbol = '₹') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  const hasFraction = Math.abs(num - Math.round(num)) > 0;
  if (hasFraction) {
    return `${currencySymbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currencySymbol}${num.toLocaleString('en-IN')}`;
}

export function computeDiscountPercent(mrp, selling) {
  const m = Number(mrp || 0);
  const s = Number(selling || 0);
  if (!m || m <= s) return 0;
  return Math.round(((m - s) / m) * 100);
}
