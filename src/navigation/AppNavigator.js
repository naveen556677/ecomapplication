import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import ProductsListScreen from '../screens/ProductsListScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CartScreen from '../screens/CartScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import ScanHistoryScreen from '../screens/ScanHistoryScreen';
import {SplashScreen} from '../screens/SplashScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="splash">
      <Stack.Screen name="Login" component={LoginScreen} options={{
        headerShown: false
      }} />
      <Stack.Screen name="Products" component={ProductsListScreen} options={{
        headerShown: false
      }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen}  />
      <Stack.Screen name="Cart" component={CartScreen} options={{
        headerShown: false
      }} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} options={{
        headerShown: false
      }} />
      <Stack.Screen name="splash" component={SplashScreen} options={{
        headerShown: false
      }} />
    </Stack.Navigator>
  );
}
