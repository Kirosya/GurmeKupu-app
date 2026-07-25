import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { fetchProducts, createOrder } from '../services/api';

export default function CreateOrderModal({ visible, onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Sipariş formu state'leri
  const [quantities, setQuantities] = useState({}); // { productId: "2" (string as input value) }
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');

  useEffect(() => {
    if (visible) {
      loadProducts();
      // Reset form
      setQuantities({});
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setOrderNote('');
    }
  }, [visible]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      if (data.success) {
        setProducts(data.products.filter(p => p.isAvailable));
      }
    } catch (err) {
      Alert.alert('Hata', 'Ürünler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (id, val) => {
    setQuantities(prev => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async () => {
    // Toplamı hesapla ve item'ları oluştur
    const items = [];
    for (const p of products) {
      const qtyStr = quantities[p.id];
      if (qtyStr) {
        const qty = parseFloat(qtyStr.replace(',', '.'));
        if (qty > 0) {
          items.push({
            productId: p.id,
            productName: p.name,
            quantityValue: qty,
            unitType: 'kg',
            itemTotalPrice: qty * p.pricePerKg
          });
        }
      }
    }

    if (items.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir ürün miktarı girin.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      Alert.alert('Uyarı', 'İsim, telefon ve adres zorunludur.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        customerAddress,
        orderNote,
        items
      };
      
      const res = await createOrder(payload);
      if (res.success) {
        Alert.alert('Başarılı', 'Sipariş başarıyla oluşturuldu!');
        onClose();
      } else {
        Alert.alert('Hata', res.error || 'Sipariş oluşturulamadı.');
      }
    } catch (err) {
      Alert.alert('Hata', 'Ağ hatası veya sunucu hatası.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Yeni Sipariş Oluştur</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#f5f5f4" size={24} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#fbbf24" />
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            
            <Text style={styles.sectionTitle}>Ürünler & Miktar (kg)</Text>
            
            <View style={styles.productList}>
              {products.map(p => (
                <View key={p.id} style={styles.productRow}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{p.name}</Text>
                    <Text style={styles.productPrice}>{p.pricePerKg} ₺/kg</Text>
                  </View>
                  <TextInput
                    style={styles.qtyInput}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#78716c"
                    value={quantities[p.id] || ''}
                    onChangeText={(val) => handleQuantityChange(p.id, val)}
                  />
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Teslimat Bilgileri</Text>
            
            <View style={styles.form}>
              <TextInput style={styles.input} placeholder="Müşteri Ad Soyad *" placeholderTextColor="#78716c" value={customerName} onChangeText={setCustomerName} />
              <TextInput style={styles.input} placeholder="Telefon *" placeholderTextColor="#78716c" keyboardType="phone-pad" value={customerPhone} onChangeText={setCustomerPhone} />
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Teslimat Adresi *" placeholderTextColor="#78716c" multiline value={customerAddress} onChangeText={setCustomerAddress} />
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Sipariş Notu (Opsiyonel)" placeholderTextColor="#78716c" multiline value={orderNote} onChangeText={setOrderNote} />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#0c0a09" /> : <Text style={styles.submitBtnText}>Siparişi Tamamla</Text>}
            </TouchableOpacity>
            
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#292524', backgroundColor: '#1c1917' },
  headerTitle: { color: '#fbbf24', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: '#f5f5f4', fontSize: 16, fontWeight: '900', marginBottom: 12 },
  productList: { gap: 8, backgroundColor: '#1c1917', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#292524' },
  productRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#292524', paddingVertical: 8 },
  productInfo: { flex: 1, paddingRight: 12 },
  productName: { color: '#f5f5f4', fontSize: 14, fontWeight: 'bold' },
  productPrice: { color: '#a8a29e', fontSize: 12, marginTop: 2 },
  qtyInput: { backgroundColor: '#0c0a09', borderWidth: 1, borderColor: '#44403c', borderRadius: 8, color: '#fbbf24', width: 60, height: 40, textAlign: 'center', fontWeight: 'bold' },
  form: { gap: 12 },
  input: { backgroundColor: '#1c1917', borderWidth: 1, borderColor: '#292524', borderRadius: 12, color: '#f5f5f4', paddingHorizontal: 16, paddingVertical: 12, fontSize: 14 },
  submitBtn: { backgroundColor: '#fbbf24', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitBtnText: { color: '#0c0a09', fontSize: 16, fontWeight: '900' }
});
