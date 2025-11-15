import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { formatPrice } from '../utils/priceHelpers';
import { extractPrices } from '../utils/price';

export default function CartItemRow({ item, onIncrease, onDecrease, onRemove }) {
  const title = item.title || item.name || item.productSnapshot?.name || 'Unknown product';
  const img = (item.imageUrls && item.imageUrls[0]) || (item.images && item.images[0]) || 'https://picsum.photos/800/800';

  let unitPrice = Number(item.price ?? 0);
  if (!unitPrice) {
    try {
      const p = item.productSnapshot ?? item;
      const prices = extractPrices(p);
      unitPrice = Number(prices.bestPrice || 0);
    } catch (e) {
      unitPrice = 0;
    }
  }

  const qty = Number(item.qty ?? 0) || 0;
  const lineTotal = Number((unitPrice * qty).toFixed(2));

  return (
    <View style={styles.card}>
      <Image source={{ uri: img }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.subtitle}>Unit: {unitPrice ? formatPrice(unitPrice) : '—'}</Text>

        <View style={styles.rowBetween}> 
          <View style={styles.controls}>
            <Pressable onPress={onDecrease} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} accessibilityLabel="Decrease quantity">
              <Text style={styles.icon}>−</Text>
            </Pressable>

            <View style={styles.qtyBox}>
              <Text style={styles.qtyText}>{qty}</Text>
            </View>

            <Pressable onPress={onIncrease} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]} accessibilityLabel="Increase quantity">
              <Text style={styles.icon}>+</Text>
            </Pressable>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.lineTotal}>{formatPrice(lineTotal)}</Text>
            <Pressable onPress={onRemove} style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]} accessibilityLabel="Remove item">
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    // subtle shadow / elevation
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14 },
      android: { elevation: 3 }
    })
  },
  image: { width: 96, height: 96, borderRadius: 10, backgroundColor: '#f3f4f6' },
  content: { flex: 1, marginLeft: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  subtitle: { color: '#6b7280', marginTop: 4 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  controls: { flexDirection: 'row', alignItems: 'center' },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e6e9ef',
    backgroundColor: '#fff'
  },
  pressed: { opacity: 0.6 },
  icon: { fontSize: 20, fontWeight: '700', color: '#111827' },

  qtyBox: {
    minWidth: 44,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  qtyText: { fontWeight: '700', fontSize: 15, color: '#111827' },

  lineTotal: { fontWeight: '800', fontSize: 16, color: '#0f172a' },

  removeBtn: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffe4e6',
    backgroundColor: '#fff'
  },
  removeBtnPressed: { backgroundColor: '#fff5f6' },
  removeText: { color: '#b91c1c', fontWeight: '700' }
});
