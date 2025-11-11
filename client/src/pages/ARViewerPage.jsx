import React, { useState } from 'react';
import ARProductViewer from '../components/features/ARProductViewer/ARProductViewer';

const ARViewerPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Sample product for demo
  const sampleProduct = {
    id: 1,
    name: 'Sample AR Product',
    images: ['/api/placeholder/400/400'],
    model3d: '/api/placeholder/model.glb', // 3D model URL
    arSupported: true
  };

  const handleViewAR = (product) => {
    setSelectedProduct(product);
    setIsViewerOpen(true);
  };

  return (
    <div className="ar-viewer-page">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">AR Product Viewer</h1>
        
        <div className="text-center">
          <button
            onClick={() => handleViewAR(sampleProduct)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Product in AR
          </button>
        </div>
      </div>

      {selectedProduct && (
        <ARProductViewer
          product={selectedProduct}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
};

export default ARViewerPage;