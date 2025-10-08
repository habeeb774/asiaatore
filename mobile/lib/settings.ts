import { useQuery } from '@tanstack/react-query';
import { API_BASE } from './config';

export type StoreSetting = {
  siteNameAr?: string | null;
  siteNameEn?: string | null;
  logo?: string | null;
  colorPrimary?: string | null;
  colorSecondary?: string | null;
  colorAccent?: string | null;
};

async function fetchSettings(): Promise<StoreSetting | null> {
  try {
    const r = await fetch(`${API_BASE}/settings`);
    if (!r.ok) return null;
    const data = await r.json();
    return (data?.setting ?? null) as StoreSetting | null;
  } catch {
    return null;
  }
}

export function useStoreSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: fetchSettings, staleTime: 10 * 60_000 });
}
