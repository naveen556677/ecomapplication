import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, ToastAndroid, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
  useCameraPermission,
} from "react-native-vision-camera";

export const ScannerScreen = () => {
  const [isScannerOpened, setIsScannerOpened] = useState(false);
  const [scanned, setScanned] = useState(false);

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

      setScanned(true);
      setIsScannerOpened(false);

      // safe Toast call only on Android
      if (ToastAndroid && ToastAndroid.show) {
        ToastAndroid.show(value, ToastAndroid.SHORT);
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
        console .log(result)
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
            {...(codeScanner.frameProcessor ? { frameProcessor: codeScanner.frameProcessor } : {})}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill
  },
});
