import React from 'react'
import { useLocation } from 'react-router-dom'

const SearchResults = () => {
  const { search } = useLocation()
  return (
    <div className="container-custom px-4 py-12">
      <h2 className="text-2xl font-bold mb-4">نتائج البحث</h2>
      <p>نتيجة البحث: {search}</p>
    </div>
  )
}

export default SearchResults
