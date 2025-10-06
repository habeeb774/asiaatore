import React, { useEffect, useState } from 'react'
import api from '../api/client'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { resolveLocalized } from '../utils/locale'

const Categories = () => {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.listCategories().then(r => {
      if (mounted && r?.categories) setCats(r.categories)
    }).catch(e => {
      if (mounted) setError(e.message)
    }).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const { locale } = useLanguage ? useLanguage() : { locale: 'ar' };
  return (
    <div className="container-custom px-4 py-12">
      <h2 className="text-2xl font-bold mb-4">الفئات</h2>
      {loading && <div className="text-sm opacity-70">جار التحميل...</div>}
      {error && <div className="text-sm text-red-600">خطأ: {error}</div>}
      {!loading && !error && cats.length === 0 && <div>لا توجد فئات بعد.</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {cats.map(c => (
          <Link to={`/category/${c.slug}`} key={c.id} className="border p-4 rounded hover:shadow bg-white flex flex-col gap-2">
            {c.image && <img src={c.image} alt={resolveLocalized(c.name, locale)} className="w-full h-32 object-cover rounded" />}
            <div className="font-semibold">{resolveLocalized(c.name, locale)}</div>
            {c.icon && <div className="text-xs text-gray-500">Icon: {c.icon}</div>}
            { (c.description?.ar || c.description?.en) && <div className="text-xs text-gray-600 line-clamp-3">{c.description.ar || c.description.en}</div> }
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Categories
