// src/screens/ProductsListScreen.js
import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Image,
  RefreshControl,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import ProductCard from '../components/ProductCard';
import FloatingCartButton from '../components/FloatingCartButton';
import SearchBar from '../components/SearchBar';
import ImageCarousel from '../components/ImageCarousel';
import { useProductsStore } from '../store/productsStore';
import useStore from '../store/useStore';
import { debounce } from '../utils/debounce';
import { ScannerScreen } from './ScannerScreen';
import { Camera } from 'react-native-vision-camera';
import logoutImg from "../assets/logout.png";
import historyImg from "../assets/history.png";
import barcodeImg from "../assets/barcode.png";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const { width } = Dimensions.get('window');
const GRID_GAP = 8;
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
  const lastScan = useProductsStore((s) => s.scanItems);
  const [isScanner, setScanner] = useState(false);
  const [filteredItems, setFilteredItems] = useState(items);

  const addToCart = useStore((s) => s.addToCart);
  const cart = useStore((s) => s.cart || []);
  const logoutAction = useStore((s) => s.logout ?? null);
  const cartCount = (cart || []).reduce((acc, it) => acc + (Number(it.qty) || 0), 0);

  // track which product ids are currently being added (shows loader)
  const [addingIds, setAddingIds] = useState(new Set());

const WEB_CLIENT_ID = '664954328506-941petpngfhungdiq9506j9pdohtinl9.apps.googleusercontent.com';
  useEffect(() => {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, offlineAccess: true });
  }, [])

  const setAdding = (id, val) => {
    setAddingIds((prev) => {
      const next = new Set(prev);
      if (val) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // wrapped quick add that sets loader per-product
  const handleQuickAdd = async (item) => {
    const id = item.productId ?? item.id ?? null;

    // if no id, fallback to direct add
    if (!id) {
      try {
        const snapshot = {
          id: item.productId || item.id,
          title: item.title || item.name,
          price: (item?.variants?.[0]?.inventorySync?.sellingPrice) ?? 0,
          imageUrls: item.imageUrls || (item.variants?.[0]?.images) || [],
        };
        const res = addToCart(snapshot, 1);
        if (res && typeof res.then === 'function') await res;
      } catch (err) {
        console.warn('addToCart failed', err);
      }
      return;
    }

    // prevent duplicate adds
    if (addingIds.has(id)) return;

    setAdding(id, true);
    try {
      const snapshot = {
        id: item.productId || item.id,
        title: item.title || item.name,
        price: (item?.variants?.[0]?.inventorySync?.sellingPrice) ?? 0,
        imageUrls: item.imageUrls || (item.variants?.[0]?.images) || [],
      };

      const res = addToCart(snapshot, 1);
      // support both sync and async addToCart
      if (res && typeof res.then === 'function') {
        await res;
      }
    } catch (err) {
      console.warn('addToCart failed', err);
    } finally {
      setAdding(id, false);
    }
  };

  // permission request in-flight state
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // handle scan button press (request permission if needed)
  const handleScanPress = async () => {
    // if scanner currently open -> close it
    if (isScanner) {
      setScanner(false);
      return;
    }

    // prevent double presses
    if (isRequestingPermission) return;
    setIsRequestingPermission(true);

    try {
      // try reading current status (may not exist on all versions)
      let current = null;
      try {
        if (typeof Camera.getCameraPermissionStatus === 'function') {
          current = await Camera.getCameraPermissionStatus();
        }
      } catch (e) {
        // ignore, we'll call request directly
      }

      // if already authorized, open scanner
      if (current === 'authorized' || current === 'granted') {
        setScanner(true);
        setIsRequestingPermission(false);
        return;
      }

      // request permission - triggers OS prompt (handles "Ask every time")
      let requestResult = null;
      try {
        if (typeof Camera.requestCameraPermission === 'function') {
          requestResult = await Camera.requestCameraPermission();
        }
      } catch (e) {
        console.warn('Camera.requestCameraPermission failed', e);
      }

      // normalize response
      let normalized = null;
      if (requestResult === true) normalized = 'authorized';
      else if (requestResult === false) normalized = 'denied';
      else if (typeof requestResult === 'string') normalized = requestResult;
      else if (requestResult && typeof requestResult === 'object') {
        if (requestResult.status) normalized = requestResult.status === 'authorized' ? 'authorized' : requestResult.status;
        else if (typeof requestResult.hasPermission === 'boolean') normalized = requestResult.hasPermission ? 'authorized' : 'denied';
      }

      // If request yielded authorization -> open scanner
      if (normalized === 'authorized' || normalized === 'granted') {
        setScanner(true);
        setIsRequestingPermission(false);
        return;
      }

      // final fallback: re-check permission status if method available
      try {
        if (typeof Camera.getCameraPermissionStatus === 'function') {
          const cur2 = await Camera.getCameraPermissionStatus();
          if (cur2 === 'authorized' || cur2 === 'granted') {
            setScanner(true);
            setIsRequestingPermission(false);
            return;
          }
        }
      } catch (e) {
        // ignore
      }

      // if we reach here, permission not granted -> show settings prompt
      Alert.alert(
        'Camera permission required',
        'To use the scanner, please allow camera access. Open app settings to enable camera access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } catch (err) {
      console.warn('Permission flow error', err);
      Alert.alert(
        'Camera permission',
        'Unable to obtain camera permission. Open app settings to enable camera access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // animated header values
  const scrollY = useRef(new Animated.Value(0)).current;

  // initial load (page=1)
  useEffect(() => {
    loadInitial({ page: 1, pageSize: 10 });
  }, [loadInitial]);

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
      <View key={i} style={{ ...styles.cardWrapper, width: CARD_WIDTH * 0.95 }}>
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
        isAdding={addingIds.has(item.productId ?? item.id ?? null)}
        style={{ width: CARD_WIDTH * 0.95 }}
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

  // header icons handlers
  const onPressScanHistory = () => {
    navigation.navigate('ScanHistory');
  };

  // show confirmation, then logout
  const onPressLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          style: 'destructive',
          onPress: () => {
            GoogleSignin.signOut();
            logoutAction();
            navigation.replace('Login');

          },
        },
      ],
      { cancelable: true }
    );
  };

  // small ScanButton component
  const ScanButton = () => (
    <TouchableOpacity
      accessibilityLabel={isScanner ? 'Close scanner' : 'Open scanner'}
      activeOpacity={0.85}
      onPress={handleScanPress}
      style={styles.scanButton}
      disabled={isRequestingPermission}
    >
      {isRequestingPermission ? (
        <ActivityIndicator size="small" color="#111827" />
      ) : (
        <View style={styles.scanIcon}>
          <Image source={barcodeImg} style={{ width: 48, height: 48 }} />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top header with icons */}
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Store</Text>
            <Text style={styles.smallText}>Discover products</Text>
          </View>

          <View style={styles.iconRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Scan history"
              onPress={onPressScanHistory}
              style={styles.iconBtn}
            >
              <Image source={historyImg} resizeMode="cover" style={{ width: 25, height: 25 }} />
              <Text>Scan History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Logout"
              onPress={onPressLogout}
              style={[styles.iconBtn, { marginLeft: 8 }]}
            >
              <Image source={logoutImg} resizeMode="cover" style={{ width: 30, height: 30 }} />
              <Text>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* keep existing search and greeting inside header body for continuity */}
        <View style={{ marginTop: 12 }}>
          <SearchBar onSearch={onSearch} compact />
        </View>
      </View>

      <View style={{ height: 8 }} />

      {/* Animated FlatList as main scroll container */}
      <AnimatedFlatList
        data={items}
        keyExtractor={(item) => item.productId || item.id || Math.random().toString()}
        numColumns={2}
        renderItem={renderItem}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: GRID_GAP, paddingTop: 8, paddingBottom: 160 }}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={loading ? <View style={{ height: 60 }}><Text style={{ textAlign: 'center' }}>Loading More...</Text></View> : <View style={{ height: 24 }} />}
        onEndReached={() => {
          if (!loading && hasMore) loadMore();
        }}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        ListHeaderComponentStyle={{ paddingBottom: 8 }}
        ListFooterComponentStyle={{ paddingTop: 8 }}
        ListEmptyComponentStyle={{ marginTop: 8 }}
        // show skeleton as top items while first load
        ListHeaderComponent={loading && items.length === 0 && <View style={{ paddingHorizontal: GRID_GAP - 4 }}><View style={styles.grid}>{renderSkeleton()}</View></View>}
      />

      {/* Floating cart button */}
      <FloatingCartButton onPress={() => navigation.navigate('Cart')} count={cartCount} />

      {/* Bottom-center scanner button (always visible) */}
      {!isScanner && <ScanButton />}
      {isScanner && <ScannerScreen isScanner={isScanner} setScanner={setScanner} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },

  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 18 : 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallText: { color: '#888', fontSize: 13 },
  headerTitle: { fontSize: 20, fontWeight: '800', marginTop: 0 },

  iconRow: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    width: 100,
    height: 55,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

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
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
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

  // scanner button styles
  scanButton: {
    position: 'absolute',
    bottom: 22,
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 60,
  },
  scanIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 14,
    height: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  topLeft: { left: 0, top: 0, transform: [{ rotate: '0deg' }] },
  topRight: { right: 0, top: 0, transform: [{ rotate: '90deg' }] },
  bottomLeft: { left: 0, bottom: 0, transform: [{ rotate: '270deg' }] },
  bottomRight: { right: 0, bottom: 0, transform: [{ rotate: '180deg' }] },
});
