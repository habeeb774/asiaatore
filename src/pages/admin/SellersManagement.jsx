import React from 'react'
import { useStore } from '../../context/StoreContext'

const SellersManagement = () => {
  const { sellers = [] } = useStore() || {}

  return (
    <div>
      <h2>Sellers Management</h2>
      <p>List of registered sellers. (placeholder)</p>
      <div style={{display:'grid',gap:8}}>
        {sellers.length === 0 ? (
          <div>No sellers yet.</div>
        ) : (
          sellers.map(s => (
            <div key={s.id} style={{padding:8,border:'1px solid #e5e7eb',borderRadius:6}}>
              <strong>{s.name}</strong>
              <div style={{fontSize:13,color:'#6b7280'}}>{s.email}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SellersManagement
