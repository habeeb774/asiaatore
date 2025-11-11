import React, { useState } from 'react';
import VoiceCommerce from '../components/features/VoiceCommerce/VoiceCommerce';

const VoiceCommercePage = () => {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  return (
    <div className="voice-commerce-page">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Voice Commerce</h1>
        
        <div className="text-center">
          <button
            onClick={() => setIsVoiceOpen(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Start Voice Shopping
          </button>
        </div>
      </div>

      <VoiceCommerce
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onProductSearch={(query) => console.log('Search:', query)}
        onAddToCart={() => console.log('Add to cart')}
        onCheckout={() => console.log('Checkout')}
      />
    </div>
  );
};

export default VoiceCommercePage;