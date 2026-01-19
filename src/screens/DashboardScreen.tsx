import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  ScrollView, View, Keyboard, StyleSheet, ActivityIndicator, 
  TouchableOpacity, Alert, RefreshControl, Image, ImageBackground, Dimensions, FlatList, Modal, Linking
} from 'react-native';
import { 
  Appbar, Modal as PaperModal, Card, Text, Button, Avatar, IconButton, 
  List, Caption, Badge, Divider, TextInput, Menu, Provider, Searchbar, DataTable, Portal
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera } from 'react-native-camera-kit';
import { useFocusEffect } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import DateTimePicker from '@react-native-community/datetimepicker';
import FilePicker from 'react-native-file-picker';
import RNFS from 'react-native-fs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


const { width, height } = Dimensions.get('window');
const PRIMARY_COLOR = "#FAA307"; 
const SECONDARY_COLOR = "#FFFFF";

const DashboardScreen = ({ navigation }: any) => {
  // --- 1. STATES ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data States
  const [profile, setProfile] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [corporateCoupons, setCorporateCoupons] = useState<Coupon[]>([]);
  const [razorpayKey, setRazorpayKey] = useState("");

  // UI States
  const [infoModal, setInfoModal] = useState({ visible: false, tab: 'gold' });
  const [settlementModal, setSettlementModal] = useState(false);

  const [showDealChoice, setShowDealChoice] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- UPSALE MODAL STATE ---
  const [showUpsaleModal, setShowUpsaleModal] = useState(false);
  const [couponCount, setCouponCount] = useState('');
  const [couponValue, setCouponValue] = useState('');
  const [paying, setPaying] = useState(false);

  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatCount, setRepeatCount] = useState('');
  const [repeatValue, setRepeatValue] = useState('');
  const [repeatCoupons, setRepeatCoupons] = useState<Coupon[]>([]);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTab, setInfoTab] = useState<'gold' | 'return'>('gold'); // Tab state

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [wallet, setWallet] = useState<{enabled: boolean, balance: number, gold_sell_enabled?: boolean} | null>(null);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showCouponInjectionModal, setShowCouponInjectionModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');

  const [showGoldSellModal, setShowGoldSellModal] = useState(false);
  const [showGoldOtpModal, setShowGoldOtpModal] = useState(false);
  const [goldCustomerMobile, setGoldCustomerMobile] = useState('');
  const [goldSellAmount, setGoldSellAmount] = useState('');
  const [goldOtp, setGoldOtp] = useState('');
  const [activeGoldTxId, setActiveGoldTxId] = useState('');
  const [goldPreview, setGoldPreview] = useState<{name: string, max_amount: number} | null>(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWalletActionChoice, setShowWalletActionChoice] = useState(false); // To show Topup vs Withdraw

  const [couponCodesText, setCouponCodesText] = useState('');
  const [injectionAmount, setInjectionAmount] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('No file selected');

  const baseUrl = 'https://api.discountdost.com/api';
  const DEAL_IMAGE_BASE_URL = 'https://discountdost-deals.s3.ap-south-1.amazonaws.com/deals';


  // --- 2. DATA LOADING (HYBRID FETCHING) ---
  const loadData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const merchantId = await AsyncStorage.getItem('merchantId');
      if (!token || !merchantId) { navigation.replace('Login'); return; }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [profRes, sumRes, transRes, approvedDealsRes, pendingDealsRes, settRes, repeatRes, corpRes, validationRes, walletRes] = await Promise.all([
        axios.get(`${baseUrl}/merchant/profile`, config).catch(() => null),
        axios.get(`${baseUrl}/merchant/dashboard-summary?merchantId=${merchantId}`, config).catch(() => null),
        axios.get(`${baseUrl}/merchant/recent-gold-transactions?merchantId=${merchantId}`, config).catch(() => null),
        axios.get(`${baseUrl}/merchant/approved-deals?merchantId=${merchantId}`, config).catch(() => null),
        axios.get(`${baseUrl}/merchant/pending-deals?merchantId=${merchantId}`, config).catch(() => null),
        axios.get(`${baseUrl}/merchant/my-settlements?merchantId=${merchantId}`, config).catch(() => null),
        axios.get(`${baseUrl}/merchant/get-corporate-coupons?merchantId=${merchantId}`, config).catch(() => null),
        axios.get(`${baseUrl}/merchant/get-coupons?merchantId=${merchantId}&type=repeat`, config).catch(() => null),
        axios.get(`${baseUrl}/merchant/validate-coupons?merchantId=${merchantId}`, config).catch(() => null),
        axios.get(`${baseUrl}/merchant/wallet?merchantId=${merchantId}`, config).catch(() => null)
      ]);

      if (profRes?.data) setProfile(profRes.data);
      if (sumRes?.data) setSummary(sumRes.data);
      if (transRes?.data) setRecentTransactions(transRes.data);
      if (settRes?.data) setSettlements(settRes.data);
      if (corpRes?.data) setCorporateCoupons(corpRes.data);
      if (validationRes?.data) setIssuedCoupons(validationRes.data);
      if (repeatRes?.data) setRepeatCoupons(repeatRes.data);
      if (approvedDealsRes?.data) setApprovedDeals(approvedDealsRes.data);     
      if (pendingDealsRes?.data) setPendingDeals(pendingDealsRes.data);
      if (walletRes?.data) setWallet(walletRes.data);
    } catch (error) {
      console.error("Critical Load Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  // 1. Create a ref for the ScrollView
  const scrollRef = useRef<ScrollView>(null);

  // 2. Create states to store the Y-position of each section
  const [sections, setSections] = useState({
    vouchers: 0,
    transactions: 0
  });

  const bannerRef = React.useRef<FlatList>(null);
  const [activeBanner, setActiveBanner] = React.useState(0);
  const bannerData = [require('../../assets/Appbanner1.jpg'), require('../../assets/Appbanner2.jpg')];

  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = activeBanner + 1 >= bannerData.length ? 0 : activeBanner + 1;
      setActiveBanner(nextIndex);
      bannerRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 3000); // Changes every 3 seconds

    return () => clearInterval(timer);
  }, [activeBanner]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  // --- 3. BUSINESS GUARDS & FEE CALCULATIONS ---
  
  const isProfileComplete = useMemo(() => {
      if (!profile) return false;
      return (
        profile.signedContract &&
        !!profile.name &&
        !!profile.address &&
        !!profile.pincode &&
        !!profile.phone &&
        !!profile.category &&
        !!profile.account_name &&
        !!profile.ifsc_code &&
        !!profile.account_number
      );
    }, [profile]);

  const [profileForm, setProfileForm] = useState({
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
    gst: '0',
    signedContract: false
  });

  // --- FETCH RAZORPAY KEY ---
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const res = await axios.get('https://api.discountdost.com/api/get-razorpay-key');
        setRazorpayKey(res.data.key);
      } catch (err) {
        console.error("Razorpay Key Error", err);
      }
    };
    fetchKey();
  }, []);

  // --- CALCULATION LOGIC (MATCHING WEBSITE) ---
  const platformFeePercent = profile?.voucher_platform_fee || 10;
  const count = parseInt(couponCount) || 0;
  const value = parseInt(couponValue) || 0;
  
  const totalGoldValue = count * value;
  const platformFee = totalGoldValue * (platformFeePercent / 100);
  const cgst = platformFee * 0.09;
  const sgst = platformFee * 0.09;
  const finalPayable = totalGoldValue + platformFee + cgst + sgst;

  // --- REPEAT BIZ CALCULATIONS ---
  const rCount = parseInt(repeatCount) || 0;
  const rValue = parseInt(repeatValue) || 0;

  const rBaseAmount = rCount * rValue;
  const rExtraFee = Math.ceil(rCount / 100) * 600; // ₹600 per 100 cards
  const rPlatformFee = rBaseAmount * (platformFeePercent / 100);
  const rTaxableAmount = rExtraFee + rPlatformFee;
  const rCgst = rTaxableAmount * 0.09;
  const rSgst = rTaxableAmount * 0.09;
  const rFinalPayable = rBaseAmount + rExtraFee + rPlatformFee + rCgst + rSgst;

  // --- RAZORPAY PAYMENT HANDLER ---
  const handlePayment = async () => {
    if (count <= 0 || value < 10) {
      Alert.alert("Invalid Input", "Please enter valid count and value (min ₹10)");
      return;
    }

    setPaying(true);
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const merchantId = await AsyncStorage.getItem('merchantId');

      // 1. Create Order on Backend
      const orderRes = await axios.post('https://api.discountdost.com/api/merchant/create-coupon-order', {
        merchantId,
        count,
        value,
        type: 'upsell'
      }, { headers: { Authorization: `Bearer ${token}` } });

      const order = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        description: 'Upsell Gold Vouchers Purchase',
        image: 'https://discountdost.com/logo.png',
        currency: order.currency,
        key: razorpayKey,
        amount: order.amount,
        name: 'Discount Dost',
        order_id: order.id,
        prefill: {
          email: profile?.email || '',
          contact: profile?.phone || '',
          name: profile?.name || ''
        },
        theme: { color: PRIMARY_COLOR }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        // 3. Verify Payment
        const verifyRes = await axios.post('https://api.discountdost.com/api/merchant/verify-coupon-payment', {
          orderId: order.id,
          paymentId: data.razorpay_payment_id,
          signature: data.razorpay_signature,
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (verifyRes.status === 200) {
          Alert.alert("Success ✨", "Payment Successful! Vouchers are being processed.");
          setShowUpsaleModal(false);
          setCouponCount('');
          setCouponValue('');
          // Refresh dashboard data here
        }
      }).catch(async (error: any) => {
        // Handle Cancel
        await axios.post('https://api.discountdost.com/api/merchant/cancel-coupon-order', 
          { orderId: order.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert("Cancelled", "Payment was cancelled.");
      });

    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Order creation failed");
    } finally {
      setPaying(false);
    }
  };

  const handleRepeatPayment = async () => {
    if (rCount <= 0 || rValue < 10) {
      Alert.alert("Invalid Input", "Minimum value is ₹10");
      return;
    }

    setPaying(true);
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const merchantId = await AsyncStorage.getItem('merchantId');

      const orderRes = await axios.post('https://api.discountdost.com/api/merchant/create-coupon-order', {
        merchantId,
        count: rCount,
        value: rValue,
        type: 'repeat' // <--- Critical difference
      }, { headers: { Authorization: `Bearer ${token}` } });

      const order = orderRes.data;

      const options = {
        description: 'Repeat Biz Vouchers (Physical Cards)',
        image: 'https://discountdost.com/logo.png',
        currency: order.currency,
        key: razorpayKey,
        amount: order.amount,
        name: 'Discount Dost',
        order_id: order.id,
        theme: { color: '#6c5ce7' } // Matching your website's purple button
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        await axios.post('https://api.discountdost.com/api/merchant/verify-coupon-payment', {
          orderId: order.id,
          paymentId: data.razorpay_payment_id,
          signature: data.razorpay_signature,
        }, { headers: { Authorization: `Bearer ${token}` } });

        Alert.alert("Success ✨", "Repeat vouchers purchased! We will begin printing soon.");
        setShowRepeatModal(false);
      }).catch(async () => {
        await axios.post('https://api.discountdost.com/api/merchant/cancel-coupon-order', { orderId: order.id }, { headers: { Authorization: `Bearer ${token}` } });
        Alert.alert("Cancelled", "Payment cancelled.");
      });
    } catch (err) {
      Alert.alert("Error", "Order failed");
    } finally {
      setPaying(false);
    }
  };

  // 1. Add Filter States (matching your website)
  const [statusFilter, setStatusFilter] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);

  // 2. Add the Filter Logic (Memoized for performance)
  const combinedFilteredVouchers = useMemo(() => {
    // Combine both sources to match the Website table
    const allVouchers = [...corporateCoupons, ...repeatCoupons];

    return allVouchers.filter(coupon => {
      // 1. Date Formatting
      const rawDate = new Date(coupon.createdAt);
      if (isNaN(rawDate.getTime())) return false;
      const couponDate = rawDate.toISOString().split('T')[0];
      
      // 2. Date Filtering
      const matchesStartDate = !startDate || couponDate >= startDate;
      const matchesEndDate = !endDate || couponDate <= endDate;
      
      // 3. Status Filtering (Website Sync)
      // Repeat Coupons use 'created' while Corporate uses 'Unused'
      let matchesStatus = true;
      if (statusFilter === 'Unused') {
        matchesStatus = (coupon.status === 'Unused' || coupon.status === 'created');
      } else if (statusFilter === 'Redeemed / Sent') {
        matchesStatus = (coupon.status === 'Redeemed / Sent' || (coupon.status !== 'created' && coupon.status !== 'Unused'));
      } else {
        // 'All Status' matches everything
        matchesStatus = true;
      }

      return matchesStartDate && matchesEndDate && matchesStatus;
    });
  }, [corporateCoupons, repeatCoupons, startDate, endDate, statusFilter]);

  // 3. Helper to reset filters
  const clearFilters = () => {
    setStartDate(firstDayOfMonth);
    setEndDate(today);
    setStatusFilter('');
  };

  // --- NEW STATES FOR REDEEM SECTION ---
  const [viewCouponData, setViewCouponData] = useState<any>(null);
  const [redeemModal, setRedeemModal] = useState<{
    visible: boolean;
    coupon: Coupon | null; // This fixes the 'null' and 'never' issues
    phone: string;
    txn: string;
  }>({
    visible: false,
    coupon: null,
    phone: '',
    txn: '',
  });

  // Helper to format ID like 'C12345'
  const getCouponId = (id: string) => 'C' + id.slice(-5).toUpperCase();

  // Helper for status colors
  const getValueColor = (value: number) => {
    if (value <= 500) return '#6c757d'; // gray
    if (value <= 1500) return '#007bff'; // blue
    return '#28a745'; // green
  };

  // Define what a Coupon looks like
  interface Coupon {
    _id: string;
    value: number;
    subtotal?: number;
    status: string;
    createdAt: string;
    gateway?: string;
    type?: string;
    customerPhone?: string;
    merchantTransactionId?: string;
    redeemedAt?: any;
  }

  const handleRedeemSubmit = async () => {
    const { coupon, phone, txn } = redeemModal;
    if (!coupon) return;

    if (!/^\d{10}$/.test(phone)) return Alert.alert("Error", "Enter valid 10-digit phone");
    if (!txn) return Alert.alert("Error", "Transaction ID is required");

    // WEBSITE SYNC: Double confirmation check
    Alert.alert(
      "Confirm Mobile Number",
      `Voucher will be sent to:\n\n${phone}\n\nPlease double-check the number!`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Send", 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('merchantToken');
              const res = await axios.post(`${baseUrl}/merchant/redeem-coupon`, {
                couponId: coupon._id,
                merchantTransactionId: txn,
                customerPhone: phone
              }, { headers: { Authorization: `Bearer ${token}` } });

              if (res.status === 200) {
                Alert.alert("Success", "Voucher redeemed and SMS sent!");
                setCorporateCoupons(prev => prev.map(c => 
                  c._id === coupon._id ? { ...c, status: 'Redeemed / Sent' } : c
                ));
                setRedeemModal({ visible: false, coupon: null, phone: '', txn: '' });
              }
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.error || "Redemption failed");
            }
          }
        }
      ]
    );
  };

  const handleRefund = (couponId: string, gateway: string, value: number) => {
    Alert.alert(
      "Refund Voucher?",
      `Refund ₹${value}?\n\nRazorpay: Auto-refund (5-7 days)\nOther: Manual settle.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes, Refund", style: "destructive", onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('merchantToken');
              const merchantId = await AsyncStorage.getItem('merchantId');
              const res = await axios.post(`${baseUrl}/merchant/refund-auto`, {
                couponId,
                merchantId
              }, { headers: { Authorization: `Bearer ${token}` } });

              if (res.status === 200) {
                // Website Sync: Show success message with mode
                const mode = res.data.mode === "razorpay" ? "via Razorpay" : "Manually";
                Alert.alert("Refund Initiated ✅", `Refund will be processed ${mode}.`);
                
                // Remove from list
                setCorporateCoupons(prev => prev.filter(c => c._id !== couponId));
              }
            } catch (err) { 
              Alert.alert("Error", "Refund failed"); 
            }
          }
        }
      ]
    );
  };

  // 1. Add to your Interface/Types section
  interface Transaction {
    _id: string;
    orderId?: string;
    couponCode?: string; // Added
    value?: number;      // Added
    finalAmount?: number;
    status?: string;     // Added
    gateway?: string;    // Added
    createdAt: string;
    type: 'Repeat' | 'Upsell';
    invoice_url?: string;
  }

  // 2. Add inside your DashboardScreen component
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const handleOpenInvoice = (url: string) => {
    Linking.openURL(url).catch((err) => Alert.alert("Error", "Could not open invoice link"));
  };

  // 1. Update your Interface
  interface IssuedCoupon {
    couponCode: string;
    dealTitle: string;
    customerName: string;
    status: 'Issued' | 'Validated';
    createdAt: string;
    validatedAt?: string;
    value: number;
  }

  // 2. Add inside your component
  const [issuedCoupons, setIssuedCoupons] = useState<IssuedCoupon[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [otpModal, setOtpModal] = useState({ visible: false, otp: '', couponCode: '' });

  const handleValidateRequest = async (code: string) => {
    try {
      const merchantId = await AsyncStorage.getItem('merchantId');
      const token = await AsyncStorage.getItem('merchantToken');
      
      // 1. Send OTP
      const res = await axios.post(`${baseUrl}/merchant/send-coupon-otp`, 
        { couponCode: code, merchantId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setOtpModal({ visible: true, otp: '', couponCode: code });
        setIsScanning(false);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Invalid Coupon");
    }
  };

  const verifyCouponOTP = async () => {
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const res = await axios.post(`${baseUrl}/merchant/verify-coupon-otp`, 
        { couponCode: otpModal.couponCode, otp: otpModal.otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        setOtpModal({ visible: false, otp: '', couponCode: '' });
        Alert.alert("Success", "Coupon validated successfully!");
        loadData(); // This refreshes the IssuedCoupons table automatically
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "OTP Verification failed");
    }
  };

  interface Deal {
    _id: string;
    title: string;
    description: string;
    images: string[];
    mrp: number;
    discountValue: number;
    status: 'Pending' | 'Approved';
    endDate: string;
    terms: string;
  }

  const [approvedDeals, setApprovedDeals] = useState<Deal[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    mrp: '',
    discountValue: '',
    description: '',
    terms: '',
    newImages: [] as any[], // For storing selected local image URIs
  });

  const handleUpdateDeal = async () => {
    if (!selectedDeal) return;

    const form = new FormData();
    form.append("title", editForm.title);
    form.append("mrp", editForm.mrp);
    form.append("discountValue", editForm.discountValue);
    form.append("description", editForm.description);
    form.append("terms", editForm.terms);

    // Mobile Image Upload logic
    if (editForm.newImages.length > 0) {
      editForm.newImages.forEach((image, index) => {
        form.append("images", {
          uri: image.uri,
          type: 'image/jpeg',
          name: `deal_image_${index}.jpg`,
        } as any);
      });
    }

    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const res = await axios.put(`${baseUrl}/deals/${selectedDeal._id}/edit`, form, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        },
      });

      if (res.status === 200) {
        Alert.alert("Success", "Deal sent for re-approval.");
        
        // 1. Remove from Approved
        setApprovedDeals(prev => prev.filter(d => d._id !== selectedDeal._id));
        
        // 2. Add to Pending (Website Sync Logic)
        setPendingDeals(prev => [
          ...prev, 
          { ...selectedDeal, ...editForm, isApproved: false }
        ]);

        setSelectedDeal(null);
        loadData(); 
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update deal");
    }
  };

  // --- Add these states at the top of your component ---
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Example badge count

  // --- Add this helper function ---
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Real apps filter the list or navigate to a search results page here
  };

  // Optimized Filtering Logic
  const filteredPending = useMemo(() => {
    return pendingDeals.filter(deal => 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pendingDeals, searchQuery]);

  const filteredApproved = useMemo(() => {
    return approvedDeals.filter(deal => 
      deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [approvedDeals, searchQuery]);

  // Repeat Business Fee Logic: (Total + Platform Fee % + 9% CGST + 9% SGST)
  // Printing/Shipping: ₹600 per 100 cards
  const calculateFees = (qty: number, voucherValue: number) => {
    const printingFee = (qty / 100) * 600;
    const baseTotal = qty * voucherValue;
    const platformFee = baseTotal * 0.05; // 5% Platform Fee
    const cgst = platformFee * 0.09;
    const sgst = platformFee * 0.09;
    const grandTotal = baseTotal + printingFee + platformFee + cgst + sgst;

    return { printingFee, platformFee, cgst, sgst, grandTotal };
  };

  const handleCreateDealPress = () => {
    if (!isProfileComplete) {
      // Pre-fill the form with existing profile data before showing modal
      setProfileForm({
        merchant_name: profile?.name || profile?.business_name || '',
        merchant_address: profile?.address || '',
        merchant_pincode: profile?.pincode || '',
        merchant_phone: profile?.phone || '',
        merchant_manager: profile?.merchantManager || '',
        merchant_category: profile?.category || '',
        account_name: profile?.account_name || '',
        ifsc_code: profile?.ifsc_code || '',
        account_number: profile?.account_number || '',
        gstin: profile?.gstin || '',
        pan: profile?.pan || '',
        gst: (profile?.gst || '0').toString(),
        signedContract: profile?.signedContract || false
      });
      setShowProfileModal(true);
    } else {
      setShowDealChoice(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const token = await AsyncStorage.getItem('merchantToken');
      
      // Validate required fields
      const required = ['merchant_name', 'merchant_address', 'merchant_pincode', 'merchant_phone', 'account_number'];
      for (const key of required) {
        if (!profileForm[key as keyof typeof profileForm]) {
          Alert.alert("Missing Info", `Please fill in ${key.replace('_', ' ')}`);
          setIsSavingProfile(false);
          return;
        }
      }

      const response = await axios.post(`${baseUrl}/merchant/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        Alert.alert("Success", "Profile completed! You can now create deals.");
        setShowProfileModal(false);
        loadData(); // Refresh profile state to update isProfileComplete
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const SummaryRow = ({ label, revenue, qty }: any) => (
    <View style={styles.tableRowSummary}>
      <Text style={[styles.rowLabel, { flex: 2 }]}>{label}</Text>
      <Text style={[styles.rowValue, { flex: 1, textAlign: 'right' }]}>₹{revenue || 0}</Text>
      <Text style={[styles.rowValue, { flex: 1, textAlign: 'right' }]}>{qty || 0}</Text>
    </View>
  );

  // --- 4. COUPON VALIDATION & REDEMPTION (TWO-STEP OTP) ---

  const handleValidateCoupon = async (code: string) => {
    if(!code) return;
    try {
      const token = await AsyncStorage.getItem('merchantToken');
      const merchantId = await AsyncStorage.getItem('merchantId');
      
      // Step 1: Initialize Validation (OTP Generation)
      const res = await axios.post(`${baseUrl}/merchant/send-coupon-otp`, 
        { couponCode: code, merchantId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 200) {
        Alert.prompt(
          "Customer OTP Required",
          `Verification code sent to the customer for code: ${code}. Ask the customer for the 6-digit OTP.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Confirm Redemption",
              onPress: async (otp?: string) => {
                if (!otp || otp.length < 4) return;
                try {
                  // Step 2: Verify OTP and Execute Transaction
                  await axios.post(`${baseUrl}/merchant/verify-coupon-otp`, 
                    { couponCode: code, otp: otp, verifiedBy: 'MerchantApp' },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  Alert.alert("Success ✅", "Coupon validated. Payment will be settled in the next cycle.");
                  setManualCode('');
                  loadData();
                } catch (err: any) {
                  Alert.alert("Validation Failed", "The OTP entered is incorrect or expired.");
                }
              }
            }
          ],
          'plain-text'
        );
      }
    } catch (error: any) {
      Alert.alert("Invalid Coupon", error.response?.data?.error || "This coupon is either expired or not assigned to your store.");
    }
  };


const renderBanners = () => (
    <View style={styles.bannerWrapper}>
      <FlatList
        ref={bannerRef}
        data={bannerData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        getItemLayout={(_, index) => ({
          length: width - 40,
          offset: (width - 40) * index,
          index,
        })}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / (width - 40));
          setActiveBanner(index);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.9} 
            style={styles.bannerSlide}
            onPress={handleImageClick} 
          >
            {/* Background Layer: Blurred for the 'Trust' feel */}
            <ImageBackground
              source={item}
              style={StyleSheet.absoluteFill}
              blurRadius={15}
            >
              <View style={styles.darkOverlay} />
            </ImageBackground>

            {/* Foreground Layer: Sharp and fully visible */}
            <Image 
              source={item} 
              style={styles.mainBannerImage} 
              resizeMode="contain" 
            />
          </TouchableOpacity>
        )}
      />
      
      {/* Indicator Dots */}
      <View style={styles.paginationDots}>
        {bannerData.map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.dot, 
              { backgroundColor: activeBanner === i ? '#2ec4b6' : '#cbd5e1' }
            ]} 
          />
        ))}
      </View>
    </View>
  );

  const handleImageClick = () => {
    // activeBanner tells us which slide the user is on
    if (activeBanner === 0) {
      // Logic for first image (e.g., Create New Deal)
      navigation.navigate('CreateDeal'); 
    } else if (activeBanner === 1) {
      // Logic for second image (e.g., Repeat Coupon)
      // openRepeatCouponPopup(); 
      Alert.alert("Action", "Repeat Coupon clicked!");
    }
  };

  // --- Define an Interface for the Razorpay Success Data ---
  interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  const handleTopup = async (amount: number) => {
    try {
      const merchantId = await AsyncStorage.getItem('merchantId');
      const token = await AsyncStorage.getItem('merchantToken');
      if (!merchantId) return;

      // 1. Create Order on Backend
      const response = await axios.post(`${baseUrl}/merchant/wallet/create-order`, { amount });
      const order = response.data;

      const options = {
        description: 'Wallet Top-up',
        image: '../../assets/DDLOGO.jpg', // Use a hosted URL for Razorpay UI
        currency: 'INR',
        key: 'rzp_live_R97aL9Rt5X0ZtW', 
        amount: order.amount, // This is amount * 100 from backend
        name: 'DiscountDost',
        order_id: order.id,
        prefill: { 
          email: profile?.email || '', 
          contact: profile?.phone || '', 
          name: profile?.name || '' 
        },
        theme: { color: '#2ec4b6' }
      };

      // 2. Open Razorpay
      RazorpayCheckout.open(options).then(async (data: RazorpaySuccessResponse) => {
        // 3. Verify Payment on Backend
        await axios.post(`${baseUrl}/merchant/wallet/verify`, {
          merchantId,
          amount,
          razorpay_payment_id: data.razorpay_payment_id, // Important for tracking
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Alert.alert("Success", "₹" + amount + " added to your wallet.");
        setTopupAmount(''); // Clear input
        loadData(); // Refresh balance
      }).catch((error: any) => {
        Alert.alert("Payment Cancelled", error.description || "Transaction not completed");
        console.log("Payment Failed:", error);
      });
    } catch (err) {
      console.error("Topup Error:", err);
      Alert.alert("Error", "Could not initiate top-up");
    }
  };

  const handleCouponInjection = async (codes: string[], amountPerCoupon: number) => {
    if (!wallet || !profile) {
      Alert.alert("Error", "Data not fully loaded.");
      return;
    }

    const merchantId = await AsyncStorage.getItem('merchantId');
    
    // --- DYNAMIC CALCULATIONS ---
    // Use the fee from profile, or default to 15
    const feePercentage = profile.voucher_platform_fee || 15;
    
    const count = codes.length;
    const baseAmount = count * amountPerCoupon;
    const platformFee = Number((baseAmount * (feePercentage / 100)).toFixed(2));
    
    // Tax is calculated on the Platform Fee
    const cgst = Number((platformFee * 0.09).toFixed(2));
    const sgst = Number((platformFee * 0.09).toFixed(2));
    const totalGst = cgst + sgst;
    
    const finalAmount = Number((baseAmount + platformFee + totalGst).toFixed(2));

    if (wallet.balance < finalAmount) {
      Alert.alert(
        "Insufficient Balance", 
        `Total required: ₹${finalAmount}\nBalance: ₹${wallet.balance}\n\nPlease top up.`
      );
      return;
    }

    // --- MATCH WEBSITE BREAKDOWN STYLE ---
    const breakdownMsg = [
      `Total Voucher Value: ₹${baseAmount.toFixed(2)}`,
      `Platform Fee (${feePercentage}%): ₹${platformFee.toFixed(2)}`,
      `CGST (9%): ₹${cgst.toFixed(2)}`,
      `SGST (9%): ₹${sgst.toFixed(2)}`,
      `--------------------------`,
      `TOTAL PAYABLE: ₹${finalAmount.toFixed(2)}`
    ].join('\n');

    Alert.alert(
      "Payment Breakdown",
      breakdownMsg,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm & Pay", 
          onPress: async () => {
            try {
              const res = await axios.post(`${baseUrl}/merchant/wallet/create-coupon`, {
                merchantId,
                couponCodes: codes,
                amount: amountPerCoupon
              });
              if(res.data.success) {
                Alert.alert("Success 🎉", "Coupons injected successfully.");
                setCouponCodesText('');
                setInjectionAmount('');
                setSelectedFileName('No file selected');
                loadData(); 
              }
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.error || "Injection failed.");
            }
          }
        }
      ]
    );
  };

  const handleGoldSellInitiate = async () => {
    try {
      const merchantId = await AsyncStorage.getItem('merchantId');
      if (!/^\d{10}$/.test(goldCustomerMobile)) {
        Alert.alert("Error", "Enter valid 10-digit mobile");
        return;
      }

      const res = await axios.post(`${baseUrl}/gold/merchant/gold-exchange/initiate`, {
        merchantId,
        mobile: goldCustomerMobile,
        amount: parseFloat(goldSellAmount)
      });

      if (res.data.otp_sent) {
        setActiveGoldTxId(res.data.tx_id);
        setShowGoldSellModal(false);
        setShowGoldOtpModal(true);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Initiate failed");
    }
  };

  const handleGoldOtpVerify = async () => {
    try {
      const res = await axios.post(`${baseUrl}/gold/merchant/gold-exchange/verify-otp`, {
        tx_id: activeGoldTxId,
        otp: goldOtp
      });

      Alert.alert(
        "Gold Sold Successfully ✅",
        `Amount Credited: ₹${res.data.sell_amount}\nGold Deducted: ${res.data.gold_grams}g`
      );

      // --- CLEANUP & REFRESH ---
      setShowGoldOtpModal(false);
      setGoldOtp('');
      setGoldCustomerMobile('');
      setGoldSellAmount('');
      setGoldPreview(null); // Clear the preview data
      
      loadData(); // <--- CRITICAL: Refresh wallet balance and recent transactions
      
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "OTP Verification failed");
    }
  };

  const handleFetchGoldPreview = async () => {
    try {
      const merchantId = await AsyncStorage.getItem('merchantId');
      if (!/^\d{10}$/.test(goldCustomerMobile)) {
        Alert.alert("Error", "Enter valid 10-digit mobile");
        return;
      }

      const res = await axios.post(`${baseUrl}/gold/merchant/gold-exchange/preview`, {
        merchantId,
        mobile: goldCustomerMobile
      });

      setGoldPreview(res.data.customer);
      setGoldSellAmount(res.data.customer.max_amount.toString()); // Auto-fill max amount
      Keyboard.dismiss();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Customer not found");
    }
  };

  const handleWithdrawalRequest = async () => {
    try {
      const merchantId = await AsyncStorage.getItem('merchantId');
      const amount = parseFloat(withdrawAmount);

      if (!amount || amount <= 0) {
        Alert.alert("Invalid Amount", "Please enter a valid amount to withdraw.");
        return;
      }

      if (amount > (wallet?.balance || 0)) {
        Alert.alert("Insufficient Balance", "You cannot withdraw more than your current balance.");
        return;
      }

      const res = await axios.post(`${baseUrl}/merchant/wallet/withdraw`, {
        merchantId,
        amount
      });

      if (res.data.success) {
        Alert.alert("Success ✅", "Withdrawal request submitted. It will be settled in your EOD payment.");
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        loadData(); // Refresh balance
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || "Withdrawal failed");
    }
  };

  const readSelectedFile = async (path: string) => {
    try {
      const cleanPath = path.startsWith('file://') ? path.replace('file://', '') : path;
      const fileContent = await RNFS.readFile(cleanPath, 'utf8');

      setCouponCodesText(prev => prev ? `${prev}\n${fileContent}` : fileContent);
      setSelectedFileName(path.split('/').pop() || 'File selected');
      
      Alert.alert("Success", "File content imported.");
    } catch (err) {
      console.error("Read Error:", err);
      Alert.alert("Error", "Could not read this file format as text.");
    }
  };

  // 2. CALL IT HERE in handleFilePicker
  const handleFilePicker = () => {
    FilePicker.showFilePicker({}, (response: any) => {
      if (response.didCancel) {
        console.log('User cancelled');
      } else if (response.error) {
        Alert.alert("Error", "Picker Error: " + response.error);
      } else {
        // --- THIS LINE MAKES THE FUNCTION ACTIVE AGAIN ---
        readSelectedFile(response.path); 
      }
    });
  };

  const [showLowWalletAlert, setShowLowWalletAlert] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false); // Track manual close

  useEffect(() => {
    if (wallet && wallet.enabled) {
      // Show only if balance is low AND they haven't clicked 'X' yet
      if (wallet.balance < 500 && !isDismissed) {
        setShowLowWalletAlert(true);
      } else if (wallet.balance >= 500) {
        setShowLowWalletAlert(false);
        setIsDismissed(false); // Reset dismissal if they top up
      }
    }
  }, [wallet, isDismissed]);

  return (
    <View style={styles.container}>
      {/* APPBAR */}
      <Appbar.Header style={styles.header}>
        {/* LEFT: Profile Icon (Always visible) */}
        {!isSearching && (
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileTouch}>
            <Avatar.Image 
              size={40} 
              source={profile?.logo ? { uri: profile.logo } : require('../../assets/placeholder.jpg')} 
              style={styles.profilePic} 
            />
          </TouchableOpacity>
        )}

        {/* CENTER / SEARCH BAR: Dynamic Transition */}
        {isSearching ? (
          <Searchbar
              placeholder="Search your deals..."
              onChangeText={handleSearch}
              value={searchQuery}
              style={styles.headerSearchbar}
              inputStyle={{ minHeight: 0, paddingBottom: 5 }} // Fixes text alignment
              icon="arrow-left" 
              onIconPress={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              onClearIconPress={() => setSearchQuery('')}
              autoFocus // Keyboard pops up immediately
              mode="bar" // Gives it a clean "material" look
            />
        ) : (
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/DDLOGO.jpg')} 
              style={styles.headerLogo} 
            />
          </View>
        )}

        {/* RIGHT ACTIONS: Grouped at the edge */}
        {!isSearching && (
          <View style={styles.rightActions}>
            <Appbar.Action 
              icon="magnify" 
              onPress={() => setIsSearching(true)} 
            />
            
            <View>
              <Appbar.Action 
                icon="bell-outline" 
                onPress={() => navigation.navigate('Notifications')} 
              />
              {unreadNotifications > 0 && (
                <Badge style={styles.notifBadge} size={16}>{unreadNotifications}</Badge>
              )}
            </View>

            <Appbar.Action 
              icon="logout" 
              onPress={() => {
                Alert.alert("Logout", "Sign out of your account?", [
                  { text: "No" }, 
                  { text: "Logout", onPress: async () => { await AsyncStorage.clear(); navigation.replace('Login'); } }
                ]);
              }} 
            />
          </View>
        )}
      </Appbar.Header>

      {showLowWalletAlert && (
        <View style={styles.wallet_notifWrapper}>
          <TouchableOpacity 
            style={styles.wallet_notifBanner} 
            onPress={() => setShowTopupModal(true)}
            activeOpacity={0.9}
          >
            <View style={styles.wallet_notifIconContainer}>
              <MaterialCommunityIcons name="wallet-warn" size={22} color="#b91c1c" />
            </View>
            
            <View style={styles.wallet_notifTextContent}>
              <Text style={styles.wallet_notifTitle}>Low Balance: ₹{wallet?.balance.toFixed(2)}</Text>
              <Text style={styles.wallet_notifSubtitle}>Tap to top-up and keep deals active.</Text>
            </View>

            {/* Manual Dismiss Button */}
            <TouchableOpacity 
              style={styles.wallet_dismissBtn} 
              onPress={(e) => {
                setShowLowWalletAlert(false);
                setIsDismissed(true);
              }}
            >
              <MaterialCommunityIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollRef} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[PRIMARY_COLOR]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO STATS CARD */}
        <View style={styles.heroSection}>
          <View style={styles.centeredWelcome}>
            <Text style={styles.welcomeText}>
              Welcome, {profile?.name || 'Merchant'}
            </Text>
          </View>

          <Card style={styles.salesSummaryCard}>
            <Card.Content>
              <Text style={styles.salesTitle}>Sales Summary</Text>
              
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.columnHeader, { flex: 2 }]}>Category</Text>
                <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Revenue</Text>
                <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Qty</Text>
              </View>

              {/* Section: Deals */}
              <SummaryRow 
                label="Deals – This Month" 
                revenue={summary?.monthDealRevenue} 
                qty={summary?.monthDealQty} 
              />
              <SummaryRow 
                label="Deals – Overall" 
                revenue={summary?.totalDealRevenue} 
                qty={summary?.totalDealQty} 
              />

              <Divider style={styles.tableDivider} />

              {/* Section: Gold Vouchers */}
              <SummaryRow 
                label="Gold Vouchers – This Month" 
                revenue={summary?.monthGoldRevenue} 
                qty={summary?.monthGoldQty} 
              />
              <SummaryRow 
                label="Gold Vouchers – Overall" 
                revenue={summary?.totalGoldRevenue} 
                qty={summary?.totalGoldQty} 
              />
            </Card.Content>
          </Card>
          {renderBanners()}
        </View>

        {/* DASHBOARD HUB ACTIONS */}
        <View style={styles.actionHub}>
          <Text style={styles.hubTitle}>Merchant Hub</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {wallet?.enabled && (
            <HubItem 
              icon="wallet-outline" 
              label="My Wallet" 
              color="#2ec4b6" 
              onPress={() => setShowWalletOptions(true)} 
            />
            )}
            <HubItem 
              icon="plus-box" 
              label="Create Deal" 
              color="#4361ee" 
              onPress={handleCreateDealPress} // Updated function call
            />
            <HubItem 
              icon="gold" 
              label="Buy Upsell" 
              color="#FAA307" 
              onPress={() => setShowUpsaleModal(true)} 
            />
            <HubItem 
              icon="cards-playing-outline" 
              label="Repeat Biz" 
              color="#6c5ce7" 
              onPress={() => setShowRepeatModal(true)} 
            />
            <HubItem 
              icon="information-outline" 
              label="More Info" 
              color="#ff5c5c" 
              onPress={() => setShowInfoModal(true)} 
            />
          </View>
          </ScrollView>
        </View>

        {/* GOLD VOUCHERS REDEEM SECTION */}
        <View onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          setSections(prev => ({ ...prev, vouchers: y }));
        }}>
          <Card style={styles.gv_tableCard}>
            <Card.Title 
              title="Gold Vouchers Redeem Section" 
              titleStyle={styles.gv_tableTitle} 
              right={() => (
                <Button onPress={clearFilters} textColor="#d9534f" labelStyle={{fontSize: 12}}>Clear</Button>
              )}
            />

            {/* FILTER SECTION */}
            <View style={styles.gv_filterContainer}>
              <View style={styles.gv_row}>
                {/* FROM DATE */}
                <TouchableOpacity 
                  style={styles.dateBox} 
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={styles.gv_dateText}>From: {startDate || "YYYY-MM-DD"}</Text>
                </TouchableOpacity>

                {/* TO DATE */}
                <TouchableOpacity 
                  style={styles.dateBox} 
                  onPress={() => setShowEndPicker(true)}
                >
                  <Text style={styles.gv_dateText}>To: {endDate || "YYYY-MM-DD"}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 12 }}>
                <Menu
                  visible={menuVisible}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={
                    <Button 
                      mode="outlined" 
                      onPress={() => setMenuVisible(true)}
                      icon="chevron-down"
                      contentStyle={{ flexDirection: 'row-reverse' }}
                      style={{ borderColor: '#ccc' }}
                    >
                      {statusFilter || "All Status"}
                    </Button>
                  }
                >
                  <Menu.Item onPress={() => {setStatusFilter(''); setMenuVisible(false)}} title="All Status" />
                  <Divider />
                  <Menu.Item onPress={() => {setStatusFilter('Unused'); setMenuVisible(false)}} title="Unused" />
                  <Menu.Item onPress={() => {setStatusFilter('Redeemed / Sent'); setMenuVisible(false)}} title="Redeemed / Sent" />
                </Menu>
              </View>

              {/* Native Android/iOS Date Pickers */}
              {showStartPicker && (
                <DateTimePicker
                  value={startDate ? new Date(startDate) : new Date()}
                  mode="date"
                  onChange={(event, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date.toISOString().split('T')[0]);
                  }}
                />
              )}

              {showEndPicker && (
                <DateTimePicker
                  value={endDate ? new Date(endDate) : new Date()}
                  mode="date"
                  onChange={(event, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date.toISOString().split('T')[0]);
                  }}
                />
              )}
            </View>

            <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
              <View>
                {/* TABLE HEADER */}
                <View style={styles.gv_tableRowHeader}>
                  <Text style={[styles.gv_cell, styles.gv_headerText, { width: 80 }]}>ID</Text>
                  <Text style={[styles.gv_cell, styles.gv_headerText, { width: 140 }]}>Date/Time</Text>
                  <Text style={[styles.gv_cell, styles.gv_headerText, { width: 90 }]}>Value (₹)</Text>
                  <Text style={[styles.gv_cell, styles.gv_headerText, { width: 110 }]}>Status</Text>
                  <Text style={[styles.gv_cell, styles.gv_headerText, { width: 90 }]}>Type</Text>
                  <Text style={[styles.gv_cell, styles.gv_headerText, { width: 160 }]}>Action</Text>
                </View>

                <View style={{ maxHeight: 400 }}>
                  <ScrollView nestedScrollEnabled={true}>
                    {combinedFilteredVouchers.length > 0 ? combinedFilteredVouchers.map((coupon, index) => {
                      const displayValue = coupon.subtotal || coupon.value || 0;
                      const displayType = coupon.type ? coupon.type.charAt(0).toUpperCase() + coupon.type.slice(1) : 'Upsell';

                      return (
                        <View key={coupon._id} style={[styles.gv_tableRow, { backgroundColor: index % 2 === 0 ? '#fff' : '#fcfcfc' }]}>
                          <Text style={[styles.gv_cell, { width: 80, fontWeight: '600' }]}>{getCouponId(coupon._id)}</Text>
                          
                          <Text style={[styles.gv_cell, { width: 140, fontSize: 10 }]}>
                            {new Date(coupon.createdAt).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit', hour12: true
                            })}
                          </Text>

                          <Text style={[styles.gv_cell, { width: 90, fontWeight: 'bold', color: getValueColor(displayValue) }]}>
                            ₹{displayValue.toFixed(2)}
                          </Text>

                          <View style={{ width: 110, paddingHorizontal: 5 }}>
                            <View style={[styles.gv_statusBadge, { 
                              backgroundColor: coupon.status === 'Unused' ? '#fff3cd' : '#d1ecf1',
                            }]}>
                              <Text style={{ fontSize: 9, fontWeight: 'bold', color: coupon.status === 'Unused' ? '#856404' : '#0c5460' }}>
                                {coupon.status === 'Unused' ? 'UNUSED' : 'REDEEMED'}
                              </Text>
                            </View>
                          </View>

                          <Text style={[styles.gv_cell, { width: 90, color: '#666', fontSize: 11 }]}>{displayType}</Text>

                          <View style={{ width: 160, flexDirection: 'row', paddingLeft: 5 }}>
                            {coupon.status === 'Unused' ? (
                              <>
                                <TouchableOpacity 
                                  style={[styles.gv_actionBtn, { backgroundColor: '#28a745' }]} 
                                  onPress={() => setRedeemModal({ ...redeemModal, visible: true, coupon })}
                                >
                                  <Text style={styles.gv_actionBtnText}>Redeem</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  style={[styles.gv_actionBtn, { backgroundColor: '#d9534f', marginLeft: 5 }]} 
                                  onPress={() => handleRefund(coupon._id, coupon.gateway || 'manual', displayValue)}
                                >
                                  <Text style={styles.gv_actionBtnText}>Refund</Text>
                                </TouchableOpacity>
                              </>
                            ) : (
                              <TouchableOpacity 
                                style={[styles.gv_actionBtn, { backgroundColor: '#3498db', width: 120 }]} 
                                onPress={() => setViewCouponData(coupon)}
                              >
                                <Text style={styles.gv_actionBtnText}>View Details &gt;</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    }) : (
                      <View style={{padding: 20, alignItems: 'center', width: 670}}>
                        <Text style={{color: '#999'}}>No vouchers found for selected filters.</Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </View>
            </ScrollView>
          </Card>
        </View>

        <View onLayout={(event) => {
          const { y } = event.nativeEvent.layout;
          setSections(prev => ({ ...prev, transactions: y }));
        }}>

        <Card style={styles.tableCard}>
          <Card.Title title="Recent Transactions" titleStyle={styles.tableTitle} />
          
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
            <View>
              {/* TABLE HEADER */}
              <View style={styles.tableRowHeader}>
                <Text style={[styles.cell, styles.headerText, { width: 150 }]}>Transaction ID</Text>
                <Text style={[styles.cell, styles.headerText, { width: 140 }]}>Date & Time</Text>
                <Text style={[styles.cell, styles.headerText, { width: 100 }]}>Type</Text>
                <Text style={[styles.cell, styles.headerText, { width: 100 }]}>Amount</Text>
                <Text style={[styles.cell, styles.headerText, { width: 130 }]}>Invoice</Text>
              </View>

              {/* TABLE BODY */}
              <View style={{ maxHeight: showAllTransactions ? undefined : 450 }}>
                {recentTransactions.length > 0 ? (
                  recentTransactions
                    .slice(0, showAllTransactions ? recentTransactions.length : 10)
                    .map((tx, index) => (
                      <View key={tx._id} style={[styles.tableRow, { backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }]}>
                        <Text style={[styles.cell, { width: 150, fontSize: 11 }]}>{tx.orderId || "N/A"}</Text>
                        
                        <Text style={[styles.cell, { width: 140, fontSize: 11 }]}>
                          {new Date(tx.createdAt).toLocaleString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit", hour12: true,
                          })}
                        </Text>

                        <View style={{ width: 100, padding: 8 }}>
                          <View style={[
                            styles.statusBadge, 
                            { backgroundColor: tx.type === "Repeat" ? "#6c5ce7" : "#fb8500" }
                          ]}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{tx.type}</Text>
                          </View>
                        </View>

                        <Text style={[styles.cell, { width: 100, fontWeight: 'bold' }]}>₹{tx.finalAmount?.toFixed(2)}</Text>

                        <View style={{ width: 130, padding: 8 }}>
                          {tx.invoice_url ? (
                            <TouchableOpacity 
                              style={styles.invoiceBtn} 
                              onPress={() => handleOpenInvoice(tx.invoice_url!)}
                            >
                              <Text style={styles.invoiceBtnText}>View Invoice</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={{ color: "#888", fontSize: 11 }}>Generating...</Text>
                          )}
                        </View>
                      </View>
                    ))
                ) : (
                  <View style={{ padding: 20, alignItems: 'center', width: 620 }}>
                    <Text style={{ color: '#888' }}>No recent transactions yet</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {recentTransactions.length > 10 && (
            <Button 
              mode="text" 
              onPress={() => setShowAllTransactions(!showAllTransactions)}
              style={{ marginVertical: 10 }}
            >
              {showAllTransactions ? "View Less" : "View More"}
            </Button>
          )}
        </Card>
        </View>

        {/* GOLD DEALS VALIDATE SECTION */}
        <Card style={styles.cv_card}>
          <Card.Title title="Gold Deals Coupons Validate" titleStyle={styles.cv_title} />
          
          <Card.Content style={{ padding: 0 }}>
            {/* Manual Input Row */}
            <View style={styles.cv_inputRow}>
              <TextInput
                style={styles.cv_manualInput}
                mode="outlined"
                placeholder="Enter Coupon Code"
                value={manualCode}
                onChangeText={setManualCode}
                outlineColor="#ddd"
                activeOutlineColor="#eb8934"
              />
              <Button 
                mode="contained" 
                onPress={() => handleValidateRequest(manualCode)} 
                buttonColor="#eb8934"
                style={{ height: 48, justifyContent: 'center' }}
              >
                Send
              </Button>
            </View>

            <Button 
              icon="qrcode-scan" 
              mode="outlined" 
              onPress={() => {
                navigation.navigate('ScannerScreen', {
                  onScan: (code: string) => {
                    setManualCode(code);
                    handleValidateRequest(code);
                  }
                });
              }}
              style={styles.cv_scanBtn}
              textColor="#f39c12"
            >
              Scan Coupon QR
            </Button>
          </Card.Content>

          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
            <View style={styles.cv_tableContainer}>
              {/* TABLE HEADER */}
              <View style={styles.cv_headerRow}>
                <Text style={[styles.cv_headerText, { width: 140 }]}>Date Purchased</Text>
                <Text style={[styles.cv_headerText, { width: 100 }]}>Coupon</Text>
                <Text style={[styles.cv_headerText, { width: 150 }]}>Deal Title</Text>
                <Text style={[styles.cv_headerText, { width: 120 }]}>Customer</Text>
                <Text style={[styles.cv_headerText, { width: 90 }]}>Status</Text>
                <Text style={[styles.cv_headerText, { width: 140 }]}>Validated Time</Text>
                <Text style={[styles.cv_headerText, { width: 80 }]}>Value</Text>
              </View>

              {/* TABLE BODY */}
              <View style={{ maxHeight: 400 }}>
                <ScrollView nestedScrollEnabled={true}>
                  {issuedCoupons.length === 0 ? (
                    <Text style={{ textAlign: 'center', padding: 20, color: '#999' }}>No coupons found</Text>
                  ) : (
                    issuedCoupons.map((coupon, index) => (
                      <View key={coupon.couponCode} style={[styles.cv_row, { backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }]}>
                        <Text style={[styles.cv_cellText, { width: 140 }]}>
                          {coupon.createdAt ? new Date(coupon.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                        </Text>
                        
                        <Text style={[styles.cv_cellText, { width: 100, fontWeight: 'bold' }]}>{coupon.couponCode}</Text>
                        
                        <Text style={[styles.cv_cellText, { width: 150 }]} numberOfLines={1}>{coupon.dealTitle}</Text>
                        
                        <Text style={[styles.cv_cellText, { width: 120 }]}>{coupon.customerName || "N/A"}</Text>
                        
                        <View style={{ width: 90, paddingHorizontal: 8 }}>
                          <Text style={coupon.status === 'Validated' ? styles.cv_statusValidated : styles.cv_statusIssued}>
                            {coupon.status}
                          </Text>
                        </View>

                        <Text style={[styles.cv_cellText, { width: 140 }]}>
                          {coupon.validatedAt ? new Date(coupon.validatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </Text>

                        {/* VALUE FIX: Checking multiple possible keys from API */}
                        <Text style={[styles.cv_valueText, { width: 80 }]}>
                          ₹{coupon.value || (coupon as any).dealValue || (coupon as any).amount || 0}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </Card>

        {/* DEALS UNDER APPROVAL SECTION */}
        <View style={styles.ua_section}>
          <Text style={styles.ua_sectionTitle}>Deals Under Approval</Text>
          
          {filteredPending.length === 0 ? (
            <View style={styles.emptySearchContainer}>
             <IconButton icon="magnify-remove" size={40} iconColor="#ccc" />
            <Text style={styles.ua_emptyText}>
              {searchQuery ? "No pending deals match your search." : "No deals are under approval."}
            </Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              {filteredPending.map((deal) => (
                <Card key={deal._id} style={styles.ua_dealCard}>
                  <Card.Cover 
                    source={{ 
                      uri: deal.images?.[0]?.startsWith('http') 
                        ? deal.images[0] 
                        : `${DEAL_IMAGE_BASE_URL}${deal.images?.[0]}` 
                    }} 
                    style={styles.ua_dealImage} 
                  />
                  
                  <Card.Content style={styles.ua_cardContent}>
                    <Text style={styles.ua_dealTitle} numberOfLines={1}>{deal.title}</Text>
                    
                    {/* Website Sync: Red Status Badge */}
                    <View style={styles.ua_statusBadge}>
                      <Text style={styles.ua_statusText}>🔴 Under Approval</Text>
                    </View>

                    <Text style={styles.ua_dealDesc} numberOfLines={2}>
                      {deal.description}
                    </Text>

                    <View style={styles.ua_priceRow}>
                      <Text style={styles.ua_mrpText}>MRP: ₹{deal.mrp}</Text>
                      <Text style={styles.ua_discountText}>Discount: {deal.discountValue}%</Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          )}
        </View>

        {/* APPROVED DEALS SECTION */}
        <View style={styles.ad_section}>
          <Text style={styles.ad_sectionTitle}>Approved Deals</Text>
          {filteredApproved.length === 0 ? (
            <View style={styles.ad_emptyBox}>
              <Text style={styles.ad_emptyText}>
                {searchQuery ? "No deals match your search." : "No approved deals yet."}
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 5 }}>
              {filteredApproved.map((deal) => (
                <Card key={deal._id} style={styles.ad_dealCard}>
                  <Card.Cover 
                    source={{ 
                      uri: deal.images?.[0]?.startsWith('http') 
                        ? deal.images[0] 
                        : `${DEAL_IMAGE_BASE_URL}${deal.images?.[0]}` 
                    }} 
                    style={styles.ad_dealImage} 
                  />
                  <Card.Content style={styles.ad_cardContent}>
                    <Text style={styles.ad_dealTitle} numberOfLines={1}>{deal.title}</Text>
                    
                    <Text style={styles.ad_expiryText}>
                      ⏳ Expires: {new Date(deal.endDate).toLocaleDateString("en-IN")}
                    </Text>

                    <View style={styles.ad_priceRow}>
                      <Text style={styles.ad_mrp}>MRP: <Text style={{fontWeight: 'bold'}}>₹{deal.mrp}</Text></Text>
                      <Text style={styles.ad_discount}>{deal.discountValue}% OFF</Text>
                    </View>

                    <Button 
                      mode="contained" 
                      icon="pencil"
                      onPress={() => {
                        setSelectedDeal(deal);
                        setEditForm({
                          title: deal.title, 
                          mrp: deal.mrp.toString(),
                          discountValue: deal.discountValue.toString(),
                          description: deal.description, 
                          terms: deal.terms,
                          newImages: []
                        });
                      }}
                      style={styles.ad_editBtn}
                      buttonColor="#3498db"
                    >
                      Edit Deal
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ height: 100 }} />

        <Modal
          visible={showDealChoice}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDealChoice(false)}
        >
          <View style={styles.modalOverlay}>
              <View style={styles.bottomSheet}>
                <View style={styles.dragHandle} />
                <Text style={styles.modalTitle}>Create New Deal</Text>
                <Text style={styles.modalSub}>How would you like to set up your voucher?</Text>
                
                {/* 1. PROCEED MANUALLY - Now Bold & Primary */}
                <Button 
                  mode="contained" 
                  buttonColor={PRIMARY_COLOR} 
                  style={styles.choiceBtn}
                  labelStyle={styles.choiceBtnLabelBold} // Custom bold style
                  onPress={() => { 
                    setShowDealChoice(false); 
                    navigation.navigate('CreateDeal', { mode: 'manual' }); 
                  }}
                >
                  PROCEED MANUALLY
                </Button>
                
                {/* 2. USE AUTO-FILLED - Secondary Look */}
                <Button 
                  mode="outlined" 
                  textColor={PRIMARY_COLOR}
                  style={[styles.choiceBtn, { borderColor: PRIMARY_COLOR, borderWidth: 1 }]} 
                  labelStyle={{ fontWeight: '600' }}
                  onPress={() => { 
                    setShowDealChoice(false); 
                    navigation.navigate('CreateDeal', { mode: 'auto' }); 
                  }}
                >
                  Use Auto-Filled
                </Button>

                <TouchableOpacity onPress={() => setShowDealChoice(false)} style={styles.cancelContainer}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
        </Modal>

        <Modal visible={showProfileModal} animationType="slide">
          <Appbar.Header style={{ backgroundColor: '#FFF' }}>
            <Appbar.Action icon="close" onPress={() => setShowProfileModal(false)} />
            <Appbar.Content title="Complete Business Profile" />
          </Appbar.Header>

          <ScrollView style={{ backgroundColor: '#F8F9FA', padding: 20 }}>
            <Text style={styles.formSectionLabel}>Business Info</Text>
            <TextInput 
              label="Merchant Name" 
              mode="outlined" 
              style={styles.modalInput}
              value={profileForm.merchant_name}
              onChangeText={(val) => setProfileForm({...profileForm, merchant_name: val})}
            />
            <TextInput 
              label="Full Address" 
              mode="outlined" 
              multiline
              style={styles.modalInput}
              value={profileForm.merchant_address}
              onChangeText={(val) => setProfileForm({...profileForm, merchant_address: val})}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput 
                label="Pincode" 
                mode="outlined" 
                style={[styles.modalInput, { flex: 1 }]}
                keyboardType="numeric"
                value={profileForm.merchant_pincode}
                onChangeText={(val) => setProfileForm({...profileForm, merchant_pincode: val})}
              />
              <TextInput 
                label="Phone" 
                mode="outlined" 
                style={[styles.modalInput, { flex: 1 }]}
                keyboardType="phone-pad"
                value={profileForm.merchant_phone}
                onChangeText={(val) => setProfileForm({...profileForm, merchant_phone: val})}
              />
            </View>

            <Text style={[styles.formSectionLabel, { marginTop: 20 }]}>Bank Details (For Settlements)</Text>
            <TextInput 
              label="Account Holder Name" 
              mode="outlined" 
              style={styles.modalInput}
              value={profileForm.account_name}
              onChangeText={(val) => setProfileForm({...profileForm, account_name: val})}
            />
            <TextInput 
              label="Account Number" 
              mode="outlined" 
              style={styles.modalInput}
              keyboardType="numeric"
              value={profileForm.account_number}
              onChangeText={(val) => setProfileForm({...profileForm, account_number: val})}
            />
            <TextInput 
              label="IFSC Code" 
              mode="outlined" 
              style={styles.modalInput}
              autoCapitalize="characters"
              value={profileForm.ifsc_code}
              onChangeText={(val) => setProfileForm({...profileForm, ifsc_code: val})}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 15 }}>
              <IconButton 
                icon={profileForm.signedContract ? "checkbox-marked" : "checkbox-blank-outline"} 
                iconColor={PRIMARY_COLOR}
                onPress={() => setProfileForm({...profileForm, signedContract: !profileForm.signedContract})}
              />
              <Text style={{ flex: 1, fontSize: 12 }}>I agree to the DiscountDost Merchant Contract</Text>
            </View>

            <Button 
              mode="contained" 
              onPress={handleSaveProfile} 
              loading={isSavingProfile}
              style={{ borderRadius: 10, paddingVertical: 5, marginBottom: 50 }}
              buttonColor={PRIMARY_COLOR}
            >
              SAVE PROFILE & CONTINUE
            </Button>
          </ScrollView>
        </Modal>
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        {/* 1. HOME: Scroll to top (Y: 0) */}
        <NavItem 
          icon="home" 
          label="Home" 
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} 
        />

        {/* 2. VOUCHER: Scroll to Gold Vouchers section */}
        <NavItem 
          icon="ticket-percent" 
          label="Voucher" 
          onPress={() => scrollRef.current?.scrollTo({ y: sections.vouchers, animated: true })} 
        />

        <NavItem 
          icon="qrcode-scan" 
          label="Redeem" 
          onPress={() => {
            navigation.navigate('ScannerScreen', {
              onScan: (code: string) => handleValidateRequest(code) // Use your existing validation logic
            });
          }} 
        />

        {/* 3. TRANSACTION: Scroll to Recent Transactions section */}
        <NavItem 
          icon="swap-horizontal" 
          label="Transaction" 
          onPress={() => scrollRef.current?.scrollTo({ y: sections.transactions, animated: true })} 
        />

        <NavItem 
          icon="help-circle-outline" 
          label="Help" 
          onPress={() => Linking.openURL('https://discountdost.com/partner-with-us?inapp=true')} 
        />
      </View>
      
      {/* CENTRAL QR ACTION */}
      <TouchableOpacity 
        style={styles.centerFab} 
        onPress={() => {
          navigation.navigate('ScannerScreen', {
            onScan: (code: string) => handleValidateRequest(code)
          });
        }}
      >
        <IconButton icon="qrcode-scan" iconColor="#FFF" size={30} />
      </TouchableOpacity>

      {/* MODALS */}
      <Modal visible={settlementModal} animationType="slide" transparent>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <Text style={styles.hubTitle}>Settlement Details (BulkPe)</Text>
               <Divider style={{marginVertical: 10}} />
               <Text>Merchant ID: {profile?.merchantId}</Text>
               <Text>Pending Settlement: ₹{summary?.pendingSettlement}</Text>
               <Text>Last Paid: {settlements[0]?.paidAt || 'N/A'}</Text>
               <Button mode="contained" style={{marginTop: 20}} buttonColor={PRIMARY_COLOR} onPress={() => setSettlementModal(false)}>Close</Button>
            </View>
         </View>
      </Modal>

      {/* --- BUY UPSELL MODAL (Matches Web Swal2 Flow) --- */}
      <Portal>
        <PaperModal visible={showUpsaleModal} onDismiss={() => setShowUpsaleModal(false)} contentContainerStyle={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Buy Gold Vouchers</Text>
            
            <TextInput
              label="Number of Coupons"
              mode="outlined"
              keyboardType="numeric"
              value={couponCount}
              onChangeText={setCouponCount}
              style={styles.input}
            />
            
            <TextInput
              label="Value per Voucher (min ₹10)"
              mode="outlined"
              keyboardType="numeric"
              value={couponValue}
              onChangeText={setCouponValue}
              style={styles.input}
            />

            {count > 0 && value >= 10 && (
              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownTitle}>Fee Breakdown</Text>
                <View style={styles.feeRow}><Text>Gold Value</Text><Text>₹{totalGoldValue.toFixed(2)}</Text></View>
                <View style={styles.feeRow}><Text>Platform Fee ({platformFeePercent}%)</Text><Text>₹{platformFee.toFixed(2)}</Text></View>
                <View style={styles.feeRow}><Text>GST (18%)</Text><Text>₹{(cgst + sgst).toFixed(2)}</Text></View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.feeRow}><Text style={styles.totalText}>Final Payable</Text><Text style={styles.totalText}>₹{finalPayable.toFixed(2)}</Text></View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button mode="text" onPress={() => setShowUpsaleModal(false)}>Cancel</Button>
              <Button 
                mode="contained" 
                onPress={handlePayment} 
                loading={paying} 
                buttonColor={PRIMARY_COLOR}
              >
                Proceed to Pay
              </Button>
            </View>
          </View>
        </PaperModal>

        <PaperModal 
          visible={showRepeatModal} 
          onDismiss={() => setShowRepeatModal(false)} 
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalContent}>
            <Text style={[styles.modalHeader, { color: '#6c5ce7' }]}>Buy Repeat Business Vouchers</Text>
            
            <TextInput
              label="Number of coupons"
              mode="outlined"
              keyboardType="numeric"
              value={repeatCount}
              onChangeText={setRepeatCount}
              style={styles.input}
            />
            
            <TextInput
              label="Value (min ₹10)"
              mode="outlined"
              keyboardType="numeric"
              value={repeatValue}
              onChangeText={setRepeatValue}
              style={styles.input}
            />

            {rCount > 0 && rValue >= 10 && (
              <View style={styles.breakdownBox}>
                <View style={styles.feeRow}><Text>Base Amount</Text><Text>₹{rBaseAmount.toFixed(2)}</Text></View>
                <View style={styles.feeRow}>
                  <Text>Print + Shipping{"\n"}<Text style={{fontSize:10, color:'#888'}}>₹600 per 100 cards</Text></Text>
                  <Text>₹{rExtraFee.toFixed(2)}</Text>
                </View>
                <View style={styles.feeRow}><Text>Platform Fee ({platformFeePercent}%)</Text><Text>₹{rPlatformFee.toFixed(2)}</Text></View>
                <View style={styles.feeRow}><Text>GST (18%)</Text><Text>₹{(rCgst + rSgst).toFixed(2)}</Text></View>
                <Divider style={{ marginVertical: 8 }} />
                <View style={styles.feeRow}><Text style={styles.totalText}>Final Payable</Text><Text style={styles.totalText}>₹{rFinalPayable.toFixed(2)}</Text></View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button onPress={() => setShowRepeatModal(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleRepeatPayment} loading={paying} buttonColor="#6c5ce7">
                Proceed to Pay
              </Button>
            </View>
          </View>
        </PaperModal>

        <PaperModal 
          visible={showInfoModal} 
          onDismiss={() => setShowInfoModal(false)} 
          contentContainerStyle={styles.infoModalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>More Information</Text>

            {/* TABS (Matches Web Buttons) */}
            <View style={styles.tabRow}>
              <TouchableOpacity 
                style={[styles.tabButton, infoTab === 'gold' ? styles.tabActiveGold : styles.tabInactive]} 
                onPress={() => setInfoTab('gold')}
              >
                <Text style={styles.tabButtonText}>Gold Vouchers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tabButton, infoTab === 'return' ? styles.tabActiveReturn : styles.tabInactive]} 
                onPress={() => setInfoTab('return')}
              >
                <Text style={styles.tabButtonText}>Return Cards</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.infoScroll}>
              {infoTab === 'gold' ? (
                <View>
                  <Text style={[styles.infoTitle, { color: '#e74c3c' }]}>Buy Gold Reward Vouchers</Text>
                  <Text style={styles.infoDescription}>
                    Corporate Gold Vouchers are pre-purchased gold rewards that you can distribute 
                    to your loyal customers. Each Voucher is secure, validated via OTP, and fully 
                    trackable in your dashboard.{"\n\n"}
                    Use them as a powerful tool to retain customers, celebrate special occasions, 
                    or reward big spenders, while adding a premium ‘gold’ touch to your brand.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={[styles.infoTitle, { color: '#6c5ce7' }]}>Give Customers a Reason to Return</Text>
                  <Text style={styles.infoDescription}>
                    Business Return Cards are physical cards you can give customers at checkout 
                    to bring them back to your store. When they return and present the card, you 
                    validate it, and they earn digital gold as a reward.{"\n\n"}
                    This simple card-based system boosts repeat visits and ensures your customers 
                    keep choosing you over competitors.
                  </Text>

                  <View style={styles.noteBox}>
                    <Text style={styles.noteText}>
                      <Text style={{ fontWeight: 'bold' }}>Note: </Text>
                      Each set of <Text style={{ fontWeight: 'bold' }}>100 Repeat Gold Vouchers</Text> includes a nominal 
                      <Text style={{ fontWeight: 'bold' }}> ₹600 Print & Shipping Fee</Text>. This covers high-quality printing, 
                      lamination, and doorstep delivery.{"\n\n"}
                      Applied in multiples: ₹600 for 100 cards, ₹1200 for 200 cards, etc.
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <Button mode="text" onPress={() => setShowInfoModal(false)} style={{ marginTop: 10 }}>
              Close
            </Button>
          </View>
        </PaperModal>

        {/* REDEEM MODAL */}
        <Portal>
          <PaperModal visible={redeemModal.visible} onDismiss={() => setRedeemModal({ ...redeemModal, visible: false })} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalHeader}>Redeem Coupon</Text>
            <TextInput label="Customer Phone" mode="outlined" keyboardType="numeric" value={redeemModal.phone} onChangeText={t => setRedeemModal({ ...redeemModal, phone: t })} style={styles.input} />
            <TextInput label="Merchant Transaction ID" mode="outlined" value={redeemModal.txn} onChangeText={t => setRedeemModal({ ...redeemModal, txn: t })} style={styles.input} />
            <Button mode="contained" onPress={handleRedeemSubmit} buttonColor="#28a745" style={{ marginTop: 10 }}>Confirm Redemption</Button>
          </PaperModal>

          {/* VIEW DETAILS MODAL */}
          <PaperModal 
            visible={!!viewCouponData} 
            onDismiss={() => setViewCouponData(null)} 
            contentContainerStyle={styles.modalContent}
          >
            <Text style={styles.modalHeader}>Redeemed Details</Text>
            {viewCouponData && (
              <View style={{ gap: 8 }}>
                <Text><Text style={{fontWeight: 'bold'}}>Code:</Text> {getCouponId(viewCouponData._id)}</Text>
                <Text><Text style={{fontWeight: 'bold'}}>Customer:</Text> {viewCouponData.customerPhone || 'N/A'}</Text>
                <Text><Text style={{fontWeight: 'bold'}}>Txn ID:</Text> {viewCouponData.merchantTransactionId || 'N/A'}</Text>
                <Text><Text style={{fontWeight: 'bold'}}>Value:</Text> ₹{viewCouponData.subtotal || viewCouponData.value}</Text>
                <Text>
                  <Text style={{fontWeight: 'bold'}}>Redeemed At:</Text> {
                    viewCouponData.redeemedAt 
                      ? new Date(viewCouponData.redeemedAt).toLocaleString('en-IN') 
                      : 'Not yet redeemed'
                  }
                </Text>
              </View>
            )}
            <Button mode="contained" onPress={() => setViewCouponData(null)} style={{marginTop: 20}}>Close</Button>
          </PaperModal>
        </Portal>

        {/* OTP MODAL */}
        <Portal>
          <PaperModal 
            visible={otpModal.visible} 
            onDismiss={() => setOtpModal({ ...otpModal, visible: false })}
            contentContainerStyle={styles.modalContent}
          >
            <Text style={styles.modalHeader}>Verify Customer OTP</Text>
            <Text style={{ marginBottom: 10, color: '#666' }}>Enter the OTP sent to customer for {otpModal.couponCode}</Text>
            <TextInput
              label="6-Digit OTP"
              keyboardType="numeric"
              maxLength={6}
              value={otpModal.otp}
              onChangeText={t => setOtpModal({ ...otpModal, otp: t })}
              mode="outlined"
              style={{ marginBottom: 20 }}
            />
            <Button mode="contained" onPress={verifyCouponOTP} buttonColor="#28a745">
              Validate & Redeem
            </Button>
          </PaperModal>
        </Portal>
        {/* Wallet Modal */}
        <Modal visible={showWalletOptions} transparent animationType="slide">
          <TouchableOpacity 
            style={styles.wallet_modalOverlay} 
            onPress={() => setShowWalletOptions(false)} 
          />
          <View style={styles.wallet_bottomSheet}>
            <Text style={styles.wallet_modalTitle}>My Wallet</Text>
            
            <TouchableOpacity 
              style={styles.wallet_optionButton} 
              onPress={() => { 
                setShowWalletOptions(false); 
                setShowWalletActionChoice(true); // <--- OPEN CHOICE MODAL
              }}
            >
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#2ec4b6" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.wallet_optionText}>Wallet Balance</Text>
                <Text style={styles.wallet_optionSubtext}>Balance: ₹{wallet?.balance?.toFixed(2) || '0.00'}</Text>
              </View>
            </TouchableOpacity>

            {/* CHANGE: Check profile instead of wallet */}
            {profile?.gold_sell_enabled && (
              <TouchableOpacity 
                style={styles.wallet_optionButton} 
                onPress={() => { setShowWalletOptions(false); setShowGoldSellModal(true); }}
              >
                <MaterialCommunityIcons name="gold" size={24} color="#FAA307" />
                <View style={{marginLeft: 15}}>
                  <Text style={styles.wallet_optionText}>Gold Exchange (Sell Gold)</Text>
                  <Text style={styles.wallet_optionSubtext}>Sell customer gold for cash/goods</Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.wallet_optionButton} 
              onPress={() => { setShowWalletOptions(false); setShowCouponInjectionModal(true); }}
            >
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="#6c5ce7" />
              <View style={{marginLeft: 15}}>
                <Text style={styles.wallet_optionText}>Coupon Code Injection</Text>
                <Text style={styles.wallet_optionSubtext}>Inject external coupons via wallet</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
        {/* Wallet Action Choice (Topup vs Withdraw) */}
        <Modal visible={showWalletActionChoice} transparent animationType="fade">
          <View style={styles.wallet_modalOverlay}>
            <View style={[styles.wallet_bottomSheet, { minHeight: 200 }]}>
              <Text style={styles.wallet_modalTitle}>Manage Balance</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <TouchableOpacity 
                  style={[styles.wallet_proceedBtn, { flex: 1, backgroundColor: '#2ec4b6' }]}
                  onPress={() => { setShowWalletActionChoice(false); setShowTopupModal(true); }}
                >
                  <Text style={styles.wallet_proceedBtnText}>💰 Top-up</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.wallet_proceedBtn, { flex: 1, backgroundColor: '#3498db' }]}
                  onPress={() => { setShowWalletActionChoice(false); setShowWithdrawModal(true); }}
                >
                  <Text style={styles.wallet_proceedBtnText}>🏦 Withdraw</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setShowWalletActionChoice(false)} style={{ marginTop: 20, alignItems: 'center' }}>
                <Text style={{ color: '#64748b' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Withdraw Entry Modal */}
        <Modal visible={showWithdrawModal} transparent animationType="slide">
          <View style={styles.wallet_modalOverlay}>
            <View style={styles.wallet_bottomSheet}>
              <Text style={styles.wallet_modalTitle}>Withdraw to Bank</Text>
              <Text style={{ textAlign: 'center', color: '#64748b', marginBottom: 10 }}>
                Available: ₹{wallet?.balance?.toFixed(2)}
              </Text>
              
              <Text style={styles.wallet_inputLabel}>Amount to Withdraw (₹)</Text>
              <TextInput
                style={styles.wallet_amountInput}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />

              <TouchableOpacity style={[styles.wallet_proceedBtn, { backgroundColor: '#3498db' }]} onPress={handleWithdrawalRequest}>
                <Text style={styles.wallet_proceedBtnText}>Request Withdrawal</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowWithdrawModal(false)} style={{ marginTop: 15, alignItems: 'center' }}>
                <Text style={{ color: '#ef4444' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Top-up Amount Entry Modal */}
        <Modal visible={showTopupModal} transparent animationType="fade">
          <View style={styles.wallet_modalOverlay}>
            <View style={styles.wallet_bottomSheet}>
              <Text style={styles.wallet_modalTitle}>Top-up Wallet</Text>
              
              <Text style={styles.wallet_inputLabel}>Enter Amount (₹)</Text>
              <TextInput
                style={styles.wallet_amountInput}
                placeholder="e.g. 500"
                keyboardType="numeric"
                value={topupAmount}
                onChangeText={setTopupAmount}
              />

              <TouchableOpacity 
                style={styles.wallet_proceedBtn}
                onPress={() => {
                  const amt = parseFloat(topupAmount);
                  if (amt > 0) {
                    setShowTopupModal(false);
                    handleTopup(amt); // Now it's not invisible!
                  } else {
                    Alert.alert("Invalid Amount", "Please enter a valid number");
                  }
                }}
              >
                <Text style={styles.wallet_proceedBtnText}>Proceed to Pay</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ marginTop: 15, alignItems: 'center' }}
                onPress={() => setShowTopupModal(false)}
              >
                <Text style={{ color: '#ef4444' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Injection Modal */}
        <Modal visible={showCouponInjectionModal} transparent animationType="slide">
          <View style={styles.wallet_modalOverlay}>
            <View style={[styles.wallet_bottomSheet, { minHeight: 500 }]}>
              <Text style={styles.wallet_modalTitle}>Coupon Injection</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.wallet_inputLabel}>Coupon Codes (comma separated)</Text>
                <TextInput
                  style={styles.wallet_textArea}
                  multiline
                  placeholder="ENTER CODES HERE..."
                  value={couponCodesText}
                  onChangeText={setCouponCodesText}
                />

                <TouchableOpacity 
                  style={styles.wallet_filePickerBtn} 
                  onPress={handleFilePicker} // <--- Added here
                >
                  <MaterialCommunityIcons name="file-upload-outline" size={20} color="#64748b" />
                  <Text style={{ marginLeft: 8, color: '#64748b', fontWeight: '600' }}>
                    Import Coupon File
                  </Text>
                </TouchableOpacity>

                <Text style={styles.wallet_fileName}>{selectedFileName}</Text>

                <Text style={styles.wallet_inputLabel}>Amount per Coupon (₹)</Text>
                <TextInput
                  style={styles.wallet_amountInput}
                  placeholder="Enter Amount"
                  keyboardType="numeric"
                  value={injectionAmount}
                  onChangeText={setInjectionAmount}
                />

                <TouchableOpacity 
                  style={styles.wallet_proceedBtn}
                  onPress={() => {
                    const codes = couponCodesText.split(/[\n,]+/).map(c => c.trim()).filter(Boolean);
                    const amt = parseFloat(injectionAmount);
                    
                    if (codes.length > 0 && amt > 0) {
                      setShowCouponInjectionModal(false);
                      handleCouponInjection(codes, amt); // Triggering the logic
                    } else {
                      Alert.alert("Missing Info", "Enter codes and amount");
                    }
                  }}
                >
                  <Text style={styles.wallet_proceedBtnText}>Proceed to Breakdown</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ marginVertical: 15, alignItems: 'center' }}
                  onPress={() => setShowCouponInjectionModal(false)}
                >
                  <Text style={{ color: '#ef4444' }}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
        {/* Gold Sell Modal */}
        <Modal visible={showGoldSellModal} transparent animationType="fade">
          <View style={styles.wallet_modalOverlay}>
            <View style={styles.wallet_bottomSheet}>
              <Text style={styles.wallet_modalTitle}>Gold Exchange</Text>
              
              <Text style={styles.wallet_inputLabel}>Customer Mobile</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[styles.wallet_amountInput, { flex: 1 }]}
                  placeholder="10-digit mobile"
                  keyboardType="phone-pad"
                  value={goldCustomerMobile}
                  onChangeText={setGoldCustomerMobile}
                />
                <TouchableOpacity 
                  style={[styles.wallet_proceedBtn, { marginTop: 0, paddingHorizontal: 15 }]} 
                  onPress={handleFetchGoldPreview}
                >
                  <Text style={styles.wallet_proceedBtnText}>Fetch</Text>
                </TouchableOpacity>
              </View>

              {goldPreview && (
                <View style={{ backgroundColor: '#fff7ed', padding: 15, borderRadius: 10, marginVertical: 15 }}>
                  <Text style={{ fontWeight: 'bold' }}>Customer: {goldPreview.name}</Text>
                  <Text>Max Exchangeable: ₹{goldPreview.max_amount}</Text>
                </View>
              )}

              <Text style={styles.wallet_inputLabel}>Exchange Amount (₹)</Text>
              <TextInput
                style={styles.wallet_amountInput}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={goldSellAmount}
                onChangeText={(val) => {
                  // Prevent entering more than max_amount
                  if (goldPreview && parseFloat(val) > goldPreview.max_amount) return;
                  setGoldSellAmount(val);
                }}
              />

              <TouchableOpacity 
                style={[styles.wallet_proceedBtn, { backgroundColor: goldPreview ? '#2ec4b6' : '#cbd5e1' }]} 
                onPress={handleGoldSellInitiate}
                disabled={!goldPreview}
              >
                <Text style={styles.wallet_proceedBtnText}>Send OTP to Customer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{ marginTop: 15, alignItems: 'center' }}
                onPress={() => setShowGoldSellModal(false)}
              >
                <Text style={{ color: '#ef4444' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Gold OTP Modal */}
        <Modal visible={showGoldOtpModal} transparent animationType="slide">
          <View style={styles.wallet_modalOverlay}>
            <View style={styles.wallet_bottomSheet}>
              <Text style={styles.wallet_modalTitle}>Verify Transaction</Text>
              <Text style={{ textAlign: 'center', color: '#64748b', marginBottom: 20 }}>
                A 6-digit OTP has been sent to customer +91 {goldCustomerMobile}
              </Text>

              <Text style={styles.wallet_inputLabel}>Enter OTP</Text>
              <TextInput
                style={[styles.wallet_amountInput, { letterSpacing: 5, textAlign: 'center', fontSize: 24 }]}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                value={goldOtp}
                onChangeText={setGoldOtp}
              />

              <TouchableOpacity 
                style={[styles.wallet_proceedBtn, { backgroundColor: '#FAA307' }]} 
                onPress={handleGoldOtpVerify}
              >
                <Text style={styles.wallet_proceedBtnText}>Confirm & Sell Gold</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{ marginTop: 15, alignItems: 'center' }}
                onPress={() => {
                    setShowGoldOtpModal(false);
                    setGoldOtp('');
                }}
              >
                <Text style={{ color: '#ef4444' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* EDIT DEAL MODAL */}
        <Portal>
          <PaperModal 
            visible={!!selectedDeal} 
            onDismiss={() => setSelectedDeal(null)} 
            contentContainerStyle={styles.ad_modalContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.ad_modalHeader}>Edit Deal Details</Text>
              
              {/* Visual Preview of Current Images (Website Sync) */}
              <Text style={{fontSize: 12, fontWeight: 'bold', marginBottom: 5}}>Current Images:</Text>
              <ScrollView horizontal style={{marginBottom: 15}}>
                {selectedDeal?.images?.map((img, idx) => (
                  <Image key={idx} source={{uri: img}} style={{width: 60, height: 60, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#ccc'}} />
                ))}
              </ScrollView>

              <TextInput label="Deal Title" value={editForm.title} onChangeText={t => setEditForm({...editForm, title: t})} mode="outlined" style={styles.ad_input} />
              
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <TextInput label="MRP (₹)" value={editForm.mrp} onChangeText={t => setEditForm({...editForm, mrp: t})} keyboardType="numeric" mode="outlined" style={[styles.ad_input, {flex: 1, marginRight: 8}]} />
                <TextInput label="Discount %" value={editForm.discountValue} onChangeText={t => setEditForm({...editForm, discountValue: t})} keyboardType="numeric" mode="outlined" style={[styles.ad_input, {flex: 1}]} />
              </View>

              <TextInput label="Description" value={editForm.description} onChangeText={t => setEditForm({...editForm, description: t})} multiline numberOfLines={4} mode="outlined" style={styles.ad_input} />
              <TextInput label="Terms & Conditions" value={editForm.terms} onChangeText={t => setEditForm({...editForm, terms: t})} multiline numberOfLines={3} mode="outlined" style={styles.ad_input} />

              <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, paddingBottom: 20}}>
                <Button mode="outlined" onPress={() => setSelectedDeal(null)} style={{flex: 1, marginRight: 10}}>Cancel</Button>
                <Button mode="contained" onPress={handleUpdateDeal} buttonColor="#2ecc71" style={{flex: 1}}>Save</Button>
              </View>
            </ScrollView>
          </PaperModal>
        </Portal>
      </Portal>
    </View>
  );
};

// --- HELPER SUB-COMPONENTS ---
const HubItem = ({ icon, label, color, onPress }: any) => (
  <TouchableOpacity style={styles.hubItem} onPress={onPress}>
    <View style={[styles.hubCircle, { backgroundColor: color + '15' }]}>
      <IconButton icon={icon} iconColor={color} size={28} />
    </View>
    <Text style={styles.hubLabel}>{label}</Text>
  </TouchableOpacity>
);

const NavItem = ({ icon, label, onPress, active }: any) => (
  <TouchableOpacity 
    style={styles.navItem} 
    onPress={onPress} 
    activeOpacity={0.7}
  >
    <IconButton 
      icon={icon} 
      size={26} 
      iconColor={active ? PRIMARY_COLOR : "#757575"} 
      style={{ margin: 0 }} // Removes extra padding around icon
    />
    <Text style={[styles.navLabel, { color: active ? PRIMARY_COLOR : "#757575" }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    backgroundColor: '#FFF', 
    elevation: 2, 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 60,
  },
  profileTouch: {
    marginRight: 10,
    zIndex: 10,
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject, // Fills the header
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Logo behind buttons
  },
  headerLogo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto', // Pushes everything to the right edge
    zIndex: 10,
  },
  headerSearchbar: {
    flex: 1,
    height: 45, // Standard professional height
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    elevation: 0, // No shadow for "flat" modern look
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: width - 40, // Keeps it centered
  },
  notifBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF5252',
    fontWeight: 'bold',
  },
  profilePic: { backgroundColor: '#EEE' },
  headerTitle: { fontWeight: 'bold', color: SECONDARY_COLOR },
  heroSection: { 
    padding: 20, 
    backgroundColor: '#FFF', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    elevation: 3, // Subtle shadow to separate from background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  centeredWelcome: {
    alignItems: 'center', // Centers horizontally
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  welcomeText: { 
    fontSize: 24, // Slightly larger for emphasis
    fontWeight: '700', 
    color: SECONDARY_COLOR,
    textAlign: 'center',
  },
  dateText: { color: '#888' },
  mainStatsCard: { backgroundColor: SECONDARY_COLOR, borderRadius: 20, elevation: 8 },
  salesSummaryCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 15, 
    elevation: 4, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  salesTitle: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: SECONDARY_COLOR, 
    marginBottom: 15 
  },
  tableHeader: { 
    flexDirection: 'row', 
    paddingBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  columnHeader: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#999', 
    textTransform: 'uppercase' 
  },
  tableRowSummary: { 
    flexDirection: 'row', 
    paddingVertical: 12, 
    alignItems: 'center' 
  },
  rowLabel: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#444' 
  },
  rowValue: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: SECONDARY_COLOR 
  },
  tableDivider: { 
    marginVertical: 5, 
    height: 1, 
    backgroundColor: '#F0F0F0' 
  },
  bannerWrapper: {
    marginTop: 20,
    height: 200, // Increased height slightly to match a modern banner feel
    width: width - 40,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
    backgroundColor: '#000', // Base fallback
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  bannerSlide: {
    width: width - 40,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)', // Adjust for brightness(0.7)
  },
  mainBannerImage: {
    width: '100%',
    height: '100%',
    zIndex: 2,
  },
  paginationDots: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    right: 15, // Aligned to right like your indicator
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  tableRowHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#f1f1f1', 
    borderTopLeftRadius: 10, 
    borderTopRightRadius: 10,
    width: 700, // Fixed width to ensure all cells stay in their columns
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  tableRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingVertical: 12, 
    width: 700, // Must match the header width exactly
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  whiteLabel: { color: '#AAA', fontSize: 14 },
  mainValue: { color: '#FFF', fontSize: 34, fontWeight: 'bold', marginVertical: 5 },
  statsRow: { flexDirection: 'row', marginTop: 15, alignItems: 'center' },
  subValue: { color: PRIMARY_COLOR, fontSize: 18, fontWeight: 'bold' },
  vertDivider: { width: 1, height: 30, backgroundColor: '#555', marginHorizontal: 20 },
  actionHub: { padding: 20 },
  hubItem: { alignItems: 'center', width: (width - 60) / 4 },
  hubCircle: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  hubLabel: { fontSize: 12, fontWeight: '600', marginTop: 8, color: '#444' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', // Slightly darker for better focus
    justifyContent: 'flex-end' 
  },
  bottomSheet: { 
    backgroundColor: '#FFF', 
    padding: 25, 
    paddingBottom: 40, // More space at bottom for modern look
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    elevation: 20, 
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '800', // Heavy bold
    marginBottom: 8, 
    textAlign: 'center',
    color: '#333'
  },
  modalSub: { 
    fontSize: 15, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 25 
  },
  choiceBtn: { 
    marginVertical: 10, 
    paddingVertical: 6, // Taller buttons are easier to click
    borderRadius: 12, 
  },
  choiceBtnLabelBold: {
    fontSize: 16,
    fontWeight: '900', // Maximum boldness for primary action
    letterSpacing: 0.5,
  },
  cancelContainer: {
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelText: { 
    textAlign: 'center', 
    color: '#999', 
    fontWeight: '600',
    fontSize: 15 
  },
  dragHandle: {
    width: 45,
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20
  },
  formSectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 1
  },
  modalInput: {
    marginBottom: 15,
    backgroundColor: '#FFF'
  },
  modal: { backgroundColor: 'transparent', padding: 20 },
  breakdownBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, marginVertical: 10 },
  breakdownTitle: { fontWeight: 'bold', marginBottom: 10, fontSize: 14, color: '#666' },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  totalText: { fontWeight: 'bold', color: '#000', fontSize: 16 },
  modalActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', // Changed from flex-end
    alignItems: 'center', 
    marginTop: 20, 
    gap: 10 
  },
  hubCard: { margin: 15, borderRadius: 15, backgroundColor: '#FFF' },
  hubTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  hubGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  infoCard: { marginHorizontal: 20, borderRadius: 15, elevation: 2 },
  infoModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 15,
    maxHeight: '80%',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabActiveGold: { backgroundColor: '#e74c3c' },
  tabActiveReturn: { backgroundColor: '#6c5ce7' },
  tabInactive: { backgroundColor: '#CCC', opacity: 0.6 },
  infoScroll: { marginVertical: 10 },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  noteBox: {
    backgroundColor: '#f7f5ff',
    borderLeftWidth: 4,
    borderLeftColor: '#6c5ce7',
    padding: 12,
    marginTop: 15,
    borderRadius: 6,
  },
  noteText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  tabHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tabBtn: { flex: 1, padding: 12, alignItems: 'center' },
  invoiceBtn: {
    backgroundColor: "#f4b400",
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  invoiceBtnText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 10,
  },
  tableCard: { margin: 10, borderRadius: 10, backgroundColor: '#fff', elevation: 3 },
  tableTitle: { fontSize: 16, fontWeight: 'bold' },
  headerText: { fontWeight: 'bold', color: '#333' },
  dealCard: {
    width: 260,
    marginRight: 15,
    borderRadius: 12,
    elevation: 3, // Shadow for Android
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dealImage: {
    height: 140,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pendingBadge: {
    backgroundColor: '#ff4d4d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 5,
    marginBottom: 8,
  },
  pendingBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dealDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mrpText: {
    fontSize: 14,
    fontWeight: '500',
  },
  discountText: {
    fontSize: 14,
    color: 'green',
    fontWeight: 'bold',
  },
  cell: { padding: 12, fontSize: 13, textAlign: 'left' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignItems: 'center' },
  actionBtn: { backgroundColor: '#2a9d8f', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5 },
  actionBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  modalContent: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 10 },
  modalHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { marginBottom: 10 },
  gv_tableCard: { margin: 10, borderRadius: 10, backgroundColor: '#fff', elevation: 3, overflow: 'hidden' },
  gv_tableTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50' },
  gv_filterContainer: { padding: 10, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#eee' },
  gv_row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gv_dateInput: { flex: 1, marginHorizontal: 4, height: 45, backgroundColor: '#fff' },
  gv_pickerWrapper: { flex: 1, marginHorizontal: 4 }, // Added this to fix your error
  gv_statusToggle: { borderColor: '#ccc', borderRadius: 5 },
  gv_tableRowHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#f1f1f1', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: 670 
  },
  gv_tableRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingVertical: 10, 
    width: 670,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  gv_cell: { paddingHorizontal: 8, fontSize: 12, color: '#333' },
  gv_headerText: { fontWeight: 'bold', color: '#555', textTransform: 'uppercase', fontSize: 11 },
  gv_statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  gv_actionBtn: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4, justifyContent: 'center', alignItems: 'center', minWidth: 60 },
  gv_actionBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  gv_emptyText: { color: '#999', fontSize: 13, textAlign: 'center' },
  datePickerBox: {
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 5, 
    backgroundColor: '#fff', 
    height: 45, 
    justifyContent: 'center', 
    paddingHorizontal: 10
  },
  gv_dateText: {
    color: '#333',
    fontSize: 13,
  },
  dateBox: {
    flex: 1,
    marginHorizontal: 5,
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#fff'
  },
  
  /* --- COUPON VALIDATION PREFIXED STYLES --- */
  cv_card: { margin: 10, borderRadius: 12, backgroundColor: '#fff', elevation: 4 },
  cv_title: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  cv_inputRow: { flexDirection: 'row', gap: 10, padding: 15, alignItems: 'center' },
  cv_manualInput: { flex: 1, height: 48, backgroundColor: '#fff' },
  cv_scanBtn: { marginHorizontal: 15, marginBottom: 15, borderColor: '#f39c12' },
  
  cv_tableContainer: { paddingBottom: 10 },
  cv_headerRow: { 
    flexDirection: 'row', 
    backgroundColor: '#f8f9fa', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    width: 820 // Total width of all columns
  },
  cv_row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f1f1',
    width: 820 
  },
  cv_headerText: { fontWeight: 'bold', color: '#555', fontSize: 12, paddingHorizontal: 8 },
  cv_cellText: { fontSize: 12, color: '#333', paddingHorizontal: 8 },
  cv_statusValidated: { color: '#27ae60', fontWeight: 'bold', fontSize: 12 },
  cv_statusIssued: { color: '#e67e22', fontWeight: 'bold', fontSize: 12 },
  cv_valueText: { fontWeight: 'bold', color: '#2c3e50', fontSize: 13 },
  editModalContainer: {
  backgroundColor: 'white',
  padding: 20,
  margin: 20,
  borderRadius: 15,
  maxHeight: '80%',
  },
  modalHeaderAD: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputAD: {
    marginBottom: 12,
  },
  modalActionsAD: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingBottom: 20
  },
  expiryText: {
    fontSize: 11,
    color: '#888',
    marginVertical: 4
  },
  emptyText: {
    color: "#888",
    marginTop: 10,
    fontStyle: 'italic',
    textAlign: 'center'
  },
  
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeTab: { borderBottomWidth: 2, borderBottomColor: PRIMARY_COLOR },
  activeTabText: { color: PRIMARY_COLOR, fontWeight: 'bold' },
  tabText: { color: '#888' },
  infoText: { paddingVertical: 10, color: '#666', lineHeight: 20 },
  entrySection: { padding: 20 },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  /* --- APPROVED DEALS PREFIXED STYLES --- */
  ad_section: { padding: 15, backgroundColor: '#fff' },
  ad_sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  ad_dealCard: {
    width: 280,
    marginRight: 15,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  ad_dealImage: { height: 150 },
  ad_cardContent: { padding: 12 },
  ad_dealTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  ad_expiryText: { fontSize: 12, color: '#e67e22', fontWeight: '600', marginBottom: 8 },
  ad_priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10
  },
  ad_mrp: { fontSize: 13, color: '#444' },
  ad_discount: { fontSize: 13, color: '#27ae60', fontWeight: 'bold' },
  ad_editBtn: { borderRadius: 8, marginTop: 5 },
  ad_emptyBox: { padding: 20, alignItems: 'center', justifyContent: 'center' },
  ad_emptyText: { color: '#95a5a6', fontStyle: 'italic' },
  
  /* Modal Specific Prefixes */
  ad_modalContainer: { backgroundColor: 'white', padding: 20, margin: 20, borderRadius: 15, maxHeight: '90%' },
  ad_input: { marginBottom: 12, backgroundColor: '#fff' },
  ad_modalHeader: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#2c3e50' },

  /* --- UNDER APPROVAL SECTION PREFIXED STYLES --- */
  ua_section: { padding: 15, backgroundColor: '#fcfcfc' },
  ua_sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 12 },
  ua_dealCard: {
    width: 260,
    marginRight: 15,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffebee', // Light red border to signify pending
  },
  ua_dealImage: { height: 130, opacity: 0.8 }, // Slightly faded to show it's not active
  ua_cardContent: { padding: 12 },
  ua_dealTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  ua_statusBadge: {
    backgroundColor: '#ff4d4d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  ua_statusText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  ua_dealDesc: { fontSize: 12, color: '#777', lineHeight: 16, marginBottom: 8 },
  ua_priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  ua_mrpText: { fontSize: 12, color: '#444' },
  ua_discountText: { fontSize: 12, color: '#d32f2f', fontWeight: 'bold' },
  ua_emptyText: { color: "#888", marginTop: 10, fontStyle: 'italic', textAlign: 'center' },
  table: { backgroundColor: '#FFF', borderRadius: 15 },
  pendingCard: { width: 140, marginRight: 15, borderRadius: 12, overflow: 'hidden' },
  pendingCover: { height: 80 },
  bannerCarousel: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  // --- WALLET & MODAL STYLES ---
  wallet_modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  wallet_bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 24,
    minHeight: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 20,
  },
  wallet_modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  wallet_optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  wallet_optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  wallet_optionSubtext: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  
  // --- COUPON INJECTION SPECIFIC ---
  wallet_inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 15,
  },
  wallet_textArea: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wallet_filePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginVertical: 10,
  },
  wallet_fileName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  wallet_amountInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  wallet_proceedBtn: {
    backgroundColor: '#4361ee',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 25,
  },
  wallet_proceedBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  wallet_notifWrapper: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  wallet_notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  wallet_notifIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  wallet_notifTextContent: {
    flex: 1,
  },
  wallet_notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991b1b', // Darker red for text
  },
  wallet_notifSubtitle: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 1,
  },
  wallet_dismissBtn: {
    padding: 4,
    marginLeft: 8,
  },
  bottomNav: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    height: 75, // Slightly taller for better thumb reach
    backgroundColor: '#FFF', 
    flexDirection: 'row', 
    justifyContent: 'space-around', // Evenly spaces the 5 items
    alignItems: 'center',
    borderTopWidth: 1, 
    borderTopColor: '#E0E0E0', 
    paddingBottom: 10,
    elevation: 20, // Adds a nice shadow on Android
    shadowColor: '#000', // Adds shadow for iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: { 
    flex: 1, // Ensures each item takes equal width
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  navLabel: { 
    fontSize: 11, 
    fontWeight: '500', 
    marginTop: -5 // Pulls text closer to the icon
  },
  fabSpace: { width: 60 },
  centerFab: { 
    position: 'absolute', bottom: 25, alignSelf: 'center', 
    backgroundColor: PRIMARY_COLOR, borderRadius: 30, elevation: 10 
  },
  scannerOverlay: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  scanText: { color: '#FFF', marginBottom: 20, fontWeight: 'bold' }
});

export default DashboardScreen;