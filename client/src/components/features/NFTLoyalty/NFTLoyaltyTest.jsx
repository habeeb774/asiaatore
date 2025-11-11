import React from 'react';
import { NFTLoyaltyProvider, NFTLoyaltyDashboard } from './NFTLoyalty';

// Mock Language Context for testing
const MockLanguageContext = ({ children }) => {
  const language = {
    code: 'en',
    direction: 'ltr',
    name: 'English'
  };

  return React.createElement('div', { 'data-language': language.code }, children);
};

// Test component wrapper
const NFTLoyaltyTest = () => {
  return (
    <MockLanguageContext>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            NFT Loyalty Program Test
          </h1>
          <NFTLoyaltyProvider>
            <NFTLoyaltyDashboard />
          </NFTLoyaltyProvider>
        </div>
      </div>
    </MockLanguageContext>
  );
};

export default NFTLoyaltyTest;