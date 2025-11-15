// src/screens/ProductsListScreen.js
import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native';
import ProductCard from '../components/ProductCard';
import FloatingCartButton from '../components/FloatingCartButton';
import SearchBar from '../components/SearchBar';
import ImageCarousel from '../components/ImageCarousel';
import { useProductsStore } from '../store/productsStore';
import useStore from '../store/useStore';
import { debounce } from '../utils/debounce';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = (width - GRID_GAP * 3) / 2; // 2 columns with paddings

const AnimatedFlatList = Animated.createAnimatedComponent(require('react-native').FlatList);

export default function ProductsListScreen({ navigation }) {
  // store selectors
  const items = useProductsStore((s) => s.items || []);
  const loadInitial = useProductsStore((s) => s.loadInitial);
  const loadMore = useProductsStore((s) => s.loadMore);
  const loading = useProductsStore((s) => s.loading);
  const refreshing = useProductsStore((s) => s.refreshing);
  const refresh = useProductsStore((s) => s.refresh);
  const hasMore = useProductsStore((s) => s.hasMore);

  const addToCart = useStore((s) => s.addToCart);
  const cart = useStore((s) => s.cart || []);
  const cartCount = (cart || []).reduce((acc, it) => acc + (Number(it.qty) || 0), 0);

  // animated header values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -70],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // initial load (page=1)
  useEffect(() => {
    loadInitial({ page: 1, pageSize: 10 });
  }, [loadInitial]);

  // quick add
  function handleQuickAdd(item) {
    const snapshot = {
      id: item.productId || item.id,
      title: item.title || item.name,
      price: (item?.variants?.[0]?.inventorySync?.sellingPrice) ?? 0,
      imageUrls: item.imageUrls || (item.variants?.[0]?.images) || [],
    };
    addToCart(snapshot, 1);
  }

  // debounced search
  const debouncedLoad = useMemo(
    () =>
      debounce((q) => {
        loadInitial({ page: 1, pageSize: 10, search: q });
      }, 450),
    [loadInitial]
  );
  const onSearch = useCallback((q) => debouncedLoad(q), [debouncedLoad]);

  // featured images for carousel (top hero)
  const featuredImages = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];
    return items
      .slice(0, 6)
      .map((p) => (Array.isArray(p.imageUrls) && p.imageUrls[0]) || (Array.isArray(p.variants) && Array.isArray(p.variants[0]?.images) && p.variants[0].images[0]) || null)
      .filter(Boolean);
  }, [items]);

  // categories chips
  const categories = useMemo(() => {
    const set = new Set();
    items.forEach((p) => {
      const level2 = p?.appCategories?.categoryLevel2 ?? [];
      (Array.isArray(level2) ? level2 : []).slice(0, 2).forEach((c) => c && set.add(c));
    });
    return Array.from(set).slice(0, 6);
  }, [items]);

  // skeleton (rendered while loading and empty)
  const renderSkeleton = () => {
    const arr = Array.from({ length: 6 });
    return arr.map((_, i) => (
      <View key={i} style={styles.cardWrapper}>
        <View style={[styles.card, styles.skelCard]}>
          <View style={styles.skelImage} />
          <View style={{ padding: 10 }}>
            <View style={styles.skelLineShort} />
            <View style={styles.skelLineLong} />
            <View style={styles.skelPrice} />
          </View>
        </View>
      </View>
    ));
  };

  // render product card (2-column)
  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
        onQuickAdd={() => handleQuickAdd(item)}
        style={{ width: CARD_WIDTH }}
      />
    </View>
  );

  // empty state
  const ListEmptyComponent = () =>
    loading ? null : (
      <View style={styles.empty}>
        <Image source={{ uri: 'https://via.placeholder.com/300x200.png?text=No+Products' }} style={{ width: 220, height: 150, marginBottom: 12, borderRadius: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>No products found</Text>
        <Text style={{ color: '#666', textAlign: 'center', paddingHorizontal: 24 }}>Try clearing filters or check back later for more items.</Text>
        <TouchableOpacity onPress={() => loadInitial({ page: 1, pageSize: 10 })} style={styles.reloadBtn}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Reload</Text>
        </TouchableOpacity>
      </View>
    );

  // header component for FlatList
  const ListHeader = () => (
    <View>
      <Animated.View style={[styles.headerBody, { opacity: headerOpacity }]}>
        <Text style={styles.greet}>Hello 👋</Text>
        <Text style={styles.welcome}>Find your perfect product</Text>

        <View style={{ height: 12 }} />

        <SearchBar onSearch={onSearch} compact />

        {categories.length > 0 && (
          <Animated.View style={{ marginTop: 12 }}>
            <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 4 }}>
              {categories.map((c, idx) => (
                <TouchableOpacity key={idx} style={styles.chip}>
                  <Text style={{ color: '#333', fontWeight: '600' }}>{c}</Text>
                </TouchableOpacity>
              ))}
            </Animated.ScrollView>
          </Animated.View>
        )}
      </Animated.View>

      {featuredImages.length > 0 && (
        <View style={styles.featuredWrap}>
          <ImageCarousel images={featuredImages} />
        </View>
      )}

      <View style={{ height: 8 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Animated header overlay (sticky feel) */}
      <Animated.View style={[styles.headerContainer, { transform: [{ translateY: headerTranslate }] }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.smallText}>Welcome back</Text>
            <Text style={styles.headerTitle}>Explore Products</Text>
          </View>

          <TouchableOpacity style={styles.cartIcon} onPress={() => navigation.navigate('Cart')}>
            <Text style={{ fontSize: 20 }}>🛒</Text>
            {cartCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Animated FlatList as main scroll container */}
      <AnimatedFlatList
        data={items}
        keyExtractor={(item) => item.productId || item.id || Math.random().toString()}
        numColumns={2}
        renderItem={renderItem}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: GRID_GAP }}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 140, paddingHorizontal: GRID_GAP }}
        // ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={loading && !items.length ? null : <View style={{ height: 24 }} />}
        onEndReached={() => {
          if (!loading && hasMore) loadMore();
        }}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        // while initial loading and zero items show skeleton above grid
        ListHeaderComponentStyle={{ paddingBottom: 8 }}
        ListFooterComponentStyle={{ paddingTop: 8 }}
        // show skeleton as top items while first load
        ListEmptyComponentStyle={{ marginTop: 8 }}
        // If loading and no items, render skeleton cards before the list
        ListHeaderComponent={loading && items.length === 0 ? () => <View style={{ paddingHorizontal: GRID_GAP }}><View style={styles.grid}>{renderSkeleton()}</View></View> : ListHeader}
      />

      {/* Floating cart button */}
      {/* <FloatingCartButton onPress={() => navigation.navigate('Cart')} count={cartCount} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },

  headerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingTop: 15,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallText: { color: '#888', fontSize: 13 },
  headerTitle: { fontSize: 20, fontWeight: '800', marginTop: 4 },

  cartIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ff3b30', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  headerBody: {
    paddingHorizontal: GRID_GAP,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  greet: { color: '#666', fontSize: 14 },
  welcome: { fontWeight: '800', fontSize: 18, marginTop: 4 },

  searchWrap: { marginTop: 12, marginBottom: 8 },

  chip: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  featuredWrap: { paddingVertical: 12 },

  // grid/card
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between',gap:10 },
  cardWrapper: { width: CARD_WIDTH, marginBottom: 14 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  // skeleton
  skelCard: { backgroundColor: '#fff' },
  skelImage: { height: 140, backgroundColor: '#eee', width: '100%' },
  skelLineShort: { height: 12, backgroundColor: '#eee', width: '50%', marginTop: 8, borderRadius: 6 },
  skelLineLong: { height: 12, backgroundColor: '#eee', width: '80%', marginTop: 6, borderRadius: 6 },
  skelPrice: { height: 18, backgroundColor: '#eee', width: '40%', marginTop: 8, borderRadius: 6 },

  empty: { alignItems: 'center', padding: 28, marginTop: 50 },
  reloadBtn: { marginTop: 14, backgroundColor: '#007bff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
});
