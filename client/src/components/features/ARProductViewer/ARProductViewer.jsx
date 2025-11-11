import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import Modal from '../../ui/Modal';

const ARProductViewer = ({
  product,
  isOpen,
  onClose,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const [currentMode, setCurrentMode] = useState('face'); // face, body, room

  // Check AR support
  useEffect(() => {
    const checkARSupport = async () => {
      try {
        // Check for WebXR support
        if ('xr' in navigator) {
          const supported = await navigator.xr.isSessionSupported('immersive-ar');
          setIsSupported(supported);
        } else {
          // Fallback to basic camera support
          const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
          setIsSupported(hasCamera);
        }
      } catch (err) {
        console.warn('AR support check failed:', err);
        setIsSupported(false);
      }
    };

    if (isOpen) {
      checkARSupport();
    }
  }, [isOpen]);

  // Start AR session
  const startARSession = async () => {
    try {
      setError(null);

      if ('xr' in navigator) {
        // WebXR AR session
        const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test', 'dom-overlay'],
          domOverlay: { root: document.body }
        });

        // In a real implementation, you would set up the XR session here
        setIsActive(true);
      } else {
        // Fallback camera mode
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setIsActive(true);
        }
      }
    } catch (err) {
      setError(t('arNotSupported') || 'AR is not supported on this device');
      console.error('Failed to start AR session:', err);
    }
  };

  // Stop AR session
  const stopARSession = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsActive(false);
  };

  // Take screenshot
  const takeScreenshot = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // In a real implementation, this would capture the AR scene
      // For now, we'll just show a placeholder
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1f2937';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('AR Screenshot Placeholder', canvas.width / 2, canvas.height / 2);

      // Download the image
      const link = document.createElement('a');
      link.download = `ar-${product.nameEn || product.name}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  // Share AR experience
  const shareARExperience = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Try ${product.nameEn || product.name} in AR!`,
          text: 'Check out this product in augmented reality',
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert(t('linkCopied') || 'Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const modes = [
    { id: 'face', label: t('faceTryOn') || 'Face Try-On', icon: '👤' },
    { id: 'body', label: t('bodyTryOn') || 'Body Try-On', icon: '👕' },
    { id: 'room', label: t('roomView') || 'Room View', icon: '🏠' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      className={`ar-viewer-modal ${className}`}
    >
      <div className="ar-viewer" dir={language.direction}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('arTryOn') || 'AR Try-On'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {product.nameEn || product.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isActive && (
              <>
                <button
                  onClick={takeScreenshot}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title={t('takeScreenshot') || 'Take Screenshot'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                <button
                  onClick={shareARExperience}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title={t('share') || 'Share'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* AR Content */}
        <div className="flex-1 relative">
          {!isSupported ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('arNotSupported') || 'AR Not Supported'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('arNotSupportedDesc') || 'Your device does not support augmented reality features.'}
                </p>
                <button
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                >
                  {t('close') || 'Close'}
                </button>
              </div>
            </div>
          ) : !isActive ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('startARTryOn') || 'Start AR Try-On'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  {t('arInstructions') || 'Point your camera at your face/body to try on this product virtually.'}
                </p>

                {/* Mode Selection */}
                <div className="flex justify-center gap-3 mb-6">
                  {modes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setCurrentMode(mode.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        currentMode === mode.id
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-lg">{mode.icon}</span>
                      {mode.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={startARSession}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  {t('startAR') || 'Start AR Experience'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* AR Camera View */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />

              {/* AR Overlay */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                width={window.innerWidth}
                height={window.innerHeight}
              />

              {/* AR Controls */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
                <button
                  onClick={stopARSession}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg"
                  title={t('stopAR') || 'Stop AR'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6m-6 4h6m-6 4h6" />
                  </svg>
                </button>

                <button
                  onClick={() => {/* Toggle product visibility */}}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg"
                  title={t('toggleProduct') || 'Toggle Product'}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>

              {/* AR Instructions */}
              <div className="absolute top-6 left-6 right-6 bg-black bg-opacity-50 text-white p-4 rounded-lg">
                <p className="text-center">
                  {t('arInstructionsActive') || 'Move your device to see the product from different angles'}
                </p>
              </div>
            </>
          )}

          {error && (
            <div className="absolute top-6 left-6 right-6 bg-red-600 text-white p-4 rounded-lg">
              <p className="text-center">{error}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ARProductViewer;