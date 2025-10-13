import { useEffect, useRef, useState } from 'react';
import api from '../api/client';

// Simple in-memory cache to avoid refetching categories often within a session
const cache = {
  ts: 0,
  data: null
};
const TTL = 60 * 1000; // 1 minute

export default function useCategories(options = { withCounts: 1, ttl: TTL }) {
  const { withCounts = 1, ttl = TTL } = options || {};
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const now = Date.now();
    const valid = cache.data && (now - cache.ts) < ttl;
    async function load() {
      if (valid) { setCategories(cache.data); return; }
      setLoading(true); setError(null);
      try {
        const res = await api.listCategories({ withCounts });
        const list = Array.isArray(res?.categories) ? res.categories : [];
        cache.data = list; cache.ts = Date.now();
        if (mounted.current) setCategories(list);
      } catch (e) {
        if (mounted.current) setError(e);
      } finally {
        if (mounted.current) setLoading(false);
      }
    }
    load();
    return () => { mounted.current = false; };
  }, [withCounts, ttl]);

  const refetch = async () => {
    cache.data = null; cache.ts = 0;
    const res = await api.listCategories({ withCounts });
    const list = Array.isArray(res?.categories) ? res.categories : [];
    cache.data = list; cache.ts = Date.now();
    if (mounted.current) setCategories(list);
    return list;
  };

  return { categories, loading, error, refetch };
}
