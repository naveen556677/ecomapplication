// src/screens/ProductDetailsScreen.js
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, Image, Share } from 'react-native';
import useStore from '../store/useStore';

export default function ProductDetailsScreen({ route }) {
  const { product } = route.params;
  const addToCart = useStore(s => s.addToCart);
  const [qty, setQty] = useState(1);

  const onShare = async () => {
    try {
      await Share.share({ message: `${product.name} - ₹${product.price}` });
    } catch (e) { console.warn(e); }
  };

  return (
    <ScrollView style={{flex:1,padding:12}}>
      <Image source={{ uri: product.image || 'https://via.placeholder.com/600' }} style={{height:300, borderRadius:8}} resizeMode="cover" />
      <Text style={{fontSize:20, fontWeight:'bold', marginTop:12}}>{product.name}</Text>
      <Text style={{marginTop:8}}>₹{product.price}</Text>
      <Text style={{marginTop:8}}>{product.description}</Text>

      <View style={{flexDirection:'row', alignItems:'center', marginTop:12}}>
        <Button title="-" onPress={() => setQty(q => Math.max(1, q-1))} />
        <Text style={{marginHorizontal:12}}>{qty}</Text>
        <Button title="+" onPress={() => setQty(q => q+1)} />
      </View>

      <View style={{marginTop:12}}>
        <Button title="Add to cart" onPress={() => { addToCart(product, qty); alert('Added to cart'); }} />
        <View style={{height:8}} />
        <Button title="Share" onPress={onShare} />
      </View>
    </ScrollView>
  );
}
