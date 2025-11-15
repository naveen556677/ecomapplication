// src/components/ProductCard.js
import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  AccessibilityInfo,
} from 'react-native';

/**
 * ProductCard (modern)
 * Props:
 *  - product: product object
 *  - onPress: fn
 *  - onQuickAdd: fn
 *  - onToggleFav: fn (optional) // will be called with product
 *
 * Usage: <ProductCard product={p} onPress={...} onQuickAdd={...} />
 */

// tiny formatPrice fallback
let formatPrice;
try {
  formatPrice = require('../utils/priceHelpers').formatPrice;
} catch {
  formatPrice = (n = 0) => `${Number(n || 0).toFixed(2)}`;
}

export default function ProductCard({ product = {}, onPress = () => {}, onQuickAdd = () => {}, onToggleFav = () => {}, style }) {
  const title = product.title || product.name || 'Untitled product';

  const image =
    (Array.isArray(product.imageUrls) && product.imageUrls[0]) ||
    (Array.isArray(product.variants) && Array.isArray(product.variants[0]?.images) && product.variants[0].images[0]) ||
    'https://picsum.photos/800/800';

  // price detection (defensive)
  const variant = Array.isArray(product.variants) ? product.variants[0] : null;
  const selling = variant?.inventorySync?.sellingPrice ?? product?.price ?? product?.mrp ?? 0;
  const mrp = variant?.mrp ?? product?.mrp ?? selling;
  const discountPct = mrp && mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0;

  // tiny rating fallback (if product.rating not present)
  const rating = Math.min(5, Math.max(0, Number(product.rating ?? (Math.random() * 1.5 + 3).toFixed(1))));

  // press animation
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, friction: 7 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

  // a11y
  const a11y = `${title}. Price ${formatPrice(selling)}${discountPct > 0 ? `, ${discountPct}% off` : ''}`;

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => { onPress(product); }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={styles.card}
      >
        {/* Image area */}
        <View style={styles.imageArea}>
          <Image source={{ uri: image }} style={styles.image} />

          {/* top-right favorite */}
          {/* <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onToggleFav(product); }}
            style={styles.favBtn}
            accessibilityLabel="Toggle favorite"
            accessibilityRole="button"
          >
            <Text style={styles.favIcon}>♡</Text>
          </TouchableOpacity> */}

          {/* bottom info overlay */}
          <View style={styles.overlay}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.title}>{title}</Text>
              <View style={styles.row}>
                <View style={styles.rating}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </View>
                <Text numberOfLines={1} style={styles.categoryText}>
                  {(product.appCategories?.categoryLevel2?.[0]) || (product.industryType?.[0]) || ''}
                </Text>
              </View>
            </View>

            {/* price badge */}
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{formatPrice(selling)}</Text>
              {discountPct > 0 && <Text style={styles.discountText}>{discountPct}%</Text>}
            </View>
          </View>
        </View>

        {/* Footer: small description + add button */}
        <View style={styles.footer}>
          <Text style={styles.desc} numberOfLines={2}>
            {product.shortDescription ?? product.description ?? ''}
          </Text>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={(e) => { e.stopPropagation?.(); onQuickAdd(product); AccessibilityInfo.announceForAccessibility && AccessibilityInfo.announceForAccessibility('Added to cart'); }}
            accessibilityRole="button"
            accessibilityLabel={`Add ${title} to cart`}
            activeOpacity={0.85}
          >
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginVertical: 8,
    marginHorizontal: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  imageArea: {
    width: '100%',
    height: 180,
    backgroundColor: '#f6f7fb',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  favIcon: { fontSize: 18, color: '#ff3b30' },

  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.28)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  title: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  rating: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  star: { color: '#FFD166', marginRight: 6, fontSize: 14 },
  ratingText: { color: '#fff', fontWeight: '700' },
  categoryText: { color: '#dfe6ff', fontSize: 12 },

  priceBadge: {
    marginLeft: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: { color: '#111', fontWeight: '800', fontSize: 14 },
  discountText: { color: '#ff3b30', fontWeight: '800', marginTop: 2, fontSize: 12 },

  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  desc: { flex: 1, color: '#444', fontSize: 12, marginRight: 8 },

  addBtn: {
    backgroundColor: '#ff6b00',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#fff', fontWeight: '800' },
});
