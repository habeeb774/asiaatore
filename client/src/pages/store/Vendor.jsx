import React from 'react'
import { useParams } from 'react-router-dom'

const Vendor = () => {
  const { id } = useParams()
  return (
    <div className="container-custom px-4 py-12">
      <h2 className="text-2xl font-bold mb-4">متجر البائع: {id}</h2>
      <p>صفحة البائع العامة وعرض منتجاته.</p>
    </div>
  )
}

export default Vendor
