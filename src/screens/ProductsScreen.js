import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Switch, Alert } from 'react-native';
import { fetchProducts, updateProducts } from '../services/api';
import { Utensils } from 'lucide-react-native';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchProducts();
      if (data.success) setProducts(data.products || []);
    } catch (err) {
      console.log('Error fetching products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = (id) => {
    const newProds = products.map(p => p.id === id ? { ...p, isAvailable: !p.isAvailable } : p);
    setProducts(newProds);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProducts(products);
      Alert.alert('Başarılı', 'Ürün stok durumları kaydedildi.');
    } catch (err) {
      Alert.alert('Hata', 'Ürünler güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.infoCol}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.cat}>{item.category}</Text>
        <Text style={styles.price}>{item.pricePerKg} TL / kg</Text>
      </View>
      <View style={styles.actionCol}>
        <Text style={[styles.statusText, { color: item.isAvailable ? '#10b981' : '#ef4444' }]}>
          {item.isAvailable ? 'Satışta' : 'Tükendi'}
        </Text>
        <Switch
          trackColor={{ false: '#44403c', true: '#059669' }}
          thumbColor={item.isAvailable ? '#10b981' : '#a8a29e'}
          value={item.isAvailable}
          onValueChange={() => handleToggle(item.id)}
        />
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#fbbf24" />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Utensils size={48} color="#44403c" />
            <Text style={styles.emptyText}>Ürün bulunamadı.</Text>
          </View>
        }
      />
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#0c0a09" /> : <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c0a09' },
  listContent: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: '#1c1917',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292524',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCol: { flex: 1 },
  name: { color: '#f5f5f4', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cat: { color: '#fbbf24', fontSize: 11, marginBottom: 4, textTransform: 'uppercase' },
  price: { color: '#a8a29e', fontSize: 13 },
  actionCol: { alignItems: 'flex-end', gap: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyText: { color: '#78716c', fontSize: 14 },
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 16,
    backgroundColor: 'rgba(12, 10, 9, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#292524',
  },
  saveBtn: {
    backgroundColor: '#fbbf24',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#0c0a09', fontSize: 15, fontWeight: 'bold' },
});
