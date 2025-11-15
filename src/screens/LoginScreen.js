
// src/screens/LoginScreen.js
import React, { useEffect, useState } from 'react';
import { View, Button, Text, ActivityIndicator, Alert } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import useStore from '../store/useStore';

export default function LoginScreen({ navigation }) {
  const setUser = useStore(s => s.setUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set your webClientId after creating OAuth client in Google Console
    GoogleSignin.configure({
      webClientId: '664954328506-941petpngfhungdiq9506j9pdohtinl9.apps.googleusercontent.com',
      offlineAccess: true
    });
  }, []);

  const signInMock = async () => {
    const user = { id: 'mock1', name: 'Demo User', email: 'demo@example.com', idToken: 'MOCK_TOKEN' };
    setUser(user);
    navigation.replace('Products');
  };

  const signInGoogle = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      setUser({ id: userInfo.user?.id, email: userInfo.user?.email, idToken: userInfo.idToken });
      navigation.replace('Products');
    } catch (e) {
      console.error(e);
      Alert.alert('Sign-in failed', e.message || String(e));
    } finally { setLoading(false); }
  };

  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:16}}>
      <Text style={{fontSize:18, marginBottom:12}}>Welcome</Text>
      <Button title="Sign in (Mock)" onPress={signInMock} />
      <View style={{height:12}}/>
      <Button title="Sign in with Google" onPress={signInGoogle}/>
      {loading && <ActivityIndicator style={{marginTop:12}} />}
    </View>
  );
}
