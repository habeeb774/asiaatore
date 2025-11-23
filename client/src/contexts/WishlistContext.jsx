import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useWishlist as useWishlistQuery, useAddToWishlist, useRemoveFromWishlist, useClearWishlist } from '../hooks/useWishlistQuery';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
	const { user } = useAuth() || {};
	
	// Server state from React Query
	const { data: serverWishlistItems = [], isLoading, error } = useWishlistQuery();
	const addToWishlistMutation = useAddToWishlist();
	const removeFromWishlistMutation = useRemoveFromWishlist();
	const clearWishlistMutation = useClearWishlist();
	
	// Client-only state
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

	// Sync server state to local state when it changes
	useEffect(() => {
    if (user && serverWishlistItems) {
      // Prevent infinite loop by comparing the stringified versions of the arrays.
      // This is a simple way to deep-compare the items and avoid re-setting state if the data is identical.
      if (JSON.stringify(wishlistItems) !== JSON.stringify(serverWishlistItems)) {
        setWishlistItems(serverWishlistItems);
      }
      hasFetchedRef.current = true;
    }
	}, [user, serverWishlistItems, wishlistItems]);

	const addToWishlist = async (product) => {
		if (!product || !product.id) return;
		
		// Optimistic update
		setWishlistItems(prev => prev.find(i => i.id === product.id) ? prev : [...prev, product]);
		
		if (user) {
			addToWishlistMutation.mutate(product.id);
		}
	};

	const removeFromWishlist = async (productId) => {
		setWishlistItems(prev => prev.filter(i => i.id !== productId));
		if (user) {
			removeFromWishlistMutation.mutate(productId);
		}
	};

	const clearWishlist = async () => {
		const ids = wishlistItems.map(i => i.id);
		setWishlistItems([]);
		if (user && ids.length) {
			clearWishlistMutation.mutate(ids);
		}
	};

	const value = { wishlistItems, addToWishlist, removeFromWishlist, clearWishlist, loading: isLoading, error };
	return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
export default WishlistContext;
