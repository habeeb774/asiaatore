import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import api from '../api/client';

/**
 * MarketingContext
 * يوفر: features, banners, appLinks, loading, error, refresh()
 * المواقع المتوقعة للبنرات: topStrip, homepage, footer
 */
const MarketingContext = createContext(null);

export const MarketingProvider = ({ children }) => {
  const [features, setFeatures] = useState([]);
  const [banners, setBanners] = useState([]);
  const [appLinks, setAppLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ts, setTs] = useState(0); // trigger refresh

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError(null);
      try {
        const [f, b, a] = await Promise.all([
          api.marketingFeatures().catch(e => { throw new Error('features:' + e.message); }),
          api.marketingBanners().catch(e => { throw new Error('banners:' + e.message); }),
          api.marketingAppLinks().catch(e => { throw new Error('applinks:' + e.message); })
        ]);
        if (!active) return;
        setFeatures(Array.isArray(f) ? f.filter(x=>x.active!==false) : []);
        setBanners(Array.isArray(b) ? b.filter(x=>x.active!==false) : []);
        setAppLinks(Array.isArray(a) ? a.filter(x=>x.active!==false) : []);
      } catch (e) {
        if (active) setError(e.message || 'marketing_fetch_failed');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [ts]);

  const refresh = () => setTs(x => x + 1);

  const byLocation = useMemo(() => {
    const map = { topStrip: [], homepage: [], footer: [] };
    banners.forEach(b => { map[b.location] && map[b.location].push(b); });
    return map;
  }, [banners]);

  const value = useMemo(() => ({
    features,
    banners,
    appLinks,
    byLocation,
    loading,
    error,
    refresh
  }), [features, banners, appLinks, byLocation, loading, error]);

  return (
    <MarketingContext.Provider value={value}>{children}</MarketingContext.Provider>
  );
};

export const useMarketing = () => useContext(MarketingContext);
export default MarketingContext;
