// src/components/ProductCard.js
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useStore from '../store/useStore';
import ImagePng from '../assets/productimage.jpg';

let formatPrice;
try {
  formatPrice = require('../utils/priceHelpers').formatPrice;
} catch {
  formatPrice = (n = 0) => `${Number(n || 0).toFixed(2)}`;
}

export default function ProductCard({
  product = {},
  onPress = () => {},
  onQuickAdd = () => {},
  onToggleFav = () => {},
  isAdding = false,
  style,
}) {
  const navigation = useNavigation();
  const cart = useStore((s) => s.cart || []);
  const [imgFailed, setImgFailed] = useState(false);

  const title = product.title || product.name || 'Untitled product';

  const rawImage =
    (Array.isArray(product.imageUrls) && product.imageUrls[0]) ||
    (Array.isArray(product.variants) && Array.isArray(product.variants[0]?.images) && product.variants[0].images[0]) ||
    ImagePng;

  // normalize to a valid <Image> source
  const imageSource = (() => {
    if (imgFailed) return ImagePng;
    if (!rawImage) return ImagePng;
    // Local asset (require) resolves to a number
    if (typeof rawImage === 'number') return rawImage;
    // Already an object with uri or url
    if (typeof rawImage === 'object' && (rawImage.uri || rawImage.url)) {
      return { uri: rawImage.uri || rawImage.url };
    }
    // string URL
    if (typeof rawImage === 'string') return { uri: rawImage };
    // fallback
    return ImagePng;
  })();

  // price detection (defensive)
  const variant = Array.isArray(product.variants) ? product.variants[0] : null;
  const selling = variant?.inventorySync?.sellingPrice ?? product?.price ?? product?.mrp ?? 0;
  const mrp = variant?.mrp ?? product?.mrp ?? selling;
  const discountPct = mrp && mrp > selling ? Math.round(((mrp - selling) / mrp) * 100) : 0;

  const rating = product?.rating ?? '-';

  // identify product id consistently
  const productId = product.productId ?? product.id ?? null;

  // determine if product already in cart (qty > 0)
  const inCart = useMemo(() => {
    if (!productId) return false;
    return cart.some((it) => {
      const id = it.id ?? it.productId ?? null;
      const qty = Number(it.qty ?? it.quantity ?? it.count ?? 0);
      return id && id.toString() === productId.toString() && qty > 0;
    });
  }, [cart, productId]);

  // press animation
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, friction: 7 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();

  // a11y
  const a11y = `${title}. Price ${formatPrice(selling)}${discountPct > 0 ? `, ${discountPct}% off` : ''}`;

  // footer button handlers
  const handleAddPress = (e) => {
    e?.stopPropagation?.();
    if (isAdding) return; // guard
    onQuickAdd(product);
    if (AccessibilityInfo.announceForAccessibility) {
      AccessibilityInfo.announceForAccessibility(`${title} added to cart`);
    }
  };

  const handleViewPress = (e) => {
    e?.stopPropagation?.();
    try {
      navigation.navigate('Cart');
      if (AccessibilityInfo.announceForAccessibility) {
        AccessibilityInfo.announceForAccessibility('Opened cart');
      }
    } catch (err) {
      console.warn('Navigation to Cart failed', err);
    }
  };

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          onPress(product);
        }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={styles.card}
      >
        {/* Image area */}
        <View style={styles.imageArea}>
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              // fallback to bundled placeholder if remote fails
              setImgFailed(true);
            }}
          />

          {/* bottom info overlay */}
          <View style={styles.overlay}>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.title}>
                {title}
              </Text>
              <View style={styles.row}>
                <View style={styles.rating}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.ratingText}>{rating}</Text>
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

        {/* Footer: small description + add/view button */}
        <View style={styles.footer}>
          <Text style={styles.desc} numberOfLines={2}>
            {product.shortDescription ?? product.description ?? ''}
          </Text>

          {inCart ? (
            <TouchableOpacity
              style={[styles.addBtn, styles.viewBtn]}
              onPress={handleViewPress}
              accessibilityRole="button"
              accessibilityLabel={`View ${title} in cart`}
              activeOpacity={0.85}
            >
              <Text style={styles.addText}>View</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.addBtn, isAdding && styles.disabledBtn]}
              onPress={handleAddPress}
              accessibilityRole="button"
              accessibilityLabel={`Add ${title} to cart`}
              activeOpacity={0.85}
              disabled={isAdding}
            >
              {isAdding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addText}>Add</Text>}
            </TouchableOpacity>
          )}
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
  },

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

  row: { flexDirection: 'row', alignItems: 'center' },

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
  viewBtn: {
    backgroundColor: '#0b84ff',
  },
  disabledBtn: { opacity: 0.7 },
  addText: { color: '#fff', fontWeight: '800' },
});
