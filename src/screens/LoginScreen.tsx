import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, ScrollView, Image } from 'react-native';
import { TextInput, Button, Text, Checkbox, HelperText } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const API_BASE = "https://api.discountdost.com/api";

const LoginScreen = ({ navigation }: any) => {
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    email: '',
    password: '',
    businessName: '',
    ownerName: '',
    mobile: '',
  });

  // OTP State
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      // IMPORTANT: Use your existing WEB Client ID here
      webClientId: '419499731991-32au01h15f7o8jltocivs4hdhlts6pis.apps.googleusercontent.com', 
      offlineAccess: true,
    });
    GoogleSignin.signOut();
  }, []);

  // --- GOOGLE LOGIN LOGIC ---
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) {
        Alert.alert("Error", "Could not retrieve ID Token from Google");
        return;
      }

      // Updated path to match your backend: /api/merchant/auth/google
      const res = await axios.post(`${API_BASE}/merchant/auth/google`, {
        token: idToken,
      });

      if (res.data.success) {
        setLoading(false);
        console.log("Google Login Success! Merchant ID:", res.data.merchant.merchantId);
        await AsyncStorage.setItem('merchantToken', res.data.token);
        await AsyncStorage.setItem('merchantId', String(res.data.merchant.merchantId));
        
        // Navigation Reset with small delay
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          });
        }, 100);
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Google Error", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // --- API: LOGIN ---
  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/merchant/login`, {
        email: form.email,
        password: form.password
      });

      if (res.data.token) {
        setLoading(false);
        console.log("Manual Login Success!");
        await AsyncStorage.setItem('merchantToken', res.data.token);
        // Note: checking both possible locations for ID just in case
        const mId = res.data.merchant?.merchantId || res.data.merchantId;
        await AsyncStorage.setItem('merchantId', String(mId));
        
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          });
        }, 100);
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!otpVerified) {
      Alert.alert("Error", "Please verify your mobile number with OTP first");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Error", "Please accept the Terms & Conditions");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/merchant/signup`, {
        businessName: form.businessName,
        ownerName: form.ownerName,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
      });

      if (res.data.token) {
        setLoading(false);
        console.log("Signup Success! New ID:", res.data.merchantId);
        await AsyncStorage.setItem('merchantToken', res.data.token);
        await AsyncStorage.setItem('merchantId', String(res.data.merchantId));
        
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          });
        }, 100);
      }
    } catch (err: any) {
      Alert.alert('Signup Failed', err.response?.data?.error || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  // ... (keep sendOtp and verifyOtp logic from previous version) ...
  // --- SIGNUP OTP LOGIC ---
  const sendSignupOtp = async () => {
    if (!form.mobile || form.mobile.length < 10) {
      return Alert.alert("Error", "Enter a valid 10-digit mobile number");
    }
    setOtpLoading(true);
    try {
      // Note: Using the merchant-specific signup otp path
      const res = await axios.post(`${API_BASE}/merchant/send-otp`, { mobile: form.mobile });
      if (res.data.success) {
        setOtpSent(true);
        Alert.alert("Success", "OTP sent to " + form.mobile);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const verifySignupOtp = async () => {
    if (!otp) return Alert.alert("Error", "Enter the 6-digit OTP");
    setOtpLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/merchant/verify-otp`, { 
        mobile: form.mobile, 
        otp: otp 
      });
      if (res.data.success) {
        setOtpVerified(true);
        Alert.alert("Success", "Mobile number verified!");
      }
    } catch (err: any) {
      Alert.alert("Error", "Invalid OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/DDLOGO.jpg')} 
          style={styles.logoImage} 
        />
      </View>

      <Text style={styles.subtitle}>{isSignup ? 'Merchant Registration' : 'Merchant Sign In'}</Text>

      {isSignup && (
        <>
          <TextInput label="Business Name" value={form.businessName} onChangeText={(v) => setForm({ ...form, businessName: v })} style={styles.input} mode="outlined" />
          <TextInput label="Owner Name" value={form.ownerName} onChangeText={(v) => setForm({ ...form, ownerName: v })} style={styles.input} mode="outlined" />
          
          {/* --- NEW OTP ROW STARTS HERE --- */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <TextInput 
              label="Mobile Number" 
              value={form.mobile} 
              onChangeText={(v) => setForm({ ...form, mobile: v })} 
              style={[styles.input, { flex: 1, marginBottom: 0 }]} 
              mode="outlined" 
              keyboardType="phone-pad"
              disabled={otpVerified}
            />
            {!otpVerified && (
              <Button onPress={sendSignupOtp} loading={otpLoading}>
                {otpSent ? "Resend" : "Get OTP"}
              </Button>
            )}
          </View>

          {otpSent && !otpVerified && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <TextInput 
                label="Enter OTP" 
                value={otp} 
                onChangeText={setOtp} 
                style={{ flex: 1 }} 
                mode="outlined" 
                keyboardType="numeric" 
              />
              <Button onPress={verifySignupOtp} loading={otpLoading}>Verify</Button>
            </View>
          )}
          {otpVerified && <HelperText type="info" style={{ color: 'green', marginBottom: 10 }}>✓ Mobile Verified</HelperText>}
          {/* --- NEW OTP ROW ENDS HERE --- */}
        </>
      )}

      <TextInput label="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} style={styles.input} mode="outlined" keyboardType="email-address" autoCapitalize="none" />
      
      <TextInput 
        label="Password" 
        value={form.password} 
        secureTextEntry={!showPassword} 
        onChangeText={(v) => setForm({ ...form, password: v })} 
        style={styles.input} 
        mode="outlined"
        right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
      />

      {/* FORGOT PASSWORD LINK */}
      {!isSignup && (
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotPass}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      {isSignup && (
        <View style={styles.checkboxContainer}>
          <Checkbox status={acceptedTerms ? 'checked' : 'unchecked'} onPress={() => setAcceptedTerms(!acceptedTerms)} color="#FF9800" />
          <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
            <Text style={styles.checkboxLabel}>I agree to <Text style={styles.underline}>Merchant Terms & Conditions</Text></Text>
          </TouchableOpacity>
        </View>
      )}

      <Button mode="contained" onPress={isSignup ? handleSignup : handleLogin} loading={loading} style={styles.button}>
        {isSignup ? 'Create Account' : 'Login'}
      </Button>

      <Button icon="google" mode="outlined" onPress={handleGoogleLogin} style={styles.googleBtn} color="#444">
        Sign in with Google
      </Button>

      <TouchableOpacity onPress={() => setIsSignup(!isSignup)} style={styles.toggle}>
        <Text style={styles.toggleText}>
          {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 25, backgroundColor: '#fff', flexGrow: 1, justifyContent: 'center' },
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 40, // Increased spacing for better look
    marginTop: 20 
  },
  logoImage: {
    width: 180,       // Adjust width as needed
    height: 100,      // Adjust height as needed
    resizeMode: 'contain', // This ensures the logo isn't stretched
  },
  logoD: { fontSize: 40, fontWeight: 'bold', color: '#FF9800' },
  logoText: { fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  subtitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 20 },
  input: { marginBottom: 12 },
  button: { marginTop: 15, backgroundColor: '#FF9800' },
  googleBtn: { marginTop: 15, borderColor: '#ddd' },
  forgotPass: { alignSelf: 'flex-end', marginBottom: 15 },
  linkText: { color: '#FF9800', fontWeight: '600' },
  toggle: { marginTop: 25 },
  toggleText: { textAlign: 'center', color: '#FF9800', fontWeight: 'bold' },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkboxLabel: { fontSize: 13, color: '#666' },
  underline: { textDecorationLine: 'underline', color: '#FF9800' }
});

export default LoginScreen;