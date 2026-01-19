import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = "https://api.discountdost.com/api";

const TermsScreen = ({ navigation, route }: any) => {
  const [loading, setLoading] = useState(false);
  
  // Check if we came here from a Google Login that requires terms
  const isNewGoogleUser = route.params?.isNewGoogleUser;

  const handleAcceptTerms = async () => {
    try {
      setLoading(true);
      const merchantId = await AsyncStorage.getItem('merchantId');

      if (!merchantId) {
        Alert.alert("Error", "Session expired. Please login again.");
        navigation.goBack();
        return;
      }

      // Call your existing backend route
      const res = await axios.post(`${API_BASE}/merchant/accept-terms`, {
        merchantId: merchantId
      });

      if (res.data.success) {
        // Terms accepted! Now send them to the Dashboard
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      }
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.error || "Could not accept terms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 1. The Terms Content */}
      <WebView 
        source={{ uri: 'https://discountdost.com/merchant-terms' }} 
        style={{ flex: 1 }} 
      />

      {/* 2. The Accept Action (Only show if we need to track acceptance) */}
      <View style={styles.footer}>
        <Text style={styles.footerNote}>
          By clicking accept, you agree to the Merchant Terms of Service.
        </Text>
        
        <TouchableOpacity 
          style={[styles.acceptBtn, loading && { backgroundColor: '#ccc' }]} 
          onPress={handleAcceptTerms}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.acceptBtnText}>I Accept the Terms</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ marginTop: 10 }}
        >
          <Text style={{ color: '#ef4444' }}>Decline & Exit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  footerNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  acceptBtn: {
    backgroundColor: '#FF9800',
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TermsScreen;