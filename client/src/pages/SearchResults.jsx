import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/common/Breadcrumbs'
import api from '../services/api/client'
import { useLanguage } from '../stores/LanguageContext'
import ProductCard from '../components/shared/ProductCard'

const SearchResults = () => {
  const { search } = useLocation()
  const navigate = useNavigate()
  const { locale, t } = useLanguage()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const query = new URLSearchParams(search).get('q') || ''

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([])
        setTotal(0)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await api.searchProducts({ q: query.trim(), page: 1, pageSize: 24 })
        setResults(data.products || [])
        setTotal(data.total || 0)
        setPage(data.page || 1)
        setHasMore(data.hasMore || false)
      } catch (err) {
        setError(err.message || 'Search failed')
        setResults([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  const loadMore = async () => {
    if (!hasMore || loading) return

    try {
      const nextPage = page + 1
      const data = await api.searchProducts({ q: query.trim(), page: nextPage, pageSize: 24 })
      setResults(prev => [...prev, ...(data.products || [])])
      setPage(data.page || nextPage)
      setHasMore(data.hasMore || false)
    } catch (err) {
      setError(err.message || 'Failed to load more results')
    }
  }

  return (
    <div className="container-custom px-4 py-12">
      <Breadcrumbs items={[
        { label: locale === 'ar' ? 'الرئيسية' : 'Home', to: '/' },
        { label: locale === 'ar' ? 'نتائج البحث' : 'Search Results' }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {locale === 'ar' ? 'نتائج البحث' : 'Search Results'}
        </h1>
        {query && (
          <p className="text-gray-600 dark:text-gray-400">
            {locale === 'ar' ? `البحث عن: "${query}"` : `Searching for: "${query}"`}
          </p>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            {locale === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </div>
      )}

      {!loading && !error && results.length === 0 && query && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {locale === 'ar' ? 'لا توجد نتائج للبحث' : 'No results found'}
          </p>
          <p className="text-sm text-gray-500">
            {locale === 'ar' ? 'جرب كلمات بحث مختلفة' : 'Try different search terms'}
          </p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {locale === 'ar' ? `${total} نتيجة` : `${total} results`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {results.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/product/${product.slug || product.id}`)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (locale === 'ar' ? 'جاري التحميل...' : 'Loading...') : (locale === 'ar' ? 'تحميل المزيد' : 'Load More')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SearchResults
