import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  Pressable,
  TextInput,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import useStore from '../store/useStore';
import CartItemRow from '../components/CartItemRow';
import { formatPrice } from '../utils/priceHelpers';
import { extractPrices } from '../utils/price';

export default function CartScreen({ navigation }) {
  const items = useStore(s => s.cart || []);
  const updateQty = useStore(s => s.updateQty);
  const removeFromCart = useStore(s => s.removeFromCart);
  const clearAll = useStore(s => s.clearAll);

  const [couponApplied, setCouponApplied] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const subtotal = useMemo(() => {
    let s = 0;
    for (const it of items) {
      let unit = Number(it.price ?? 0);
      if (!unit || unit <= 0) {
        try {
          const prices = extractPrices(it.productSnapshot ?? it);
          unit = Number(prices.bestPrice || 0);
        } catch (e) {
          unit = 0;
        }
      }
      const qty = Number(it.qty ?? 0) || 0;
      s += unit * qty;
    }
    return Number(s.toFixed(2));
  }, [items]);

  const discount = couponApplied ? Number((subtotal * 0.10).toFixed(2)) : 0;
  const tax = Number(((subtotal - discount) * 0.05).toFixed(2));
  const total = Number((subtotal - discount + tax).toFixed(2));

  function confirmRemove(productId) {
    Alert.alert('Remove item', 'Remove this item from cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          try { removeFromCart(productId); } catch (e) { console.warn('removeFromCart failed', e); }
        }
      }
    ]);
  }

  function onApplyCoupon() {
    if (couponApplied) {
      Alert.alert('Coupon', `Coupon already applied: ${couponCode}`);
      return;
    }
    // Mock apply
    const mockCode = couponCode.trim() || 'SAVE10';
    setCouponCode(mockCode);
    setCouponApplied(true);
    Alert.alert('Coupon applied', `${mockCode} — mock 10% discount applied`);
  }

  function onRemoveCoupon() {
    setCouponApplied(false);
    setCouponCode('');
    Alert.alert('Coupon removed', 'Coupon has been removed (mock)');
  }

  function onCheckout() {
    Alert.alert(
      'Checkout',
      `Subtotal: ${formatPrice(subtotal)}\nDiscount: ${formatPrice(discount)}\nTax: ${formatPrice(tax)}\n\nTotal: ${formatPrice(total)}\n\n(This is a mock checkout.)`
    );
  }

  function onClearAll() {
    Alert.alert('Clear cart', 'Remove all items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => { try { clearAll(); } catch (e) { console.warn('clearAll failed', e); } } }
    ]);
  }

  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1580910051072-3d18a8f7f2a6?auto=format&fit=crop&w=800&q=60' }}
          style={styles.emptyImage}
        />

        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Looks like you haven't added anything yet.</Text>
        <Pressable style={styles.emtPrimaryButton} onPress={() => navigation.navigate('Products')}>
          <Text style={styles.primaryButtonText}>Continue shopping</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Pressable onPress={() => navigation.navigate('Products')} style={styles.headerAction}>
          <Text style={styles.headerActionText}>+ Add more</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => `${it.id}`}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onIncrease={() => { try { updateQty(item.id, (Number(item.qty) || 0) + 1); } catch (e) { console.warn('updateQty failed', e); } }}
            onDecrease={() => { try { updateQty(item.id, Math.max(1, (Number(item.qty) || 1) - 1)); } catch (e) { console.warn('updateQty failed', e); } }}
            onRemove={() => confirmRemove(item.id)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 220 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.checkoutCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.smallLabel}>Subtotal</Text>
            <Text style={styles.amount}>{formatPrice(subtotal)}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.smallLabel}>Items</Text>
            <Text style={styles.count}>{items.length}</Text>
          </View>
        </View>

        <View style={styles.couponRow}>
          <TextInput
            placeholder="Have a coupon?"
            value={couponCode}
            onChangeText={setCouponCode}
            style={styles.couponInput}
            editable={!couponApplied}
            returnKeyType="done"
            onSubmitEditing={onApplyCoupon}
          />

          <Pressable
            style={[styles.couponButton, couponApplied && styles.couponButtonDisabled]}
            onPress={couponApplied ? onRemoveCoupon : onApplyCoupon}
          >
            <Text style={styles.couponButtonText}>{couponApplied ? 'Remove' : 'Apply'}</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryValue}>{formatPrice(discount)}</Text>
          </View>

          <View style={styles.summaryLeft}>
            <Text style={styles.summaryLabel}>Tax (5%)</Text>
            <Text style={styles.summaryValue}>{formatPrice(tax)}</Text>
          </View>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
        </View>

        <View style={styles.buttonsRow}>
          <Pressable style={styles.primaryButton} onPress={onCheckout}>
            <Text style={styles.primaryButtonText}>Checkout</Text>
          </Pressable>

          <Pressable style={styles.ghostButton} onPress={onClearAll}>
            <Text style={styles.ghostButtonText}>Clear cart</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f7fb' },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 20 : 44,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  headerAction: { padding: 8 },
  headerActionText: { color: '#2563eb', fontWeight: '600' },

  separator: { height: 12 },

  checkoutCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    // shadow
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12 },
      android: { elevation: 6 }
    })
  },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  smallLabel: { color: '#6b7280', fontSize: 12 },
  amount: { fontSize: 20, fontWeight: '700', color: '#111827' },
  count: { fontSize: 18, fontWeight: '600', color: '#111827' },

  couponRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  couponInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#e6e9ef',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: '#fbfdff'
  },
  couponButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center'
  },
  couponButtonDisabled: { opacity: 0.6 },
  couponButtonText: { color: '#fff', fontWeight: '700' },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLeft: { alignItems: 'flex-start' },
  summaryLabel: { color: '#6b7280', fontSize: 13 },
  summaryValue: { fontWeight: '600', fontSize: 14, color: '#111827' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  totalLabel: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  totalAmount: { fontSize: 18, fontWeight: '800', color: '#0f172a' },

  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
    emtPrimaryButton: {
    height: 48,
    padding:10,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  ghostButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e6e9ef',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  ghostButtonText: { color: '#6b7280', fontWeight: '700' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f6f7fb' },
  emptyImage: { width: 160, height: 140, marginBottom: 18, resizeMode: 'contain' },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6, color: '#0f172a' },
  emptySubtitle: { color: '#6b7280', marginBottom: 18 }
});
