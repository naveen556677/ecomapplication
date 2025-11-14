// src/components/ProductCard.js
import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';

export default function ProductCard({ product, onPress, onQuickAdd }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex:1, margin:8, backgroundColor:'#fff', padding:8, borderRadius:8, elevation:2 }}>
      <Image source={{ uri: product.image || product.images?.[0] || 'https://via.placeholder.com/300' }} style={{ height:120, borderRadius:8 }} resizeMode="cover" />
      <Text numberOfLines={1} style={{ marginTop:8, fontWeight:'600' }}>{product.name}</Text>
      <Text style={{ marginTop:4 }}>₹{product.price}</Text>
      <TouchableOpacity onPress={onQuickAdd} style={{ marginTop:8, padding:8, backgroundColor:'#0a84ff', borderRadius:6, alignItems:'center' }}>
        <Text style={{ color:'#fff' }}>Add</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
