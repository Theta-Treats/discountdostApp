import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import axios from 'axios';

const API_BASE = "https://api.discountdost.com/api";

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- STEP 1: SEND OTP ---
  const handleSendOtp = async () => {
    if (!mobile || mobile.length < 10) {
      return Alert.alert("Error", "Please enter a valid mobile number");
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/merchant/forgot-password/send-otp`, { mobile });
      if (res.data.success) {
        Alert.alert("Success", "OTP sent to your mobile.");
        setStep(2);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "User not found or failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 2: VERIFY OTP ---
  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert("Error", "Please enter the OTP");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/merchant/forgot-password/verify-otp`, { mobile, otp });
      if (res.data.success) {
        setStep(3);
      }
    } catch (err: any) {
      Alert.alert("Error", "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 3: RESET PASSWORD ---
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters");
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/merchant/forgot-password/reset-password`, { 
        mobile, 
        newPassword 
      });
      if (res.data.success) {
        Alert.alert("Success", "Password reset successful! Please login.", [
          { text: "Login Now", onPress: () => navigation.navigate('Login') }
        ]);
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      
      {step === 1 && (
        <>
          <Text style={styles.subtitle}>Enter your registered mobile number to receive an OTP.</Text>
          <TextInput
            label="Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleSendOtp} loading={loading} style={styles.button}>
            Send OTP
          </Button>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.subtitle}>Enter the 6-digit OTP sent to {mobile}</Text>
          <TextInput
            label="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
          <Button mode="contained" onPress={handleVerifyOtp} loading={loading} style={styles.button}>
            Verify OTP
          </Button>
          <Button onPress={() => setStep(1)} style={styles.backBtn}>Change Mobile Number</Button>
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.subtitle}>Create a strong new password for your account.</Text>
          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
            style={styles.input}
          />
          <Button mode="contained" onPress={handleResetPassword} loading={loading} style={styles.button}>
            Update Password
          </Button>
        </>
      )}

      {step !== 3 && (
        <Button onPress={() => navigation.goBack()} style={styles.backBtn}>
          Back to Login
        </Button>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 25, backgroundColor: '#fff', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 30, textAlign: 'center', lineHeight: 20 },
  input: { marginBottom: 20 },
  button: { backgroundColor: '#FF9800', paddingVertical: 5 },
  backBtn: { marginTop: 15 }
});

export default ForgotPasswordScreen;