import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Appbar, Card, Text, Checkbox, Avatar, Divider, IconButton } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY_COLOR = "#FAA307"; 
const SECONDARY_COLOR = "#333533";
const API_BASE = "https://api.discountdost.com/api";

const ProfileScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    merchant_name: '',
    merchant_address: '',
    merchant_pincode: '',
    merchant_phone: '',
    merchant_manager: '',
    merchant_category: '',
    account_name: '',
    ifsc_code: '',
    account_number: '',
    gstin: '',
    pan: '',
    gst: '',
    signedContract: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const res = await axios.get(`${API_BASE}/merchant/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data;

      // Mapping backend fields to frontend state (Matching MerchantProfile.js)
      setForm({
        merchant_name: data.name || '',
        merchant_address: data.address || '',
        merchant_pincode: data.pincode || '',
        merchant_phone: data.phone || '',
        merchant_manager: data.merchantManager || '',
        merchant_category: data.category || '',
        
        account_name: data.account_name || '',
        ifsc_code: data.ifsc_code || '',
        account_number: data.account_number || '',
        
        gstin: data.gstin || '',
        pan: data.pan || '',
        gst: (data.gst || '').toString(),
        signedContract: data.signedContract || false,
      });
    } catch (e) {
      Alert.alert("Error", "Failed to load profile details");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Construct payload (Matching MerchantProfile.js logic)
    const payload = {
      merchant_name: form.merchant_name,
      merchant_address: form.merchant_address,
      merchant_pincode: form.merchant_pincode,
      merchant_phone: form.merchant_phone,
      merchant_manager: form.merchant_manager,
      merchant_category: form.merchant_category,

      account_name: form.account_name,
      ifsc_code: form.ifsc_code,
      account_number: form.account_number,

      gstin: form.gstin,
      pan: form.pan,
      gst: form.gst,

      signedContract: form.signedContract
    };

    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const res = await axios.post(`${API_BASE}/merchant/profile`, payload, {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      });

      if (res.status === 200 || res.status === 201) {
        Alert.alert("✅ Success", "Profile updated successfully!");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Failed to update profile";
      Alert.alert("❌ Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Stay", style: "cancel" },
      { text: "Logout", onPress: async () => {
          await AsyncStorage.clear();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }, 
        style: 'destructive' 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header} elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="My Account" titleStyle={styles.headerTitle} />
        <Appbar.Action icon="logout" color="#FF5252" onPress={handleLogout} />
      </Appbar.Header>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER SECTION */}
        <View style={styles.profileHero}>
          <Avatar.Text 
            size={80} 
            label={form.merchant_name.substring(0,2).toUpperCase() || "DD"} 
            style={{ backgroundColor: PRIMARY_COLOR }} 
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Text style={styles.bizName}>{form.merchant_name || "Merchant Name"}</Text>
          <Text style={styles.bizCategory}>{form.merchant_category || "Category Not Set"}</Text>
        </View>

        <View style={styles.content}>
          
          {/* BUSINESS SECTION */}
          <Text style={styles.label}>BUSINESS INFORMATION</Text>
          <Card style={styles.sectionCard}>
            <Card.Content>
              <TextInput label="Manager Name" mode="outlined" value={form.merchant_manager} onChangeText={t => setForm({...form, merchant_manager: t})} style={styles.input} activeOutlineColor={PRIMARY_COLOR} />
              <TextInput label="Business Address" mode="outlined" multiline value={form.merchant_address} onChangeText={t => setForm({...form, merchant_address: t})} style={styles.input} activeOutlineColor={PRIMARY_COLOR} />
              <View style={styles.row}>
                <TextInput label="Pincode" mode="outlined" style={[styles.input, {flex: 1, marginRight: 8}]} value={form.merchant_pincode} onChangeText={t => setForm({...form, merchant_pincode: t})} keyboardType="numeric" activeOutlineColor={PRIMARY_COLOR} />
                <TextInput label="Mobile" mode="outlined" style={[styles.input, {flex: 1.5}]} value={form.merchant_phone} editable={false} right={<TextInput.Icon icon="lock" color="#CCC" />} />
              </View>
            </Card.Content>
          </Card>

          {/* COMPLIANCE SECTION */}
          <Text style={styles.label}>TAX & COMPLIANCE</Text>
          <Card style={styles.sectionCard}>
            <Card.Content>
              <TextInput label="GSTIN" mode="outlined" value={form.gstin} onChangeText={t => setForm({...form, gstin: t})} style={styles.input} activeOutlineColor={PRIMARY_COLOR} />
              <View style={styles.row}>
                <TextInput label="PAN" mode="outlined" style={[styles.input, {flex: 1, marginRight: 8}]} value={form.pan} editable={false} activeOutlineColor={PRIMARY_COLOR} />
                <TextInput label="GST %" mode="outlined" style={[styles.input, {flex: 1}]} value={form.gst} onChangeText={t => setForm({...form, gst: t})} keyboardType="numeric" activeOutlineColor={PRIMARY_COLOR} />
              </View>
            </Card.Content>
          </Card>

          {/* BANKING SECTION */}
          <Text style={styles.label}>SETTLEMENT BANK ACCOUNT</Text>
          <Card style={[styles.sectionCard, {backgroundColor: '#F1F3F5'}]}>
            <Card.Content>
              <View style={styles.bankHeader}>
                <IconButton icon="bank" size={20} iconColor={SECONDARY_COLOR} />
                <Text style={styles.bankNotice}>Account details are locked. Contact support to change.</Text>
              </View>
              <TextInput label="Account Holder" mode="flat" value={form.account_name} editable={false} style={styles.flatInput} />
              <TextInput label="Account Number" mode="flat" value={form.account_number} editable={false} style={styles.flatInput} />
              <TextInput label="IFSC Code" mode="flat" value={form.ifsc_code} editable={false} style={styles.flatInput} />
            </Card.Content>
          </Card>

          {/* Inside ScrollView, replace the agreement section */}
          <TouchableOpacity 
            style={styles.contractRow} 
            onPress={() => setForm({...form, signedContract: !form.signedContract})}
          >
            <Checkbox.Android 
              status={form.signedContract ? 'checked' : 'unchecked'} 
              color={PRIMARY_COLOR}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.contractText}>
                I agree to the 
                <Text 
                  style={{ color: PRIMARY_COLOR, fontWeight: 'bold' }}
                  onPress={() => Alert.alert("Contract", "Merchant Contract content goes here...")}
                > DiscountDost Merchant Contract</Text>
              </Text>
            </View>
          </TouchableOpacity>

          <Button 
            mode="contained" 
            onPress={handleSave} 
            loading={loading} 
            style={styles.saveButton}
            contentStyle={{ height: 50 }}
            buttonColor={SECONDARY_COLOR}
          >
            UPDATE PROFILE
          </Button>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#FFF' },
  headerTitle: { fontWeight: 'bold' },
  content: { paddingHorizontal: 16 },
  profileHero: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    elevation: 2,
  },
  bizName: { fontSize: 22, fontWeight: 'bold', marginTop: 12, color: SECONDARY_COLOR },
  bizCategory: { fontSize: 14, color: '#666', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  sectionCard: { borderRadius: 12, elevation: 1, marginBottom: 20, backgroundColor: '#FFF' },
  input: { marginBottom: 12, backgroundColor: '#FFF' },
  flatInput: { marginBottom: 4, backgroundColor: 'transparent' },
  row: { flexDirection: 'row' },
  bankHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: -8 },
  bankNotice: { fontSize: 11, color: '#666', flex: 1 },
  bankCard: {
    borderRadius: 12,
    elevation: 1,
    marginBottom: 20,
    backgroundColor: '#F1F3F5', // Greyish background to indicate read-only
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  contractRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, marginTop: 5 },
  contractText: { fontSize: 14, color: '#444', flex: 1 },
  saveButton: { borderRadius: 12, elevation: 2 },
});

export default ProfileScreen;