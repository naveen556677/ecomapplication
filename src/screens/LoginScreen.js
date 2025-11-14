// src/screens/LoginScreen.js

import React, { useEffect, useState } from 'react';
import { View, Button, Text, ActivityIndicator, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import useStore from '../store/useStore';

export default function LoginScreen({ navigation }) {
  const setUser = useStore(s => s.setUser);
  const logout = useStore(s => s.logout);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // configure GoogleSignIn only if you will use it.
    // Replace webClientId with your OAuth client id.
    GoogleSignin.configure({
      webClientId: '620532521298-ds9l33j8e1t2dffq5uimqpjmf5cc9tco.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  }, []);

  const signInMock = async () => {
    // Mock login (useful in local dev)
    const mockUser = { id: 'mock1', name: 'Demo User', email: 'demo@example.com', idToken: 'MOCK_TOKEN' };
    setUser(mockUser);
    navigation.replace('Products');
  };

  const signInGoogle = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      // userInfo contains idToken, user object etc.
      setUser({ id: userInfo.user?.id, email: userInfo.user?.email, idToken: userInfo.idToken, raw: userInfo });
      navigation.replace('Products');
    } catch (e) {
      console.error('Google sign in failed', e);
      Alert.alert('Sign in failed', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const doLogout = () => {
    logout();
    Alert.alert('Logged out');
  };

  return (
    <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:16 }}>
      <Text style={{ fontSize:18, marginBottom:16 }}>Welcome — please sign in</Text>
      <Button title="Sign in (Mock)" onPress={signInMock} />
      <View style={{ height:12 }} />
      <Button title="Sign in with Google" onPress={signInGoogle} />
      <View style={{ height:12 }} />
      <Button title="Logout (clear)" color="red" onPress={doLogout} />
      {loading && <ActivityIndicator style={{ marginTop:12 }} />}
      <View style={{ marginTop:16 }}>
        <Text style={{ color:'#666', fontSize:12 }}>Tip: If you don't configure Google, use Mock sign-in.</Text>
      </View>
    </View>
  );
}

