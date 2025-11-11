import React, { createContext, useContext, useMemo } from 'react';

// Simple ExperimentContext
// Usage: const { variantFor } = useExperiments(); variantFor('hero_cta', ['A','B'])

const ExperimentContext = createContext({
  variantFor: (key, variants) => variants[0]
});

export const ExperimentProvider = ({ children }) => {
  const variantFor = (key, variants = []) => {
    try {
      if (!key || !Array.isArray(variants) || variants.length === 0) return undefined;
      // Allow override via URL param: ?ab_<key>=<variant>
      try {
        const params = new URLSearchParams(window.location.search);
        const param = params.get('ab_' + key);
        if (param && variants.includes(param)) return param;
      } catch {}
      // Allow per-user override stored in localStorage: ab_<key>
      try {
        const stored = localStorage.getItem('ab_' + key);
        if (stored && variants.includes(stored)) return stored;
      } catch {}
      // Otherwise, deterministic random assignment based on hostname + key + visitor id in localStorage
      const storageKey = 'ab_' + key + '_assigned';
      try {
        const assigned = localStorage.getItem(storageKey);
        if (assigned && variants.includes(assigned)) return assigned;
      } catch {}

      // Create a deterministic hash using random and persist
      const choice = variants[Math.floor(Math.random() * variants.length)];
      try { localStorage.setItem(storageKey, choice); } catch {}
      return choice;
    } catch (e) {
      return variants[0];
    }
  };

  const value = useMemo(() => ({ variantFor }), []);
  return <ExperimentContext.Provider value={value}>{children}</ExperimentContext.Provider>;
};

export const useExperiments = () => useContext(ExperimentContext);

export default ExperimentContext;
