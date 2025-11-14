// src/screens/ProductDetailsScreen.js
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Image } from 'react-native';
import useStore from '../store/useStore';

export default function ProductDetailsScreen({ route }) {
  const { product } = route.params;
  const [qty, setQty] = useState(1);
  const addToCart = useStore(s => s.addToCart);

  return (
    <ScrollView style={{ flex:1, padding:12 }}>
      <Image source={{ uri: product.image || 'https://via.placeholder.com/600' }} style={{ height:250, borderRadius:8 }} resizeMode="cover" />
      <Text style={{ fontSize:20, fontWeight:'bold', marginTop:12 }}>{product.name}</Text>
      <Text style={{ marginTop:8 }}>{product.description}</Text>
      <Text style={{ marginTop:8, fontSize:18 }}>Price: ₹{product.price}</Text>

      <View style={{ flexDirection:'row', alignItems:'center', marginTop:12 }}>
        <Button title="-" onPress={() => setQty(q => Math.max(1, q-1))} />
        <Text style={{ marginHorizontal:12 }}>{qty}</Text>
        <Button title="+" onPress={() => setQty(q => q+1)} />
      </View>

      <View style={{ marginTop:12 }}>
        <Button title="Add to cart" onPress={() => { addToCart(product, qty); alert('Added to cart'); }} />
      </View>
    </ScrollView>
  );
}
