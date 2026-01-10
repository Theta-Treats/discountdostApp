import React from 'react';
import { WebView } from 'react-native-webview';

const TermsScreen = () => {
  return <WebView source={{ uri: 'https://discountdost.com/merchant-terms' }} style={{ flex: 1 }} />;
};

export default TermsScreen;