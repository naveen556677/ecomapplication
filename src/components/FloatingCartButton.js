import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import useStore from '../store/useStore';

export default function FloatingCartButton({ onPress }) {
  const items = useStore(s => s.cart || []);
  const count = items.reduce((acc, it) => acc + (it.qty || 0), 0);

  return (
    <TouchableOpacity onPress={onPress} style={styles.fab}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>🛒</Text>
      {count > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 16, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#ff6b00', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#006400', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' }
});
