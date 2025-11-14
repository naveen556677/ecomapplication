// src/screens/ProductsScreen.js
import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { fetchProducts } from '../api/productService';
import ProductCard from '../components/ProductCard';
import useStore from '../store/useStore';

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const addToCart = useStore(s => s.addToCart);

  const load = async () => {
    setLoadingInitial(true);
    const items = await fetchProducts({ page:1, pageSize: 20 });
    setProducts(items || []);
    setLoadingInitial(false);
  };

  useEffect(() => { load(); }, []);

  if (loadingInitial) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator size="large" />
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={{flex:1}}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        numColumns={2}
        renderItem={({item}) => (
          <ProductCard
            product={item}
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
            onQuickAdd={() => addToCart(item, 1)}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        ListEmptyComponent={<View style={{padding:20}}><Text>No products found</Text></View>}
        contentContainerStyle={{ padding:8 }}
      />
      <TouchableOpacity style={{ position:'absolute', right:16, bottom:24, padding:12, backgroundColor:'#0a84ff', borderRadius:24 }} onPress={() => navigation.navigate('Cart')}>
        <Text style={{ color:'#fff' }}>Cart</Text>
      </TouchableOpacity>
    </View>
  );
}
