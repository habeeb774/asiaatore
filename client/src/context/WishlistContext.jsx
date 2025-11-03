import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/client';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
	const { user } = useAuth() || {};
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [wishlistItems, setWishlistItems] = useState(() => {
		try {
			const raw = localStorage.getItem('my_store_wishlist');
			return raw ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	});
	const hasFetchedRef = useRef(false);

	// Persist locally for offline / fast startup
	useEffect(() => {
		try { localStorage.setItem('my_store_wishlist', JSON.stringify(wishlistItems)); } catch {}
	}, [wishlistItems]);

	// Fetch from server when user logs in
	useEffect(() => {
		const fetchServer = async () => {
				let hasToken = false
				try { hasToken = !!localStorage.getItem('my_store_token') } catch {}
				if (!user || !hasToken || hasFetchedRef.current) return;
			setLoading(true); setError(null);
			try {
				const data = await api.wishlistList();
				// data expected: { items: [...] } or array fallback
				const items = Array.isArray(data) ? data : (data.items || []);
				setWishlistItems(items.map(p => ({ ...p, id: p.productId || p.id })));
				hasFetchedRef.current = true;
			} catch (e) {
				setError(e.message);
			} finally { setLoading(false); }
		};
		fetchServer();
	}, [user]);

	const addToWishlist = async (product) => {
		if (!product || !product.id) return;
		// Optimistic
		setWishlistItems(prev => prev.find(i => i.id === product.id) ? prev : [...prev, product]);
		if (user) {
			try { await api.wishlistAdd(product.id); } catch (e) { setError(e.message); }
		}
	};

	const removeFromWishlist = async (productId) => {
		setWishlistItems(prev => prev.filter(i => i.id !== productId));
		if (user) {
			try { await api.wishlistRemove(productId); } catch (e) { setError(e.message); }
		}
	};

	const clearWishlist = async () => {
		const ids = wishlistItems.map(i => i.id);
		setWishlistItems([]);
		if (user) {
			// Fire & forget sequentially to keep API simple
			for (const id of ids) {
				try { await api.wishlistRemove(id); } catch {}
			}
		}
	};

	const value = { wishlistItems, addToWishlist, removeFromWishlist, clearWishlist, loading, error };
	return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
export default WishlistContext;