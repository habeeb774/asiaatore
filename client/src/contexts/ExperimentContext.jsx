import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api/client';

const ExperimentContext = createContext(null);

// Experiment configuration
const DEFAULT_EXPERIMENTS = {
  'product-card-design': {
    enabled: true,
    variants: ['control', 'variant-a'],
    weights: [50, 50], // Percentage split
    description: 'Test different product card designs'
  },
  'add-to-cart-button': {
    enabled: false,
    variants: ['default', 'colorful', 'minimal'],
    weights: [33, 33, 34],
    description: 'Test different add to cart button styles'
  }
};

export function ExperimentProvider({ children }) {
  const [experiments, setExperiments] = useState(DEFAULT_EXPERIMENTS);
  const [userVariants, setUserVariants] = useState({});
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  // Load user's assigned variants from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('experiment_variants');
      if (saved) {
        setUserVariants(JSON.parse(saved));
      }
    } catch (error) {
      console.warn('Failed to load experiment variants:', error);
    }
    setLoading(false);
  }, []);

  // Save variants to localStorage when changed
  useEffect(() => {
    if (!loading && Object.keys(userVariants).length > 0) {
      try {
        localStorage.setItem('experiment_variants', JSON.stringify(userVariants));
      } catch (error) {
        console.warn('Failed to save experiment variants:', error);
      }
    }
  }, [userVariants, loading]);

  // Assign user to a variant for an experiment
  const assignVariant = useCallback((experimentId) => {
    const experiment = experiments[experimentId];
    if (!experiment || !experiment.enabled) {
      return null;
    }

    // Return already assigned variant if exists
    if (userVariants[experimentId]) {
      return userVariants[experimentId];
    }

    // Assign new variant based on weights
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < experiment.variants.length; i++) {
      cumulative += experiment.weights[i];
      if (random <= cumulative) {
        const variant = experiment.variants[i];
        setUserVariants(prev => ({ ...prev, [experimentId]: variant }));
        return variant;
      }
    }

    // Fallback to first variant
    const fallback = experiment.variants[0];
    setUserVariants(prev => ({ ...prev, [experimentId]: fallback }));
    return fallback;
  }, [experiments, userVariants]);

  // Get current variant for an experiment
  const getVariant = useCallback((experimentId) => {
    return assignVariant(experimentId);
  }, [assignVariant]);

  // Track an event for A/B testing
  const trackEvent = useCallback(async (eventName, data = {}) => {
    const event = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      name: eventName,
      data: {
        ...data,
        variants: userVariants,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    // Add to local events
    setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events

    // Send to server if available
    try {
      await api.marketingTrack({
        event: eventName,
        experimentVariants: userVariants,
        ...data
      });
    } catch (error) {
      console.warn('Failed to track experiment event:', error);
    }
  }, [userVariants]);

  // Update experiment configuration
  const updateExperiment = useCallback((experimentId, config) => {
    setExperiments(prev => ({
      ...prev,
      [experimentId]: { ...prev[experimentId], ...config }
    }));
  }, []);

  // Enable/disable experiment
  const toggleExperiment = useCallback((experimentId, enabled) => {
    updateExperiment(experimentId, { enabled });
  }, [updateExperiment]);

  // Get experiment statistics
  const getExperimentStats = useCallback((experimentId) => {
    const experiment = experiments[experimentId];
    if (!experiment) return null;

    const variantStats = {};
    experiment.variants.forEach(variant => {
      variantStats[variant] = {
        users: 0,
        events: 0,
        conversions: 0
      };
    });

    // Calculate stats from events
    events.forEach(event => {
      const variant = event.data.variants?.[experimentId];
      if (variant && variantStats[variant]) {
        variantStats[variant].users = 1; // Simplified - would need proper user counting
        variantStats[variant].events++;
        
        // Track conversions (e.g., add_to_cart events)
        if (event.name === 'add_to_cart') {
          variantStats[variant].conversions++;
        }
      }
    });

    return {
      experiment: experimentId,
      enabled: experiment.enabled,
      variants: variantStats,
      totalEvents: events.filter(e => e.data.variants?.[experimentId]).length
    };
  }, [experiments, events]);

  const value = {
    experiments,
    userVariants,
    loading,
    events,
    getVariant,
    trackEvent,
    toggleExperiment,
    updateExperiment,
    getExperimentStats,
    assignVariant
  };

  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  );
}

export const useExperiment = () => {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperiment must be used within an ExperimentProvider');
  }
  return context;
};

// Helper hook for specific experiments
export const useExperimentVariant = (experimentId) => {
  const { getVariant, trackEvent } = useExperiment();
  const variant = getVariant(experimentId);

  const track = useCallback((eventName, data) => {
    trackEvent(eventName, {
      ...data,
      experimentId,
      variant
    });
  }, [trackEvent, experimentId, variant]);

  return { variant, track };
};
