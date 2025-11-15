import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import ImageCarousel from '../components/ImageCarousel';
import QuantitySelector from '../components/QuantitySelector';
import useStore from '../store/useStore';
import { getDisplayPrice, formatPrice } from '../utils/priceHelpers';
import { extractPrices } from '../utils/price';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
  const product = route.params?.product;
  const navVariantId = route.params?.variantId ?? null;

  if (!product) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No product provided</Text>
      </SafeAreaView>
    );
  }

  const variant =
    (Array.isArray(product.variants) &&
      (navVariantId
        ? product.variants.find((v) => v.variantId === navVariantId) ?? product.variants[0]
        : product.variants[0])) ||
    null;

  const images =
    (Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : Array.isArray(variant?.images) && variant.images.length > 0
        ? variant.images
        : []);

  const [qty, setQty] = useState(1);

  const addToCart = useStore((s) => s.addToCart);

  const displayPrice = getDisplayPrice(product, variant);
  const priceText = displayPrice != null ? formatPrice(displayPrice) : '—';

  const priceInfo = useMemo(() => extractPrices(variant ?? product), [product, variant]);
  const { mrp, bestPrice, discountPct } = priceInfo;

  const carouselRef = useRef(null);
  const [thumbIndex, setThumbIndex] = useState(0);

  function onSelectThumbnail(index) {
    setThumbIndex(index);
    try {
      if (carouselRef.current && typeof carouselRef.current.scrollToIndex === 'function') {
        carouselRef.current.scrollToIndex(index);
      }
    } catch (e) { }
  }

  function onAddToCart() {
    const snapshotPrice = displayPrice != null ? displayPrice : bestPrice ?? 0;
    const snapshot = {
      id: product.productId || product.id,
      title: product.title || product.name,
      price: snapshotPrice,
      imageUrls: images,
      variantId: variant?.variantId ?? null,
      productSnapshot: {
        productId: product.productId ?? product.id,
        title: product.title ?? product.name,
      },
    };

    try {
      addToCart(snapshot, qty);
      Alert.alert('Added to cart', `${snapshot.title} x${qty} added.`);
    } catch (e) {
      console.warn('addToCart failed', e);
      Alert.alert('Error', 'Unable to add to cart.');
    }
  }

  async function onShare() {
    const shareText = `${product.title || product.name}\n${product.shortDescription ?? ''}\nPrice: ${priceText}\n`;
    try {
      await Share.share({ message: shareText });
    } catch (e) {
      console.warn('Share failed', e);
      Alert.alert('Share failed', String(e));
    }
  }

  React.useLayoutEffect(() => {
    const title = (product.title || product.name || 'Product');
    navigation.setOptions({ title: title.length > 32 ? `${title.slice(0, 30)}…` : title });
  }, [navigation, product]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
          {/* Hero + Carousel */}
          <View style={styles.heroWrap}>
            {/* <ImageCarousel ref={carouselRef} images={images} style={styles.carousel} dotSize={8} /> */}
            <ImageCarousel 
              slides={images}
            />


            {/* floating price badge */}
            {/* <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>{priceText}</Text>
              {discountPct > 0 && <Text style={styles.priceBadgeSub}>{discountPct}% OFF</Text>}
            </View> */}
          </View>

          {/* thumbnails */}
          {images && images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll} contentContainerStyle={{ paddingHorizontal: 12 }}>
              {images.map((uri, i) => (
                <TouchableOpacity
                  key={String(i)}
                  onPress={() => onSelectThumbnail(i)}
                  activeOpacity={0.9}
                  style={[styles.thumbItem, thumbIndex === i && styles.thumbActive]}
                >
                  <Image source={{ uri }} style={styles.thumbImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.container}>
            <Text style={styles.title}>{product.title || product.name}</Text>

            <View style={styles.rowTop}>
              <View style={styles.metaCol}>
                <Text style={styles.smallLabel}>Brand</Text>
                <Text style={styles.metaText}>{product.brand ?? '—'}</Text>
              </View>

              <View style={styles.metaCol}>
                <Text style={styles.smallLabel}>Availability</Text>
                <Text style={[styles.metaText, { color: product.inStock ? '#059669' : '#ef4444' }]}>{product.inStock ? 'In stock' : 'Out of stock'}</Text>
              </View>

              <View style={styles.metaColRight}>
                <Text style={styles.smallLabel}>SKU</Text>
                <Text style={styles.metaText}>{product.sku ?? '—'}</Text>
              </View>
            </View>

            {product.shortDescription ? <Text style={styles.shortDesc}>{product.shortDescription}</Text> : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.bodyText}>{product.description ?? '—'}</Text>
            </View>

            {product.attributes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Specifications</Text>
                {Object.entries(product.attributes).map(([k, v]) => (
                  <View key={k} style={styles.specRow}>
                    <Text style={styles.specKey}>{k}</Text>
                    <Text style={styles.specVal}>{String(v)}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <QuantitySelector qty={qty} onChange={setQty} min={1} max={999} step={1} />
            </View>

           <View style={{ marginTop: 18 }}>
  <TouchableOpacity
    onPress={onShare}
    activeOpacity={0.85}
    style={{
      borderWidth: 1,
      borderColor: '#d1d5db',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
    }}
  >
    <Text style={{ fontSize: 18, marginRight: 6 }}>📤</Text>
    <Text style={{ fontWeight: '700', color: '#111827' }}>Share Product</Text>
  </TouchableOpacity>
</View>

          </View>
        </ScrollView>

        {/* sticky footer */}
        <View style={styles.stickyFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerPrice}>{formatPrice((displayPrice != null ? displayPrice : bestPrice) ?? 0)}</Text>
            <Text style={styles.footerSub}>({qty} pcs)</Text>
          </View>

          <View style={styles.footerRight}>
            <TouchableOpacity style={styles.addBtn} onPress={onAddToCart} activeOpacity={0.9}>
              <Text style={styles.addBtnText}>Add to cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buyBtn}
              onPress={() => {
                onAddToCart();
                navigation.navigate('Cart');
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.buyBtnText}>Buy now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  heroWrap: { backgroundColor: '#fff' },
  carousel: { height: Math.round(width * 0.9), backgroundColor: '#fff' },

  priceBadge: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18 }, android: { elevation: 6 } })
  },
  priceBadgeText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  priceBadgeSub: { color: '#fff', marginTop: 2, fontSize: 12, fontWeight: '700' },

  thumbScroll: { marginTop: 8 },
  thumbItem: { marginRight: 10, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  thumbActive: { borderColor: '#2563eb' },
  thumbImage: { width: 72, height: 72, resizeMode: 'cover' },

  container: { padding: 16, backgroundColor: 'transparent' },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 8 },

  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaCol: { flex: 1 },
  metaColRight: { flex: 1, alignItems: 'flex-end' },
  smallLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  metaText: { fontSize: 14, fontWeight: '700', color: '#111827' },

  shortDesc: { color: '#4b5563', marginBottom: 12 },

  section: { marginTop: 12, backgroundColor: '#fff', padding: 12, borderRadius: 10, ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.03, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 }, android: { elevation: 1 } }) },
  sectionTitle: { fontWeight: '800', marginBottom: 8, color: '#0f172a' },
  bodyText: { color: '#374151' },

  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  specKey: { color: '#6b7280' },
  specVal: { fontWeight: '700' },

  shareBtn: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e6eefc', backgroundColor: '#fff' },
  shareText: { color: '#0f172a', fontWeight: '700' },

  stickyFooter: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    borderRadius: 14,
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18 }, android: { elevation: 6 } })
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center' },
  footerPrice: { fontSize: 18, fontWeight: '900', marginRight: 8 },
  footerSub: { color: '#6b7280' },
  footerRight: { flexDirection: 'row' },

  addBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginRight: 8 },
  addBtnText: { color: '#fff', fontWeight: '800' },

  buyBtn: { backgroundColor: '#ff6b00', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  buyBtnText: { color: '#fff', fontWeight: '800' },
});
