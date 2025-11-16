// src/screens/ScanHistoryScreen.js
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ProductCard from '../components/ProductCard';
import useStore from '../store/useStore';

export default function ScanHistoryScreen() {
  const navigation = useNavigation();
const [addingIds, setAddingIds] = useState(new Set());
  const addToCart = useStore((s) => s.addToCart);
  // Update to match your store variable name
  const scanHistory = useStore((s) => s?.scans ?? []);
  const setAdding = (id, val) => {
    setAddingIds((prev) => {
      const next = new Set(prev);
      if (val) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  function handlePress(item) {
    const product = item?.product ?? item;
    navigation.navigate('ProductDetails', { product });
  }

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

  const renderItem = ({ item }) => {
    const product = item?.product ?? item;
    return (
      <ProductCard
        product={product}
        onPress={() => handlePress(item)}
        // turn off add/view logic in card
       onQuickAdd={() => handleQuickAdd(item)}
       isAdding={addingIds.has(item.productId ?? item.id ?? null)}
        style={{ marginHorizontal: 4 }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
      </View>

      {scanHistory?.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No scans found</Text>
          <Text style={styles.emptySub}>Scan a product to see it here.</Text>
        </View>
      ) : (
        <FlatList
          data={[...scanHistory].reverse()} // newest first
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            String(item?.id ?? item?.product?.id ?? index)
          }
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 8 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' },

  header: {
    paddingTop: Platform.OS === 'android' ? 12 : 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#6b7280', marginTop: 6 },
});
