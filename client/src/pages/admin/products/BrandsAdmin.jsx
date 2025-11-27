import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../../components/features/admin/AdminLayout';
import Seo from '../../../components/Seo';
import api from '../../../services/api/client';
import { Button, Label } from '../../../components/ui';
import Input from '../../../components/ui/input';
import Select from '../../../components/ui/select';

export default function BrandsAdmin() {
  const [brands, setBrands] = useState([]);
  const [brandIssues, setBrandIssues] = useState(null);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState(null);
  const [brandFilter, setBrandFilter] = useState('');
  const [brandSort, setBrandSort] = useState('created_desc');
  const [brandPage, setBrandPage] = useState(1);
  const [brandPageSize, setBrandPageSize] = useState(30);

  useEffect(() => {
    setBrandLoading(true); setBrandError(null);
    api.brandsList()
      .then(list => setBrands(list))
      .catch(e => setBrandError(e.message))
      .finally(() => setBrandLoading(false));
  }, []);

  const visibleBrands = useMemo(() => {
    let list = [...brands];
    if (brandFilter) {
      const needle = brandFilter.toLowerCase();
      list = list.filter(b => ((b.name?.ar || b.name?.en || b.slug || '') + '').toLowerCase().includes(needle));
    }
    list.sort((a,b)=>{
      switch (brandSort) {
        case 'name_ar': return (a.name?.ar||'').localeCompare(b.name?.ar||'');
        case 'name_en': return (a.name?.en||'').localeCompare(b.name?.en||'');
        case 'products_desc': return (b.productCount||0) - (a.productCount||0);
        case 'products_asc': return (a.productCount||0) - (b.productCount||0);
        case 'created_asc': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'created_desc':
        default: return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    return list;
  }, [brands, brandFilter, brandSort]);

  const brandTotalPages = Math.max(1, Math.ceil((visibleBrands.length || 0) / brandPageSize));
  const paginatedBrands = useMemo(() => {
    const start = (brandPage - 1) * brandPageSize;
    return visibleBrands.slice(start, start + brandPageSize);
  }, [visibleBrands, brandPage, brandPageSize]);

  return (
    <AdminLayout title="إدارة العلامات التجارية">
      <Seo title="إدارة العلامات التجارية" />
      <div style={{padding:24}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:12}}>
          <Input placeholder="بحث بالاسم أو السجل" value={brandFilter} onChange={e=>setBrandFilter(e.target.value)} style={{maxWidth:220}} />
          <Select value={brandSort} onChange={e=>setBrandSort(e.target.value)} style={{maxWidth:160}}>
            <option value="created_desc">الأحدث</option>
            <option value="created_asc">الأقدم</option>
            <option value="name_ar">الاسم (عربي)</option>
            <option value="name_en">الاسم (إنجليزي)</option>
            <option value="products_desc">أكثر منتجات</option>
            <option value="products_asc">أقل منتجات</option>
          </Select>
          <Button variant="ghost" onClick={()=>{
            setBrandLoading(true); setBrandError(null);
            api.brandsList()
              .then(list => setBrands(list))
              .catch(e => setBrandError(e.message))
              .finally(() => setBrandLoading(false));
          }}>تحديث</Button>
          {brandLoading && <span>...تحميل</span>}
          {brandError && <span style={{color:'var(--color-danger-2)'}}>{brandError}</span>}
        </div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr><th>الاسم</th><th>Slug</th><th>المنتجات</th><th>تاريخ الإنشاء</th></tr>
          </thead>
          <tbody>
            {paginatedBrands.map(b => (
              <tr key={b.id}>
                <td>{(b.name?.ar || b.name?.en) || b.slug}</td>
                <td style={{fontSize:'.8rem'}}>{b.slug}</td>
                <td>{b.productCount || 0}</td>
                <td>{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {!paginatedBrands.length && !brandLoading && <tr><td colSpan={4} style={{padding:12}}>لا توجد علامات</td></tr>}
          </tbody>
        </table>
        {visibleBrands.length > 0 && (
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:8}}>
            <Button variant={brandPage===1? 'ghost' : 'primary'} disabled={brandPage===1} onClick={()=>setBrandPage(p=>Math.max(1,p-1))}>السابق</Button>
            <span style={{fontSize:'.65rem'}}>صفحة {brandPage} / {brandTotalPages}</span>
            <Button variant={brandPage===brandTotalPages? 'ghost' : 'primary'} disabled={brandPage===brandTotalPages} onClick={()=>setBrandPage(p=>Math.min(brandTotalPages,p+1))}>التالي</Button>
            <span style={{marginInlineStart:10,fontSize:'.65rem'}}>عدد الصفوف:</span>
            <Select value={brandPageSize} onChange={e=>{ setBrandPageSize(+e.target.value); setBrandPage(1); }} style={{maxWidth:80}}>
              {[10,20,30,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
            </Select>
            <span style={{fontSize:'.65rem',opacity:.7}}>{visibleBrands.length} عنصر</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
