import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState('');
  return (
    <View style={styles.wrap}>
      <TextInput
        placeholder="Search products..."
        value={value}
        onChangeText={t => { setValue(t); onSearch && onSearch(t); }}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 8 },
  input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, elevation: 2 }
});
