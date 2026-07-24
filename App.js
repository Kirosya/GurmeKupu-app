import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { WebView } from 'react-native-webview';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const DEFAULT_SERVER_URL = 'http://192.168.1.100:3000'; // Varsayılan IP / Domain

export default function App() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_SERVER_URL);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        sendTokenToServer(token, serverUrl);
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      Alert.alert(
        '🔔 YENİ GURME SİPARİŞİ!',
        `${notification.request.content.title}\n${notification.request.content.body}`,
        [{ text: 'Siparişi Gör', onPress: () => webViewRef.current?.reload() }]
      );
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(() => {
      webViewRef.current?.reload();
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [serverUrl]);

  const sendTokenToServer = async (token, targetUrl) => {
    try {
      const cleanUrl = targetUrl.replace(/\/$/, '');
      await fetch(`${cleanUrl}/api/push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      console.log('Push token sunucuya iletildi.');
    } catch (err) {
      console.log('Push token gönderme hatası:', err.message);
    }
  };

  const handleSaveUrl = () => {
    let formatted = inputUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `http://${formatted}`;
    }
    setServerUrl(formatted);
    setIsUrlModalOpen(false);
    setHasError(false);
    if (expoPushToken) {
      sendTokenToServer(expoPushToken, formatted);
    }
  };

  const getAdminUrl = () => {
    const cleanUrl = serverUrl.replace(/\/$/, '');
    return cleanUrl.endsWith('/admin') ? cleanUrl : `${cleanUrl}/admin`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#0c0a09" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerTitleGroup} onPress={() => setIsUrlModalOpen(true)}>
          <Text style={styles.headerTitle}>GURME KÜPÜ ⚙️</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {serverUrl}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.urlBtn} onPress={() => setIsUrlModalOpen(true)}>
            <Text style={styles.btnText}>🌐 Adres</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshBtn} onPress={() => { setHasError(false); webViewRef.current?.reload(); }}>
            <Text style={styles.btnText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main WebView */}
      <View style={styles.content}>
        {hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>⚠️ Sunucuya Bağlanılamadı</Text>
            <Text style={styles.errorText}>
              Girdiğiniz sunucu adresi ({serverUrl}) erişilemiyor.{'\n\n'}
              Lütfen bilgisayarınızın yerel IP adresini veya canlı Vercel/Domain adresini giriniz.
            </Text>
            
            <TouchableOpacity style={styles.changeUrlBtn} onPress={() => setIsUrlModalOpen(true)}>
              <Text style={styles.changeUrlBtnText}>Sunucu Adresini Değiştir</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: getAdminUrl() }}
            style={{ flex: 1, backgroundColor: '#0c0a09' }}
            startInLoadingState={true}
            onError={() => setHasError(true)}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#d97706" />
                <Text style={styles.loadingText}>Sipariş Takip Paneli Yükleniyor...</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Sunucu Adresi Değiştirme Modalı */}
      <Modal visible={isUrlModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sunucu Adresini Ayarla</Text>
            <Text style={styles.modalSub}>
              Bilgisayarınızın yerel IP adresini (örn: 192.168.1.35:3000) veya canlı domain adresini giriniz:
            </Text>

            <TextInput
              style={styles.input}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.168.1.X:3000"
              placeholderTextColor="#78716c"
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsUrlModalOpen(false)}>
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveUrl}>
                <Text style={styles.saveBtnText}>Kaydet ve Yükle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
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
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    color: '#fbbf24',
    fontSize: 15,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#a8a29e',
    fontSize: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urlBtn: {
    backgroundColor: '#292524',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  refreshBtn: {
    backgroundColor: '#292524',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  btnText: {
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
    top: 0, bottom: 0, left: 0, right: 0,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0c0a09',
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorText: {
    color: '#a8a29e',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  changeUrlBtn: {
    backgroundColor: '#d97706',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  changeUrlBtnText: {
    color: '#0c0a09',
    fontWeight: '900',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1c1917',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#44403c',
  },
  modalTitle: {
    color: '#f5f5f4',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  modalSub: {
    color: '#a8a29e',
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#0c0a09',
    borderWidth: 1,
    borderColor: '#44403c',
    borderRadius: 12,
    padding: 12,
    color: '#f5f5f4',
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#292524',
  },
  cancelBtnText: {
    color: '#a8a29e',
    fontWeight: '700',
    fontSize: 12,
  },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#d97706',
  },
  saveBtnText: {
    color: '#0c0a09',
    fontWeight: '900',
    fontSize: 12,
  },
});
