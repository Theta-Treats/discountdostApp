import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Text, TextInput } from 'react-native';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CreateDealScreen from './src/screens/CreateDealScreen';
import TermsScreen from './src/screens/TermsScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ScannerScreen from './src/screens/ScannerScreen';

// Force font scale to 1.0 (ignores system "Large Text" settings)
if ((Text as any).defaultProps) {
  (Text as any).defaultProps.allowFontScaling = false;
} else {
  (Text as any).defaultProps = { allowFontScaling: false };
}

if ((TextInput as any).defaultProps) {
  (TextInput as any).defaultProps.allowFontScaling = false;
} else {
  (TextInput as any).defaultProps = { allowFontScaling: false };
}

const Stack = createNativeStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FAA307', // Your PRIMARY_COLOR
    secondary: '#FFFFFF',
    background: '#F0F2F5', // Your container background
    surface: '#FFFFFF',
    outline: '#E0E0E0',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login" 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right' 
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="CreateDeal" component={CreateDealScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          {/* New Screens */}
          <Stack.Screen name="Terms" component={TermsScreen} options={{ headerShown: true, title: 'Terms & Conditions' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: true, title: 'Reset Password' }} />
          <Stack.Screen 
            name="ScannerScreen" 
            component={ScannerScreen} 
            options={{ 
              presentation: 'modal', // This makes it slide up from the bottom
              animation: 'slide_from_bottom' 
            }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}