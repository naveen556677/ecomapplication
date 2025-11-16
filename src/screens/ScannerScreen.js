import React, { useEffect, useState } from "react";
import { Alert, Dimensions, StyleSheet, ToastAndroid, TouchableOpacity, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
  useCameraPermission,
} from "react-native-vision-camera";
import { useProductsStore } from "../store/productsStore";
import { findProductByBarcode } from "../utils/matchBarcode";
import { useNavigation } from "@react-navigation/native";
import useStore from "../store/useStore";
import { Text } from "react-native-gesture-handler";

export const ScannerScreen = ({ setScanner }) => {
  const [isScannerOpened, setIsScannerOpened] = useState(false);
  const [scanned, setScanned] = useState(false);
  const items = useProductsStore((s) => s?.items || []);
  const addScan = useStore((s) => s?.addScan);
  const navigation = useNavigation()

  // permission hook (your original hook)
  const { hasPermission, requestPermission } = useCameraPermission();

  // device (may be undefined while resolving)
  const device = useCameraDevice("back");

  // code scanner hook: adjust options to your needs
  const codeScanner = useCodeScanner({
    codeTypes: ["code-128", "code-39", "code-93", "codabar"],
    onCodeScanned: (codes) => {
      if (scanned) return;
      const value = codes?.[0]?.value ?? null;
      if (!value) return;
      const matchedProduct = findProductByBarcode(items, value);
      console.log(matchedProduct, "matched product")
      console.log(addScan)
      addScan(matchedProduct?.product)
      navigation.navigate('ProductDetails', { product: matchedProduct?.product })
      setScanned(true);
      setIsScannerOpened(false);

      // safe Toast call only on Android
      if (ToastAndroid && ToastAndroid.show) {
        ToastAndroid.show("Product Scanned", ToastAndroid.SHORT);
      } else {
        // fallback for other platforms
        Alert.alert("Scanned", value);
      }
    },
  });

  // Request permission once when component mounts or when hasPermission changes
  useEffect(() => {
    let cancelled = false;

    const ensurePermission = async () => {
      try {
        // requestPermission may return boolean or a status string like "authorized"
        const result = await requestPermission();
        console.log(result)
        const granted =
          result === true || result === "authorized" || result === "granted";

        if (!cancelled && granted) {
          setIsScannerOpened(true);
          if (ToastAndroid && ToastAndroid.show) {
            ToastAndroid.show("Permission granted", ToastAndroid.SHORT);
          }
        } else if (!cancelled && !granted) {
          // optional: show a friendly message once
          // do not repeatedly alert the user on every render
          // Alert.alert("Camera permission", "Permission not granted");
        }
      } catch (err) {
        console.warn("Permission request error:", err);
      }
    };

    // Only request when we know we don't have permission yet.
    console.log(hasPermission)
    if (!hasPermission) {
      ensurePermission();
    }

    return () => {
      cancelled = true;
    };
  }, [hasPermission, isScannerOpened]);

  // Button handler to re-open scanner and reset scanned flag
  useEffect(() => {
    const openScanner = async () => {
      // try to request permission again if needed
      try {

        const result = await requestPermission();
        console.log("Scanner", result)
        const granted =
          result === true || result === "authorized" || result === "granted";

        if (granted) {
          setScanned(false);
          setIsScannerOpened(true);
        } else {
          Alert.alert("Permission required", "Camera permission is required to scan codes.");
        }
      } catch (err) {
        console.warn("Error requesting permission:", err);
      }
    }
    openScanner()
  }, [hasPermission])


  return (
    <>
      {isScannerOpened && device && (
        <View style={styles.container}>
          {/* 
            The Vision Camera accepts whatever frameProcessor / codeScanner you provided.
            isActive toggles camera processing; we stop it when scanned === true
          */}
          <Camera
            device={device}
            isActive={!scanned}
            /* older/newer versions use frameProcessor: codeScanner.frameProcessor
               but your original used codeScanner prop; if your version expects
               `frameProcessor`, switch to frameProcessor={codeScanner.frameProcessor} */
            codeScanner={codeScanner}
            style={StyleSheet.absoluteFill}
          />

          <TouchableOpacity onPress={() => setScanner(false)} style={{ backgroundColor: 'white', width: 70, height: 70, position: 'absolute', bottom: '20', left: Dimensions.get('screen').width * 0.427, borderRadius: '100%', justifyContent: 'center', alignItems: 'center', zIndex : 1 }}>
            <Text style={{ textAlign: 'center', fontSize: 25, fontWeight: 'bold' }}>
              X
            </Text>
          </TouchableOpacity>

          <View style={{ width: Dimensions.get('screen').width * 0.15, height: Dimensions.get('screen').height, backgroundColor: 'rgba(0, 0, 0, 0.16)', position: 'absolute', left: 0 }} />
          <View style={{ width: Dimensions.get('screen').width - (Dimensions.get('screen').width * 0.15) * 2, height: Dimensions.get('screen').height * 0.3, backgroundColor: 'rgba(0, 0, 0, 0.16)', position: 'absolute', top: 0, left: (Dimensions.get('screen').width * 0.15) }} />

          <View style={{ ...StyleSheet.absoluteFill }}>
            <View style={styles.overlay}>
              <Text style={styles.scanText}>Scan Barcode</Text>
            </View>
          </View>
          <View style={{ width: Dimensions.get('screen').width - (Dimensions.get('screen').width * 0.15) * 2, height: Dimensions.get('screen').height * 0.3, backgroundColor: 'rgba(0, 0, 0, 0.16)', position: 'absolute', bottom: 0, left: (Dimensions.get('screen').width * 0.15) }} />
          <View style={{ width: Dimensions.get('screen').width * 0.15, height: Dimensions.get('screen').height, backgroundColor: 'rgba(0, 0, 0, 0.16)', position: 'absolute', right: 0 }} />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
      position: 'absolute',
      top: 50,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.89)',
      padding: 10,
      borderRadius: 8,
    },
    scanText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    }
});
