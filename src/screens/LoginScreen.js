import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ShieldCheck, Lock } from 'lucide-react-native';

export default function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    if (password === 'gurme123') {
      setTimeout(() => onLogin(), 500);
    } else {
      setTimeout(() => {
        setError('Hatalı şifre. Lütfen tekrar deneyiniz.');
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <ShieldCheck color="#0c0a09" size={32} strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>Gurme Küpü Yönetici</Text>
        <Text style={styles.subtitle}>Siparişleri ve ürün fiyatlarını yönetmek için giriş yapınız.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Lock color="#f59e0b" size={14} />
            <Text style={styles.label}>Yönetici Şifresi</Text>
          </View>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              setError('');
            }}
            placeholder="Şifre (varsayılan: gurme123)"
            placeholderTextColor="#78716c"
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin} 
          disabled={isLoading || password.length === 0}
        >
          {isLoading ? (
            <ActivityIndicator color="#0c0a09" />
          ) : (
            <Text style={styles.buttonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0a09',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1c1917',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#292524',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#f5f5f4',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: '#fbbf24',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  errorBox: {
    backgroundColor: 'rgba(153, 27, 27, 0.5)',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    padding: 10,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  label: {
    color: '#d6d3d1',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0c0a09',
    borderWidth: 1,
    borderColor: '#292524',
    borderRadius: 14,
    padding: 14,
    color: '#f5f5f4',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#fbbf24',
    width: '100%',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    opacity: 0.9,
  },
  buttonText: {
    color: '#0c0a09',
    fontWeight: '900',
    fontSize: 14,
  },
});
