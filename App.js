import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { WebView } from 'react-native-webview';

// Bildirimlerin hem ön planda hem arka planda sesli/titreşimli çalması için yapılandırma
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// SUNUCU ADRESİ (Geliştirme için local, canlı yayın için domain)
const SERVER_URL = 'http://10.0.2.2:3000'; // Android emulator için localhost karşılığı, iOS/gerçek cihazda ip adresi kullanılır

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(SERVER_URL);
  const [activeView, setActiveView] = useState('admin'); // 'admin' | 'status'
  const webViewRef = useRef(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        sendTokenToServer(token);
      }
    });

    // Bildirim Dinleyicileri
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      Alert.alert(
        '🔔 YENİ GURME SİPARİŞİ!',
        `${notification.request.content.title}\n${notification.request.content.body}`,
        [{ text: 'Siparişi İncele', onPress: () => webViewRef.current?.reload() }]
      );
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Bildirime tıklandı:', response);
      webViewRef.current?.reload();
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  const sendTokenToServer = async (token) => {
    try {
      await fetch(`${serverUrlInput}/api/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      console.log('Push token sunucuya gönderildi.');
    } catch (err) {
      console.log('Push token gönderme hatası:', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#0c0a09" />
      
      {/* Üst Yönetici Başlığı */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <Text style={styles.headerTitle}>GURME KÜPÜ</Text>
          <Text style={styles.headerSubtitle}>Mobil Yönetici & Bildirim</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => webViewRef.current?.reload()}
        >
          <Text style={styles.refreshBtnText}>🔄 Yenile</Text>
        </TouchableOpacity>
      </View>

      {/* Ana Ekran WebView (Sipariş Takip & Ürün Yönetimi) */}
      <View style={styles.content}>
        <WebView
          ref={webViewRef}
          source={{ uri: `${serverUrlInput}/admin` }}
          style={{ flex: 1, backgroundColor: '#0c0a09' }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#d97706" />
              <Text style={styles.loadingText}>Yönetici Paneli Yükleniyor...</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Gurme Küpü Sipariş Bildirimleri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D97706',
      sound: 'default',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Push notification izni verilmedi.');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token:', token);
  } else {
    console.log('Mobil Push Bildirimleri için fiziksel bir cihaz önerilir.');
  }

  return token;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0a09',
    paddingTop: Platform.OS === 'android' ? 35 : 0,
  },
  header: {
    height: 56,
    backgroundColor: '#1c1917',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#292524',
  },
  headerTitleGroup: {
    flexDirection: 'column',
  },
  headerTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#a8a29e',
    fontSize: 10,
    fontWeight: '500',
  },
  refreshBtn: {
    backgroundColor: '#292524',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  refreshBtnText: {
    color: '#f5f5f4',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#0c0a09',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0c0a09',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
  },
});
