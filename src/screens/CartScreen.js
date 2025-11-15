// src/screens/CartScreen.js
import React, { useState } from 'react';
import { View, Text, FlatList, Button, Alert, TextInput } from 'react-native';
import useStore from '../store/useStore';

export default function CartScreen({ navigation }) {
  const cart = useStore(s => s.cart);
  const updateQty = useStore(s => s.updateQty);
  const removeFromCart = useStore(s => s.removeFromCart);
  const clearAll = useStore(s => s.clearAll);
  const [coupon, setCoupon] = useState('');
  const subtotal = cart.reduce((s, i) => s + (Number(i.price || 0) * Number(i.qty || 0)), 0);
  const discount = coupon === 'DISCOUNT10' ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.18;
  const total = subtotal - discount + tax;

  return (
    <View style={{flex:1,padding:12}}>
      <FlatList
        data={cart}
        keyExtractor={i => i.id?.toString() || Math.random().toString()}
        ListEmptyComponent={<View style={{padding:20}}><Text>Your cart is empty</Text><Button title="Continue Shopping" onPress={() => navigation.navigate('Products')} /></View>}
        renderItem={({item}) => (
          <View style={{flexDirection:'row', alignItems:'center', marginBottom:12}}>
            <Text style={{flex:1}}>{item.name}</Text>
            <Button title="-" onPress={() => updateQty(item.id, Math.max(1, (item.qty||1)-1))} />
            <Text style={{marginHorizontal:8}}>{item.qty}</Text>
            <Button title="+" onPress={() => updateQty(item.id, (item.qty||1)+1)} />
            <Button title="Remove" color="red" onPress={() => { Alert.alert('Remove', 'Remove item?', [{text:'Cancel'},{text:'OK', onPress: () => removeFromCart(item.id)}]) }} />
          </View>
        )}
      />

      <View style={{marginTop:12}}>
        <Text>Subtotal: ₹{subtotal.toFixed(2)}</Text>
        <Text>Discount: ₹{discount.toFixed(2)}</Text>
        <Text>Tax: ₹{tax.toFixed(2)}</Text>
        <Text style={{fontWeight:'bold'}}>Total: ₹{total.toFixed(2)}</Text>
        <View style={{flexDirection:'row', alignItems:'center', marginTop:8}}>
          <TextInput placeholder="Coupon code" value={coupon} onChangeText={setCoupon} style={{flex:1, borderWidth:1, padding:8, marginRight:8}} />
          <Button title="Apply" onPress={() => Alert.alert('Coupon', coupon === 'DISCOUNT10' ? 'Applied' : 'Invalid coupon')} />
        </View>

        <View style={{height:12}} />
        <Button title="Checkout (mock)" onPress={() => Alert.alert('Checkout', 'Mock checkout successful', [{text:'OK', onPress: () => { clearAll(); navigation.navigate('Products'); }}])} />
      </View>
    </View>
  );
}
