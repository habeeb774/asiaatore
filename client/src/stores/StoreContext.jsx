import React, { createContext, useContext, useEffect, useState } from 'react'

const StoreContext = createContext(null)

export const StoreProvider = ({ children }) => {
  const normalizeProduct = (p) => {
    // make older shapes compatible with the newer model
    return {
      id: p.id || `p_${Date.now()}`,
      name: p.name || p.title || p.productName || 'Untitled Product',
      price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
      sellerId: p.sellerId || p.seller || 'seller-1',
      stock: typeof p.stock === 'number' ? p.stock : (p.stock ? Number(p.stock) : 0),
      // images/videos as arrays for gallery support
      images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
      videos: Array.isArray(p.videos) ? p.videos : (p.video ? [p.video] : []),
      // product type: physical | digital
      type: p.type || (p.downloadUrl || p.downloadableUrl ? 'digital' : 'physical'),
      downloadUrl: p.downloadUrl || p.downloadableUrl || null,
      description: p.description || p.desc || '',
      category: p.category || 'general',
      tags: Array.isArray(p.tags) ? p.tags : (p.tags ? String(p.tags).split(',').map(t=>t.trim()) : []),
      // preserve any extra fields (rating, reviews, etc.)
      ...p,
    }
  }

  const [products, setProducts] = useState(() => {
    try {
      const raw = localStorage.getItem('my_store_products')
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) return arr.map(normalizeProduct)
      }
      // seed demo product with gallery and types
      return [
        normalizeProduct({ id: 'p_1', name: 'Demo Product', price: 49.99, sellerId: 'seller-1', stock: 10, images: ['/vite.svg'], description: 'A demo product for the store', category: 'demo' })
      ]
    } catch {
      return []
    }
  })

  const [sellers, setSellers] = useState(() => {
    try {
      const raw = localStorage.getItem('my_store_sellers')
      if (raw) return JSON.parse(raw)
      return [ { id: 'seller-1', name: 'Demo Seller', email: 'seller@example.com' } ]
    } catch {
      return []
    }
  })

  useEffect(() => {
    try { localStorage.setItem('my_store_products', JSON.stringify(products)) } catch {}
  }, [products])

  useEffect(() => {
    try { localStorage.setItem('my_store_sellers', JSON.stringify(sellers)) } catch {}
  }, [sellers])

  const addProduct = (product) => {
    const p = normalizeProduct({ id: `p_${Date.now()}`, ...product })
    setProducts(prev => [p, ...prev])
    return p
  }

  const updateProduct = (id, patch) => setProducts(prev => prev.map(p => p.id === id ? normalizeProduct({ ...p, ...patch }) : p))
  const removeProduct = (id) => setProducts(prev => prev.filter(p => p.id !== id))

  const addSeller = (seller) => {
    const s = { id: `seller_${Date.now()}`, ...seller }
    setSellers(prev => [s, ...prev])
    return s
  }

  const value = { products, sellers, addProduct, updateProduct, removeProduct, addSeller }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)
export default StoreContext
