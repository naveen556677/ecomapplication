/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import { useEffect } from 'react';
import { Alert, Pressable, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "620532521298-ds9l33j8e1t2dffq5uimqpjmf5cc9tco.apps.googleusercontent.com", 
      offlineAccess: true
    });
  }, [])

  

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
const GoogleSingUp = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn().then(result => { Alert.alert(JSON.stringify(result)) });
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        Alert.alert('User cancelled the login flow !');
      } else if (error.code === statusCodes.IN_PROGRESS) {
       Alert.alert('Signin in progress');
        // operation (f.e. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
         Alert.alert('Google play services not available or outdated !');
        // play services not available or outdated
      } else {
        console.log(error)
      }
    }
  };
  return (
    <View style={styles.container}>
    <Pressable onPress={GoogleSingUp}><Text>google sign in</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems:'center',
    justifyContent:"center"
  },
});

export default App;
