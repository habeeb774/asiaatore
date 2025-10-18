import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useLanguage } from '../context/LanguageContext'
import { resolveLocalized } from '../utils/locale'
import Breadcrumbs from '../components/common/Breadcrumbs'

const Category = () => {
  const { slug } = useParams()
  const [cat, setCat] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.getCategoryBySlug(slug).then(r => {
      if (mounted && r?.category) setCat(r.category)
    }).catch(e => { if (mounted) setError(e.message) })
    // naive product filter on client (existing products endpoint); optional: add server filter
    api.listProducts().then(list => {
      if (mounted && list?.products) {
        const filtered = list.products.filter(p => p.category === slug)
        setProducts(filtered)
      }
    }).catch(()=>{})
    .finally(()=> mounted && setLoading(false))
    return () => { mounted = false }
  }, [slug])

  const lang = useLanguage();
  const locale = lang?.locale ?? 'ar';

  return (
    <div className="container-custom px-4 py-12">
      <Breadcrumbs items={[
        { label: locale === 'ar' ? 'الرئيسية' : 'Home', to: '/' },
        { label: locale === 'ar' ? 'الفئات' : 'Categories', to: '/categories' },
        { label: cat ? resolveLocalized(cat.name, locale) : slug }
      ]} />
      <h2 className="text-2xl font-bold mb-4">{locale==='ar' ? 'الفئة' : 'Category'}: {cat ? resolveLocalized(cat.name, locale) : slug}</h2>
      {loading && <div className="text-sm opacity-70">جار التحميل...</div>}
      {error && <div className="text-sm text-red-600">خطأ: {error}</div>}
      {cat && (
        <div className="mb-6 space-y-2">
          <div className="text-lg font-semibold">{resolveLocalized(cat.name, locale)}</div>
          { (cat.description?.ar || cat.description?.en) && <div className="text-sm text-gray-700">{resolveLocalized(cat.description, locale)}</div> }
          { cat.image && <img src={cat.image} alt={resolveLocalized(cat.name, locale)} className="w-full max-w-md rounded" /> }
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map(pr => (
          <Link key={pr.id} to={`/product/${pr.id}`} className="border p-3 rounded hover:shadow bg-white flex flex-col">
            {pr.image && <img src={pr.image} alt={resolveLocalized(pr.name, locale) || pr.slug} className="w-full h-40 object-cover rounded mb-2" />}
            <div className="font-semibold text-sm">{resolveLocalized(pr.name, locale)}</div>
            <div className="text-xs text-gray-600 mt-1">{pr.price} ر.س</div>
          </Link>
        ))}
        {!loading && !error && products.length === 0 && <div className="text-sm opacity-70">لا توجد منتجات في هذه الفئة.</div>}
      </div>
    </div>
  )
}

export default Category
