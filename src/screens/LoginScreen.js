import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import useStore from '../store/useStore';
import { ScannerScreen } from './ScannerScreen';

// Defensive import for Google Signin same as original
let GoogleSignin;
try {
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod && (mod.GoogleSignin ?? mod.default ?? mod);
} catch (err) {
  GoogleSignin = null;
}

const WEB_CLIENT_ID = '664954328506-941petpngfhungdiq9506j9pdohtinl9.apps.googleusercontent.com';

export default function LoginScreen({ navigation }) {
  const setUser = useStore(s => s.setUser);
  const [loading, setLoading] = useState(false);
  const [checkingSignedIn, setCheckingSignedIn] = useState(true);
  const [googleAvailable, setGoogleAvailable] = useState(Boolean(GoogleSignin));
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    if (GoogleSignin && typeof GoogleSignin.configure === 'function') {
      try {
        GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, offlineAccess: true });
      } catch (err) {
        console.warn('GoogleSignin.configure failed', err);
      }
    } else {
      setCheckingSignedIn(false);
      setGoogleAvailable(false);
      return;
    }

    (async () => {
      try {
        if (typeof GoogleSignin.isSignedIn === 'function') {
          const isSignedIn = await GoogleSignin.isSignedIn();
          if (isSignedIn) {
            let u = null;
            try {
              if (typeof GoogleSignin.signInSilently === 'function') {
                u = await GoogleSignin.signInSilently();
              } else if (typeof GoogleSignin.getCurrentUser === 'function') {
                u = await GoogleSignin.getCurrentUser();
              }
            } catch (err) {
              console.warn('silent sign-in failed', err);
            }
            if (u) {
              setUser({
                id: u.user?.id ?? u?.id ?? null,
                name: u.user?.name ?? u?.name ?? null,
                email: u.user?.email ?? u?.email ?? null,
                idToken: u.idToken ?? null,
              });
              navigation.replace('Products');
              return;
            }
          }
        } else {
          console.warn('GoogleSignin.isSignedIn not available in this build');
        }
      } catch (err) {
        console.warn('GoogleSignin check failed', err);
      } finally {
        setCheckingSignedIn(false);
      }
    })();
  }, [navigation, setUser]);

  const signInMock = async () => {
    const user = { id: 'mock1', name: 'Demo User', email: 'demo@example.com', idToken: 'MOCK_TOKEN' };
    try {
      setUser(user);
      navigation.replace('Products');
    } catch (e) {
      Alert.alert('Error', 'Unable to sign in (mock).');
    }
  };

  const signInGoogle = async () => {
    if (!GoogleSignin) {
      Alert.alert('Google Sign-In not available', 'The Google Sign-In native module is not installed or linked in this build. Use mock sign-in or install the library.');
      return;
    }
    setLoading(true);
    try {
      if (typeof GoogleSignin.hasPlayServices === 'function') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      if (typeof GoogleSignin.signIn === 'function') {
        const userInfo = await GoogleSignin.signIn();
        const payload = {
          id: userInfo.user?.id ?? userInfo.id ?? null,
          name: userInfo.user?.name ?? userInfo.name ?? null,
          email: userInfo.user?.email ?? userInfo.email ?? null,
          idToken: userInfo.idToken ?? null,
        };
        setUser(payload);
        navigation.replace('Products');
      } else {
        Alert.alert('Google Sign-In not supported', 'This build of the Google Sign-In module does not expose signIn().');
      }
    } catch (e) {
      console.error('Google sign in error', e);
      Alert.alert('Sign-in failed', (e && e.message) ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  if (checkingSignedIn) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12, color: '#666' }}>Checking sign-in...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fade }]}>
      <View style={styles.header}>
        {/* Replace with <Image /> if you have a logo file */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🛍️</Text>
        </View>
        <Text style={styles.title}>Welcome to ShopEasy</Text>
        <Text style={styles.subtitle}>Fast checkout · Barcode scanner · Secure sign-in</Text>
      </View>

      <View style={styles.card} accessible accessibilityLabel="Login options">
        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed, !googleAvailable && styles.buttonDisabled]}
          onPress={signInGoogle}
          disabled={loading || !googleAvailable}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google"
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text style={styles.googleBtnText}>Sign in with Google</Text>
              <Text style={styles.googleBtnSub}>{googleAvailable ? 'Secure & quick' : 'Module not installed'}</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          onPress={signInMock}
          accessibilityRole="button"
          accessibilityLabel="Sign in with demo account"
        >
          <Text style={styles.secondaryText}>Continue as Demo User</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.ghostButton, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('ScannerTest')}
          accessibilityRole="button"
          accessibilityLabel="Open scanner test"
        >
          <Text style={styles.ghostText}>Scanner test (dev)</Text>
        </Pressable>

        {!googleAvailable && (
          <Text style={styles.warnText} accessibilityRole="alert">
            Google Sign-In module not found. Install {'@react-native-google-signin/google-signin'} to enable real Google sign-in.
          </Text>
        )}
        
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>By continuing you accept our Terms & Privacy.</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb', padding: 20, justifyContent: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' },
  header: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  logoEmoji: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  googleBtnSub: { color: '#e6f0ff', fontSize: 12, marginTop: 4 },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e6e9ef',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryText: { color: '#111', fontWeight: '600' },
  ghostButton: { marginTop: 10, alignItems: 'center', paddingVertical: 10 },
  ghostText: { color: '#666' },
  warnText: { marginTop: 12, color: '#b00020', textAlign: 'center', fontSize: 13 },
  buttonPressed: { opacity: 0.75 },
  buttonDisabled: { opacity: 0.6, backgroundColor: '#a8c7ff' },
  footer: { marginTop: 18, alignItems: 'center' },
  footerText: { color: '#999', fontSize: 12 },
});
