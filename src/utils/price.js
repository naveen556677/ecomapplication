// src/utils/price.js
// Rich price extractor returning structured result for UI/badges

export const getDiscountPercent = (mrp, selling) => {
  const m = Number(mrp || 0);
  const s = Number(selling || 0);
  if (!m || m <= s) return 0;
  return Math.round(((m - s) / m) * 100);
};

/**
 * extractPrices(productOrVariant)
 * Accepts either a product (with variants) or a variant object.
 * Returns { mrp, selling, offer, bestPrice, discountPct }
 */
export function extractPrices(input) {
  if (!input) return { mrp: 0, selling: 0, offer: 0, bestPrice: 0, discountPct: 0 };

  // allow caller to pass a product or a variant
  let variant = input.variants && input.variants[0] ? input.variants[0] : input;

  let inv = variant?.inventorySync || {};

  let mrp = Number(inv?.mrp ?? variant?.mrp ?? 0) || 0;
  let selling = Number(inv.sellingPrice ?? variant?.sellingPrice ?? 0) || 0;
  let offer = Number(inv.offerPrice ?? variant?.offerPrice ?? 0) || 0;

  // fallback to mrpData if present
  if ((!mrp || !selling) && Array.isArray(variant?.mrpData) && variant.mrpData.length > 0) {
    let md = variant.mrpData[0] || {};
    let mdMrp = Number(md.mrp) || 0;
    let mdSelling = Number(md.sellingPrice) || 0;
    let mdOffer = Number(md.offerPrice) || 0;
    if (!mrp && mdMrp) mrp = mdMrp;
    if (!selling && mdSelling) selling = mdSelling;
    if (!offer && mdOffer) offer = mdOffer;
  }

  // if still nothing, attempt product-level snapshot price
  let bestPrice = offer || selling || mrp || 0;

  // if variant has unitLevelPrice
  let unitLevel = Number(variant?.unitLevelPrice || 0) || 0;
  if (unitLevel > 0) bestPrice = unitLevel;

  let discountPct = getDiscountPercent(mrp, bestPrice);

  return { mrp, selling, offer, bestPrice, discountPct };
}
