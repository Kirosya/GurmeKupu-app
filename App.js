import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { ShoppingBag, Utensils, LogOut, Plus } from 'lucide-react-native';

import LoginScreen from './src/screens/LoginScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import CreateOrderModal from './src/components/CreateOrderModal';
import { registerPushToken } from './src/services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setupPushNotifications();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const val = await AsyncStorage.getItem('gurmekupu_auth');
      if (val === 'true') {
        setIsAuthenticated(true);
      }
    } catch (e) {
      // error loading auth
    } finally {
      setIsReady(true);
    }
  };

  const handleLogin = async () => {
    setIsAuthenticated(true);
    await AsyncStorage.setItem('gurmekupu_auth', 'true');
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    await AsyncStorage.removeItem('gurmekupu_auth');
  };

  const setupPushNotifications = async () => {
    if (!Device.isDevice) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Sipariş Bildirimleri',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#fbbf24',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus === 'granted') {
      try {
        // getDevicePushTokenAsync() gets the FCM token directly, bypassing Expo!
        const tokenData = await Notifications.getDevicePushTokenAsync();
        if (tokenData && tokenData.data) {
          await registerPushToken(tokenData.data);
          console.log('FCM Token kaydedildi:', tokenData.data);
        }
      } catch (err) {
        console.log('Push token alınamadı (Google Services eksik olabilir):', err.message);
      }
    }
  };

  if (!isReady) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fbbf24" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#0c0a09" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View>
            <Text style={styles.headerTitle}>GURME KÜPÜ</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity 
            style={[styles.logoutBtn, { backgroundColor: '#fbbf24', borderColor: '#d97706', paddingHorizontal: 12, flexDirection: 'row', gap: 4, alignItems: 'center' }]} 
            onPress={() => setIsOrderModalVisible(true)}
          >
            <Plus size={16} color="#0c0a09" />
            <Text style={{ color: '#0c0a09', fontSize: 12, fontWeight: 'bold' }}>Sipariş</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'orders' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('orders')}
        >
          <ShoppingBag size={18} color={activeTab === 'orders' ? '#0c0a09' : '#a8a29e'} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>Siparişler</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'products' && styles.tabBtnActive]} 
          onPress={() => setActiveTab('products')}
        >
          <Utensils size={18} color={activeTab === 'products' ? '#0c0a09' : '#a8a29e'} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>Menü</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'orders' ? <OrdersScreen /> : <ProductsScreen />}
      </View>

      <CreateOrderModal 
        visible={isOrderModalVisible} 
        onClose={() => setIsOrderModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0a09', paddingTop: Platform.OS === 'android' ? 35 : 0 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0c0a09' },
  header: {
    height: 60,
    backgroundColor: '#1c1917',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fbbf24', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#f5f5f4', fontSize: 16, fontWeight: '900' },
  headerSubtitle: { color: '#fbbf24', fontSize: 10 },
  logoutBtn: { padding: 8, backgroundColor: '#292524', borderRadius: 8, borderWidth: 1, borderColor: '#44403c' },
  tabBar: { flexDirection: 'row', backgroundColor: '#1c1917', padding: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#292524' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, backgroundColor: '#0c0a09', borderWidth: 1, borderColor: '#292524' },
  tabBtnActive: { backgroundColor: '#fbbf24', borderColor: '#d97706' },
  tabText: { color: '#a8a29e', fontSize: 13, fontWeight: 'bold' },
  tabTextActive: { color: '#0c0a09', fontWeight: '900' },
  content: { flex: 1 },
});
