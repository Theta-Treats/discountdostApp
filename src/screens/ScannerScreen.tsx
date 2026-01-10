import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Platform } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit'; 
import { IconButton } from 'react-native-paper';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export default function ScannerScreen({ navigation, route }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const permission = Platform.OS === 'android' 
      ? PERMISSIONS.ANDROID.CAMERA 
      : PERMISSIONS.IOS.CAMERA;

    const result = await request(permission);
    setHasPermission(result === RESULTS.GRANTED);
  };

  const onReadCode = (event: any) => {
    if (scanned) return;
    
    // In newer versions, the data is often directly in event.nativeEvent.codeStringValue
    const data = event.nativeEvent?.codeStringValue;
    
    if (data) {
      setScanned(true);
      let couponCode = data;
      if (data.includes("/redeem/")) {
        couponCode = data.split("/redeem/")[1];
      }

      if (route.params?.onScan) {
        route.params.onScan(couponCode);
        navigation.goBack();
      }
    }
  };

  if (hasPermission === null) {
    return <View style={styles.center}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.center}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFillObject}
        // Change: scanBarcode is now 'scanBarcode' (boolean) 
        // and 'onReadCode' handles the result.
        scanBarcode={true}
        onReadCode={onReadCode}
        cameraType={CameraType.Back}
        // hideControls={true}  <-- REMOVED because it no longer exists in the new API
      />
      
      {/* Overlay UI */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}></View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        <View style={styles.unfocusedContainer}>
             <Text style={styles.scanText}>Align Coupon QR inside the box</Text>
        </View>
      </View>

      <IconButton
        icon="close-circle"
        iconColor="#FFF"
        size={40}
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  middleContainer: { flexDirection: 'row', height: 250 },
  focusedContainer: { width: 250, borderWidth: 2, borderColor: '#eb8934', backgroundColor: 'transparent', borderRadius: 20 },
  scanText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 20 },
  closeBtn: { position: 'absolute', top: 40, right: 20 },
});