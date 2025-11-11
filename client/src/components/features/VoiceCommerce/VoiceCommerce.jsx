import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../../stores/LanguageContext';
import Modal from '../../ui/Modal';

const VoiceCommerce = ({
  isOpen,
  onClose,
  onProductSearch,
  onAddToCart,
  onCheckout,
  className = ''
}) => {
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [conversation, setConversation] = useState([]);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Voice commands patterns
  const voiceCommands = {
    ar: {
      search: /(ابحث عن|أريد|أبحث عن|أظهر لي)/i,
      addToCart: /(أضف للسلة|أشتري|أريد شراء)/i,
      checkout: /(الدفع|الخروج|إنهاء الشراء)/i,
      help: /(مساعدة|تعليمات|كيف)/i,
      clear: /(مسح|إعادة|جديد)/i
    },
    en: {
      search: /(search for|find|show me|look for)/i,
      addToCart: /(add to cart|buy|purchase|get)/i,
      checkout: /(checkout|pay|finish)/i,
      help: /(help|instructions|how)/i,
      clear: /(clear|reset|new)/i
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setResponse(t('voiceNotSupported') || 'Voice recognition is not supported in your browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language.code === 'ar' ? 'ar-SA' : 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      startVoiceVisualization();
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      stopVoiceVisualization();
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setResponse(t('voiceError') || 'Voice recognition error. Please try again.');
      setIsListening(false);
      stopVoiceVisualization();
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopVoiceVisualization();
    };
  }, [language.code, t]);

  // Voice visualization
  const startVoiceVisualization = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const microphone = audioContextRef.current.createMediaStreamSource(stream);

        analyserRef.current.fftSize = 256;
        microphone.connect(analyserRef.current);

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

        const updateVoiceLevel = () => {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setVoiceLevel(average / 255);
          animationFrameRef.current = requestAnimationFrame(updateVoiceLevel);
        };

        updateVoiceLevel();
      })
      .catch(err => {
        console.warn('Could not access microphone for visualization:', err);
      });
  }, []);

  const stopVoiceVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setVoiceLevel(0);
  }, []);

  // Process voice commands
  const processVoiceCommand = useCallback(async (command) => {
    setIsProcessing(true);

    try {
      const commands = voiceCommands[language.code] || voiceCommands.en;
      const lowerCommand = command.toLowerCase();

      // Add to conversation
      setConversation(prev => [...prev, { type: 'user', text: command }]);

      let response = '';
      let action = null;

      if (commands.search.test(lowerCommand)) {
        const searchTerm = command.replace(commands.search, '').trim();
        response = `${t('searchingFor') || 'Searching for'} "${searchTerm}"...`;

        if (onProductSearch) {
          const results = await onProductSearch(searchTerm);
          if (results && results.length > 0) {
            response = `${t('foundProducts') || 'Found'} ${results.length} ${t('products') || 'products'} ${t('for') || 'for'} "${searchTerm}". ${t('sayAddToCart') || 'Say "add to cart" to purchase.'}`;
          } else {
            response = `${t('noProductsFound') || 'No products found for'} "${searchTerm}". ${t('tryDifferentSearch') || 'Try a different search term.'}`;
          }
        }
        action = 'search';
      } else if (commands.addToCart.test(lowerCommand)) {
        response = t('addingToCart') || 'Adding to cart...';
        if (onAddToCart) {
          await onAddToCart();
          response = t('addedToCart') || 'Added to cart successfully!';
        }
        action = 'addToCart';
      } else if (commands.checkout.test(lowerCommand)) {
        response = t('proceedingToCheckout') || 'Proceeding to checkout...';
        if (onCheckout) {
          onCheckout();
        }
        action = 'checkout';
      } else if (commands.help.test(lowerCommand)) {
        response = t('voiceHelp') || 'You can say: "Search for [product]", "Add to cart", "Checkout", or "Help"';
        action = 'help';
      } else if (commands.clear.test(lowerCommand)) {
        setConversation([]);
        setTranscript('');
        response = t('conversationCleared') || 'Conversation cleared. How can I help you?';
        action = 'clear';
      } else {
        response = t('didntUnderstand') || 'I didn\'t understand that. Try saying "search for [product]" or "help"';
        action = 'unknown';
      }

      setResponse(response);
      setConversation(prev => [...prev, { type: 'assistant', text: response, action }]);

      // Speak response (if supported)
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(response);
        utterance.lang = language.code === 'ar' ? 'ar-SA' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        // Try to find a suitable voice
        const voices = speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice =>
          voice.lang.startsWith(language.code === 'ar' ? 'ar' : 'en')
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        speechSynthesis.speak(utterance);
      }

    } catch (error) {
      console.error('Voice command processing error:', error);
      const errorResponse = t('processingError') || 'Sorry, there was an error processing your request.';
      setResponse(errorResponse);
      setConversation(prev => [...prev, { type: 'assistant', text: errorResponse, action: 'error' }]);
    } finally {
      setIsProcessing(false);
    }
  }, [language.code, t, onProductSearch, onAddToCart, onCheckout]);

  // Handle voice input
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  // Process transcript when speech ends
  useEffect(() => {
    if (!isListening && transcript && !isProcessing) {
      processVoiceCommand(transcript);
    }
  }, [isListening, transcript, isProcessing, processVoiceCommand]);

  const voiceLevelBars = Array.from({ length: 10 }, (_, i) => {
    const height = voiceLevel > i / 10 ? '100%' : '20%';
    return (
      <div
        key={i}
        className="bg-blue-500 rounded-full transition-all duration-100"
        style={{ height, width: '4px' }}
      />
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className={`voice-commerce-modal ${className}`}
    >
      <div className="voice-commerce" dir={language.direction}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('voiceAssistant') || 'Voice Assistant'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('voiceShopping') || 'Shop with your voice'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Voice Interface */}
        <div className="p-6">
          {/* Voice Visualization */}
          <div className="flex justify-center mb-6">
            <div className="flex items-end gap-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
              {voiceLevelBars}
            </div>
          </div>

          {/* Voice Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full font-medium text-lg transition-all duration-200 transform ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white scale-110 shadow-lg shadow-red-500/50 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 shadow-lg'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isProcessing ? (
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : isListening ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </button>
          </div>

          {/* Status Text */}
          <div className="text-center mb-6">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {isProcessing
                ? (t('processing') || 'Processing...')
                : isListening
                ? (t('listening') || 'Listening...')
                : (t('tapToSpeak') || 'Tap to speak')
              }
            </p>
            {transcript && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">
                "{transcript}"
              </p>
            )}
          </div>

          {/* Conversation History */}
          <div className="max-h-64 overflow-y-auto mb-6 space-y-3">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Commands */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => processVoiceCommand(language.code === 'ar' ? 'مساعدة' : 'help')}
              className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              {t('help') || 'Help'}
            </button>
            <button
              onClick={() => processVoiceCommand(language.code === 'ar' ? 'مسح' : 'clear')}
              className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              {t('clear') || 'Clear'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default VoiceCommerce;