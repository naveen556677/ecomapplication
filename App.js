// App.js
import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { LogBox } from 'react-native';

// ignore some noisy warnings for demo
LogBox.ignoreLogs(['Require cycle:', 'DatePickerAndroid']);

export default function App() {
  return <AppNavigator />;
}
