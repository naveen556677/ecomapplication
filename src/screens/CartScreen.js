// src/screens/CartScreen.js
import React from 'react';
import { View, Text, FlatList, Button, Alert } from 'react-native';
import useStore from '../store/useStore';

export default function CartScreen() {
  const cart = useStore(s => s.cart);
  const updateQty = useStore(s => s.updateQty);
  const removeFromCart = useStore(s => s.removeFromCart);

  const subtotal = cart.reduce((s, i) => s + (Number(i.price || 0) * Number(i.qty || 0)), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <View style={{ flex:1, padding:12 }}>
      <FlatList
        data={cart}
        keyExtractor={i => i.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={{ flexDirection:'row', alignItems:'center', marginBottom:12 }}>
            <Text style={{ flex:1 }}>{item.name}</Text>
            <Button title="-" onPress={() => updateQty(item.id, Math.max(1, (item.qty||1)-1))} />
            <Text style={{ marginHorizontal:8 }}>{item.qty}</Text>
            <Button title="+" onPress={() => updateQty(item.id, (item.qty||1)+1)} />
            <Button title="Remove" color="red" onPress={() => removeFromCart(item.id)} />
          </View>
        )}
        ListEmptyComponent={<Text>Your cart is empty</Text>}
      />

      <View style={{ marginTop:20 }}>
        <Text>Subtotal: ₹{subtotal.toFixed(2)}</Text>
        <Text>Tax: ₹{tax.toFixed(2)}</Text>
        <Text style={{ fontWeight:'bold' }}>Total: ₹{total.toFixed(2)}</Text>
        <Button title="Checkout (mock)" onPress={() => Alert.alert('Checkout', 'This is a mock checkout.')} />
      </View>
    </View>
  );
}
