// src/screens/ProductsScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, TextInput, TouchableOpacity, Text, ActivityIndicator, Button } from 'react-native';
import ProductCard from '../components/ProductCard';
import { fetchProducts, createProductLocal, createProductAPI } from '../api/productService';
import useStore from '../store/useStore';
import debounce from 'lodash.debounce';
import CreateProductModal from '../components/CreateProductModal';

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const addToCart = useStore(s => s.addToCart);
  const cart = useStore(s => s.cart);

  const [createVisible, setCreateVisible] = useState(false);
  const [modeServerCreate, setModeServerCreate] = useState(false); // toggle to choose server create vs local

  const load = async (pg = 1, q = '', append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const items = await fetchProducts({ page: pg, pageSize: 12, search: q });
      if (append) setProducts(prev => [...prev, ...items]);
      else setProducts(items);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(1, ''); }, []);

  const onEndReached = () => {
    if (loadingMore) return;
    const next = page + 1;
    setPage(next);
    load(next, search, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    load(1, search, false);
  };

  const debouncedSearch = useCallback(debounce((q) => { setPage(1); load(1, q, false); }, 500), []);

  const onCreateLocal = (product) => {
    try {
      const created = createProductLocal(product);
      // update UI immediately
      setProducts(prev => [created, ...prev]);
      return created;
    } catch (e) {
      console.warn('create local failed', e);
      throw e;
    }
  };

  const onCreateAPI = async (product) => {
    try {
      const res = await createProductAPI(product); // will throw if not supported
      // res shape depends on server; reload product list
      await load(1, search, false);
      return res;
    } catch (e) {
      console.warn('create API failed', e);
      throw e;
    }
  };

  if (loading) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{flex:1}}>
      <View style={{ padding: 8, flexDirection:'row', alignItems:'center', gap:8 }}>
        <TextInput placeholder="Search" value={search} onChangeText={(t) => { setSearch(t); debouncedSearch(t); }} style={{ padding:8, flex:1, borderWidth:1, borderRadius:6 }} />
        <Button title="Create Product" onPress={() => setCreateVisible(true)} />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item)=> item.id?.toString() || Math.random().toString()}
        numColumns={2}
        renderItem={({item}) => <ProductCard product={item} onPress={() => navigation.navigate('ProductDetails', { product: item })} onQuickAdd={() => addToCart(item,1)} />}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={loadingMore ? <ActivityIndicator /> : null}
        contentContainerStyle={{ padding: 8 }}
      />

      <TouchableOpacity style={{position:'absolute', right:16, bottom:24, padding:12, backgroundColor:'#0a84ff', borderRadius:24}} onPress={() => navigation.navigate('Cart')}>
        <Text style={{color:'#fff'}}>Cart ({cart?.length || 0})</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{position:'absolute', left:16, bottom:24, padding:12, backgroundColor:'#0bbf5a', borderRadius:24}} onPress={() => navigation.navigate('Scanner')}>
        <Text style={{color:'#fff'}}>Scan</Text>
      </TouchableOpacity>

      <CreateProductModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreateLocal={onCreateLocal}
        onCreateAPI={onCreateAPI}
      />
    </View>
  );
}
