// src/components/CreateProductModal.js
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Button, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';

/**
 * Props:
 *  visible (bool)
 *  onClose (fn)
 *  onCreateLocal (fn(product) => product)  // called for local/mock creation
 *  onCreateAPI (fn(product) => Promise) // optional - call server create
 */
export default function CreateProductModal({ visible, onClose, onCreateLocal, onCreateAPI }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [image, setImage] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodes, setBarcodes] = useState([]);

  function addBarcode() {
    const code = (barcodeInput || '').trim();
    if (!code) return;
    if (barcodes.includes(code)) {
      Alert.alert('Duplicate', 'This barcode already added');
      return;
    }
    setBarcodes(prev => [code, ...prev]);
    setBarcodeInput('');
  }

  function removeBarcode(b) {
    setBarcodes(prev => prev.filter(x => x !== b));
  }

  async function submitLocal() {
    if (!name.trim()) { Alert.alert('Validation', 'Name is required'); return; }
    const variants = [{ id: `v-${Date.now()}`, barcodes }];
    const payload = { name: name.trim(), price: Number(price || 0), description: desc, image: image || undefined, variants };
    try {
      const created = onCreateLocal ? onCreateLocal(payload) : null;
      onClose();
      // optionally show success
    } catch (e) {
      Alert.alert('Create failed', e.message || String(e));
    }
  }

  async function submitAPI() {
    if (!onCreateAPI) { Alert.alert('Not available', 'Server create not configured'); return; }
    if (!name.trim()) { Alert.alert('Validation', 'Name is required'); return; }
    const variants = [{ id: `v-${Date.now()}`, barcodes }];
    const payload = { name: name.trim(), price: Number(price || 0), description: desc, image: image || undefined, variants };
    try {
      await onCreateAPI(payload);
      onClose();
    } catch (e) {
      Alert.alert('API create failed', e.message || String(e));
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Product</Text>

        <TextInput placeholder="Name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput placeholder="Price" keyboardType="numeric" value={price} onChangeText={setPrice} style={styles.input} />
        <TextInput placeholder="Description" value={desc} onChangeText={setDesc} style={[styles.input, { height: 80 }]} multiline />

        <TextInput placeholder="Image URL (optional)" value={image} onChangeText={setImage} style={styles.input} />

        <View style={{ width: '100%', marginTop: 8 }}>
          <Text style={{ marginBottom: 6 }}>Variant barcodes (scanable):</Text>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <TextInput placeholder="e.g. 0123456789" value={barcodeInput} onChangeText={setBarcodeInput} style={[styles.input, { flex: 1 }]} />
            <Button title="Add" onPress={addBarcode} />
          </View>

          <View>
            {barcodes.map(b => (
              <View key={b} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ flex: 1 }}>{b}</Text>
                <TouchableOpacity onPress={() => removeBarcode(b)} style={styles.badge}>
                  <Text style={{ color: '#fff' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            {barcodes.length === 0 && <Text style={{ color: '#666' }}>No barcodes added — scanner won't find this product.</Text>}
          </View>
        </View>

        <View style={{ height: 12 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <Button title="Create (Local)" onPress={submitLocal} />
          <Button title="Create (Server)" onPress={submitAPI} />
          <Button title="Cancel" color="gray" onPress={onClose} />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 },
  badge: { backgroundColor: '#d23', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 }
});
