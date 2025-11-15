import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import ProductsListScreen from '../screens/ProductsListScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CartScreen from '../screens/CartScreen';
// import ScannerScreen from '../screens/ScannerScreen';
// import ScannerTestScreen from '../screens/ScannerTestScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Products" component={ProductsListScreen}  options={{
        headerShown:false
      }} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="Cart" component={CartScreen}  options={{
        headerShown:false
      }} />
      {/* <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="ScannerTest" component={ScannerTestScreen} /> */}
    </Stack.Navigator>
  );
}
