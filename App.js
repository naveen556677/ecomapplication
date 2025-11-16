import React from 'react';
import { StatusBar, LogBox, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';

// ignore some noisy warnings during development (optional)
LogBox.ignoreLogs([
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        {/* Global StatusBar */}
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor="lightgrey"
        />
        <SafeAreaView style={{flex : 1}}>
          <AppNavigator />
        </SafeAreaView>

      </NavigationContainer>
    </GestureHandlerRootView>
  );
}