import React from 'react'
import { useStore } from '../../context/StoreContext'

const ProductsManagement = () => {
  const { products = [] } = useStore() || {}

  return (
    <div>
      <h2>Products Management</h2>
      <p>View, edit or remove products. (placeholder)</p>
      <div style={{display:'grid',gap:8}}>
        {products.length === 0 ? (
          <div>No products yet.</div>
        ) : (
          products.map(p => (
            <div key={p.id} style={{padding:8,border:'1px solid #e5e7eb',borderRadius:6}}>
              <strong>{p.title || p.name}</strong>
              <div style={{fontSize:13,color:'#6b7280'}}>Price: ${p.price}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ProductsManagement
