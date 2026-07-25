import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { fetchOrders, updateOrderStatus } from '../services/api';
import { ShoppingBag, CheckCircle, Clock } from 'lucide-react-native';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchOrders();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.log('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleMarkDelivered = async (orderId) => {
    Alert.alert('Teslim Edildi', 'Bu siparişi teslim edildi olarak işaretlemek istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { 
        text: 'Evet, İşaretle', 
        onPress: async () => {
          setUpdatingId(orderId);
          try {
            await updateOrderStatus(orderId, 'DELIVERED');
            await loadData();
          } catch (error) {
            Alert.alert('Hata', 'Sipariş güncellenemedi.');
          } finally {
            setUpdatingId(null);
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    const isPending = item.status === 'PENDING';
    const totalAmount = item.items.reduce((sum, p) => sum + (p.itemTotalPrice || 0), 0);

    return (
      <View style={[styles.card, !isPending && styles.cardDelivered]}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>#{item.id}</Text>
          <View style={[styles.badge, isPending ? styles.badgePending : styles.badgeDelivered]}>
            {isPending ? <Clock size={12} color="#b45309" /> : <CheckCircle size={12} color="#166534" />}
            <Text style={[styles.badgeText, isPending ? styles.badgeTextPending : styles.badgeTextDelivered]}>
              {isPending ? 'Bekliyor' : 'Teslim Edildi'}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName}>{item.customerName}</Text>
        <Text style={styles.customerPhone}>{item.customerPhone}</Text>
        <Text style={styles.customerAddress}>{item.customerAddress}</Text>

        {item.orderNote ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>📝 {item.orderNote}</Text>
          </View>
        ) : null}

        <View style={styles.itemsContainer}>
          {item.items.map((prod, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName}>• {prod.productName}</Text>
              <Text style={styles.itemQuantity}>{prod.quantityValue || prod.quantity} {prod.unitType || prod.unit || 'kg'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.totalPrice}>{totalAmount} TL</Text>
          
          {isPending && (
            <TouchableOpacity 
              style={styles.actionBtn} 
              onPress={() => handleMarkDelivered(item.id)}
              disabled={updatingId === item.id}
            >
              {updatingId === item.id ? (
                <ActivityIndicator color="#0c0a09" size="small" />
              ) : (
                <Text style={styles.actionBtnText}>Teslim Edildi Yap</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading && !refreshing && orders.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  const sortedOrders = [...orders].sort((a, b) => {
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedOrders}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#fbbf24" />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <ShoppingBag size={48} color="#44403c" />
            <Text style={styles.emptyText}>Henüz sipariş yok.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c0a09' },
  listContent: { padding: 16, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#1c1917',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#292524',
  },
  cardDelivered: {
    opacity: 0.6,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { color: '#fbbf24', fontWeight: '900', fontSize: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgePending: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' },
  badgeTextPending: { color: '#b45309', fontSize: 10, fontWeight: '800' },
  badgeDelivered: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#bbf7d0' },
  badgeTextDelivered: { color: '#166534', fontSize: 10, fontWeight: '800' },
  customerName: { color: '#f5f5f4', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  customerPhone: { color: '#a8a29e', fontSize: 13, marginBottom: 2 },
  customerAddress: { color: '#78716c', fontSize: 12, marginBottom: 12 },
  noteBox: { backgroundColor: '#292524', padding: 10, borderRadius: 8, marginBottom: 12 },
  noteText: { color: '#fbbf24', fontSize: 12, fontStyle: 'italic' },
  itemsContainer: { backgroundColor: '#0c0a09', borderRadius: 8, padding: 10, marginBottom: 16 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { color: '#d6d3d1', fontSize: 13 },
  itemQuantity: { color: '#fbbf24', fontSize: 13, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#292524', paddingTop: 12 },
  totalPrice: { color: '#f5f5f4', fontSize: 20, fontWeight: '900' },
  actionBtn: { backgroundColor: '#fbbf24', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#0c0a09', fontSize: 13, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', marginTop: 100, gap: 12 },
  emptyText: { color: '#78716c', fontSize: 14 },
});
