import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollView, StyleSheet, Alert, View, Image, TouchableOpacity, Dimensions 
} from 'react-native';
import { 
  TextInput, Button, Appbar, Text, HelperText, Card, Divider, Avatar, IconButton 
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = "#FAA307"; 
const SECONDARY_COLOR = "#333533";

const CreateDealScreen = ({ navigation, route }: { navigation: any, route: any }) => {
  const dealId = route.params?.dealId;
  const isEditing = !!dealId;

  // --- FORM STATE ---
  const [form, setForm] = useState({
    title: '',
    mrp: '',
    walkinDiscount: '',
    ddPlatformFeePercent: '10',
    description: '',
    terms: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    product_gst: '',
  });

  const [merchantProfile, setMerchantProfile] = useState<any>(null);
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] = useState<'auto' | 'manual'>('auto');

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      const mId = await AsyncStorage.getItem('merchantId');
      if (!mId) {
        navigation.replace("Login");
        return;
      }
      
      // Get mode from route params (passed from Dashboard)
      const selectedMode = route.params?.mode || 'auto';
      setMode(selectedMode);

      await fetchMerchantProfile(); // Fetches profile regardless to get Fee %
      
      if (selectedMode === 'manual') {
        // Clear templates if manual
        setForm(prev => ({ ...prev, description: '', terms: '' }));
      }
      
      if (isEditing) fetchDealData();
      setDefaultEndDate();
    };
    init();
  }, [route.params?.mode]);

  const setDefaultEndDate = () => {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setForm(prev => ({ ...prev, endDate: nextYear.toISOString().split('T')[0] }));
  };

  const fetchMerchantProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const response = await axios.get('https://api.discountdost.com/api/merchant/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const profile = response.data;
      setMerchantProfile(profile);

      const bizName = profile.business_name || profile.name || "Your Business";
      
      // Professional Website Templates
      const autoDescription = `Discover the best deals and enjoy exclusive savings at ${bizName} with Discount Dost, India’s smartest rewards platform. Every purchase here turns into real Gold savings automatically!`;
      
      const autoTerms = `• Valid only for registered Discount Dost users.\n• Instant Gold is credited automatically upon successful verification.\n• Cannot be clubbed with other ongoing promotions at ${bizName}.\n• Please present the QR code at the time of billing.`;

      setForm(prev => ({
        ...prev,
        ddPlatformFeePercent: (profile.voucher_platform_fee || 15).toString(),
        product_gst: profile.gstin || '',
        description: prev.description || autoDescription,
        terms: prev.terms || autoTerms,
      }));
    } catch (error) {
      console.error("Profile fetch error", error);
    }
  };

  const fetchDealData = async () => {
    try {
      const response = await axios.get(`https://api.discountdost.com/api/deals/${dealId}`);
      const d = response.data;
      
      setForm(prev => ({
        ...prev,
        title: d.title,
        mrp: d.mrp.toString(),
        walkinDiscount: (d.discountValue || d.walkinDiscount).toString(),
        description: d.description,
        terms: d.terms,
        startDate: d.startDate.split('T')[0],
        endDate: d.endDate.split('T')[0],
        product_gst: d.product_gst || '',
      }));
      
      if (d.images && d.images.length > 0) {
        setImage({ uri: d.images[0] }); 
      }
    } catch (e) {
      Alert.alert("Error", "Failed to load deal data");
    }
  };

  // --- CALCULATION LOGIC (MATCHES WEBSITE) ---
  const mrp = parseFloat(form.mrp) || 0;
  const disc = parseFloat(form.walkinDiscount) || 0;
  const feePercent = parseFloat(form.ddPlatformFeePercent) || 0;

  const goldValue = (mrp * disc) / 100;
  const platformFee = (mrp * feePercent) / 100;
  const gstOnFee = platformFee * 0.18;
  const merchantGets = mrp - (goldValue + platformFee + gstOnFee);

  // --- ACTIONS ---
  const handleImagePick = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets && result.assets[0]) {
      setImage(result.assets[0]);
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.mrp || !form.walkinDiscount) {
      return Alert.alert("Missing Info", "Please fill in all required fields.");
    }
    if (form.title.length > 50) return Alert.alert("Error", "Title max 50 characters");
    if (goldValue < 10) {
      return Alert.alert("Invalid Deal", `Gold Value (₹${goldValue.toFixed(2)}) must be at least ₹10. Please increase the discount %.`);
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const merchantId = await AsyncStorage.getItem('merchantId');

      const data = new FormData();
      data.append('title', form.title);
      data.append('mrp', form.mrp);
      data.append('discountValue', form.walkinDiscount);
      data.append('description', form.description);
      data.append('terms', form.terms);
      data.append('startDate', form.startDate);
      data.append('endDate', form.endDate);
      data.append('merchantId', merchantId);

      if (image && image.fileName) {
        data.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.fileName || `deal_${Date.now()}.jpg`,
        } as any);
      }

      const url = isEditing ? `https://api.discountdost.com/api/deals/${dealId}/edit` : 'https://api.discountdost.com/api/deals';
      const method = isEditing ? 'put' : 'post';

      await axios({ 
        method, 
        url, 
        data, 
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } 
      });

      Alert.alert('Success ✨', isEditing ? 'Deal updated successfully!' : 'Deal submitted for staff approval.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header} elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isEditing ? "Edit Gift Voucher" : "Create New Deal"} titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

      <View style={styles.toggleContainer}>
        {/* 1. MANUAL BUTTON FIRST */}
        <Button 
          mode={mode === 'manual' ? 'contained' : 'outlined'} 
          onPress={() => {
            setMode('manual');
            setForm(prev => ({ ...prev, description: '', terms: '' })); // Clears the fields
          }}
          style={styles.toggleButton}
          textColor={mode === 'manual' ? '#FFF' : SECONDARY_COLOR}
          buttonColor={mode === 'manual' ? SECONDARY_COLOR : undefined}
        >
          Proceed Manual
        </Button>

        {/* 2. AUTO-FILLED BUTTON SECOND */}
        <Button 
          mode={mode === 'auto' ? 'contained' : 'outlined'} 
          onPress={() => {
            setMode('auto');
            fetchMerchantProfile(); // Re-fills the auto-data
          }}
          style={styles.toggleButton}
          textColor={mode === 'auto' ? '#000' : PRIMARY_COLOR}
          buttonColor={mode === 'auto' ? PRIMARY_COLOR : undefined}
        >
          Auto-Filled
        </Button>
      </View>
        
        {/* STEP 1: BASIC INFO */}
        <Text style={styles.sectionLabel}>Voucher Details</Text>
        <Card style={styles.inputCard}>
          <Card.Content>
            <TextInput 
              label="Gift Voucher Name" 
              placeholder="e.g. ₹1000 Gift Voucher for Dining"
              style={styles.input} 
              mode="outlined" 
              value={form.title} 
              maxLength={50} 
              onChangeText={(t) => setForm({ ...form, title: t })} 
              activeOutlineColor={PRIMARY_COLOR}
            />
            
            <View style={styles.row}>
              <TextInput 
                label="MRP (₹)" 
                keyboardType="numeric" 
                style={[styles.input, { flex: 1, marginRight: 8 }]} 
                mode="outlined" 
                value={form.mrp} 
                onChangeText={(t) => setForm({ ...form, mrp: t })} 
                activeOutlineColor={PRIMARY_COLOR}
              />
              <TextInput 
                label="Discount (%)" 
                keyboardType="numeric" 
                style={[styles.input, { flex: 1 }]} 
                mode="outlined" 
                value={form.walkinDiscount} 
                onChangeText={(t) => setForm({ ...form, walkinDiscount: t })} 
                activeOutlineColor={PRIMARY_COLOR}
              />
            </View>
            <HelperText type="info" style={{marginTop: -8}}>
              Customers will receive this % as Gold back.
            </HelperText>
          </Card.Content>
        </Card>

        {/* STEP 2: EARNINGS BREAKDOWN */}
        {mrp > 0 && disc > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Financial Breakdown</Text>
            <Card style={styles.breakdownCard}>
              <Card.Content>
                <View style={styles.bRow}>
                  <Text style={styles.bLabel}>Gold Value (Customer Reward)</Text>
                  <Text style={styles.bValue}>- ₹{goldValue.toFixed(2)}</Text>
                </View>
                <View style={styles.bRow}>
                  <Text style={styles.bLabel}>Platform Fee ({form.ddPlatformFeePercent}%)</Text>
                  <Text style={styles.bValue}>- ₹{platformFee.toFixed(2)}</Text>
                </View>
                <View style={styles.bRow}>
                  <Text style={styles.bLabel}>GST on Fee (18%)</Text>
                  <Text style={styles.bValue}>- ₹{gstOnFee.toFixed(2)}</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.bRow}>
                  <Text style={styles.finalLabel}>Merchant Settlement</Text>
                  <Text style={styles.finalValue}>₹{merchantGets.toFixed(2)}</Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* STEP 3: BANNER UPLOAD */}
        <Text style={styles.sectionLabel}>Deal Banner</Text>
        <TouchableOpacity onPress={handleImagePick} style={styles.imagePicker}>
          {image ? (
            <View>
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
              <View style={styles.changeImageBadge}>
                <Text style={{color: '#FFF', fontSize: 12, fontWeight: 'bold'}}>CHANGE IMAGE</Text>
              </View>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <IconButton icon="camera-plus-outline" size={40} iconColor={PRIMARY_COLOR} />
              <Text style={styles.uploadText}>Upload Square Banner (1:1)</Text>
              <Text variant="bodySmall" style={{ color: '#888' }}>Max size 5MB • PNG, JPG</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* STEP 4: ADDITIONAL INFO */}
        <Text style={styles.sectionLabel}>Policy & Description</Text>
        <Card style={styles.inputCard}>
          <Card.Content>
            <TextInput 
              label="End Date (YYYY-MM-DD)" 
              style={styles.input} 
              mode="outlined" 
              value={form.endDate} 
              onChangeText={(t) => setForm({ ...form, endDate: t })} 
              activeOutlineColor={PRIMARY_COLOR}
              right={<TextInput.Icon icon="calendar" />}
            />
            <TextInput 
              label="Description" 
              multiline 
              numberOfLines={4} 
              style={[styles.input, { height: 100 }]} 
              mode="outlined" 
              value={form.description} 
              onChangeText={(t) => setForm({ ...form, description: t })} 
              activeOutlineColor={PRIMARY_COLOR}
            />
            <TextInput 
              label="Terms & Conditions" 
              multiline 
              numberOfLines={3} 
              style={[styles.input, { height: 80 }]} 
              mode="outlined" 
              value={form.terms} 
              onChangeText={(t) => setForm({ ...form, terms: t })} 
              activeOutlineColor={PRIMARY_COLOR}
            />
          </Card.Content>
        </Card>

        <Button 
          mode="contained" 
          onPress={handleCreate} 
          loading={loading} 
          disabled={loading}
          style={styles.submitButton}
          contentStyle={{ height: 55 }}
          buttonColor={SECONDARY_COLOR}
        >
          {isEditing ? "UPDATE VOUCHER" : "SUBMIT FOR APPROVAL"}
        </Button>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { backgroundColor: '#FFF' },
  headerTitle: { fontWeight: 'bold', fontSize: 18 },
  scrollContent: { padding: 16 },

  toggleContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20,
    gap: 10 // Space between the buttons
  },
  toggleButton: { 
    flex: 1, 
    borderRadius: 8,
    borderColor: SECONDARY_COLOR // Makes the outlined mode visible
  },
  section: { marginBottom: 15 },
  sectionLabel: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
  
  inputCard: { borderRadius: 12, elevation: 1, backgroundColor: '#FFF', marginBottom: 20 },
  input: { marginBottom: 12, backgroundColor: '#FFF' },
  row: { flexDirection: 'row' },
  
  breakdownCard: { borderRadius: 12, backgroundColor: '#333533', elevation: 4, marginBottom: 20 },
  bRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bLabel: { color: '#BBB', fontSize: 13 },
  bValue: { color: '#FFF', fontWeight: '600' },
  divider: { backgroundColor: '#555', marginVertical: 10 },
  finalLabel: { color: PRIMARY_COLOR, fontSize: 16, fontWeight: 'bold' },
  finalValue: { color: PRIMARY_COLOR, fontSize: 20, fontWeight: 'bold' },

  imagePicker: { 
    width: '100%', 
    height: 200, 
    borderRadius: 15, 
    borderWidth: 2, 
    borderColor: '#DDD', 
    borderStyle: 'dashed', 
    backgroundColor: '#FFF',
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 25
  },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { fontSize: 15, fontWeight: '600', color: '#444' },
  previewImage: { width: '100%', height: '100%' },
  changeImageBadge: { 
    position: 'absolute', 
    bottom: 10, 
    alignSelf: 'center', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    paddingHorizontal: 15, 
    paddingVertical: 5, 
    borderRadius: 20 
  },

  submitButton: { borderRadius: 12, marginTop: 10, elevation: 2 },
});

export default CreateDealScreen;