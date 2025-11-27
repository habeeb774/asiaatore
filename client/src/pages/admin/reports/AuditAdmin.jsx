import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../components/features/admin/AdminLayout';
import { Button } from '../../../components/ui';
import Seo from '../../../components/Seo';
import { adminApi } from '../../../services/api/admin';

export default function AuditAdmin() {
  const [remoteAudit, setRemoteAudit] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    adminApi.listAudit({ page: auditPage })
      .then(a => {
        if (!active) return;
        setRemoteAudit(a.logs || []);
        setAuditTotalPages(a.totalPages || 1);
      })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [auditPage, reload]);

  return (
    <AdminLayout title="سجلات التدقيق">
      <Seo title="سجلات التدقيق" />
      <div style={{padding:24}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <h3 style={{margin:0}}>سجلات التدقيق</h3>
          <Button type="button" variant="primary" onClick={()=>setReload(r=>r+1)}>تحديث</Button>
          <span style={{fontSize:'.6rem',color:'#475569'}}>{loading? '...تحميل' : ''}</span>
        </div>
        <div style={{overflowX:'auto',marginTop:16}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                <th>الوقت</th><th>الإجراء</th><th>الكيان</th><th>المعرف</th><th>المستخدم</th>
              </tr>
            </thead>
            <tbody>
              {remoteAudit.map(l => (
                <tr key={l.id}>
                  <td>{new Date(l.createdAt).toLocaleTimeString()}</td>
                  <td>{l.action}</td>
                  <td>{l.entity}</td>
                  <td>{l.entityId}</td>
                  <td>{l.userId || '—'}</td>
                </tr>
              ))}
              {!remoteAudit.length && !loading && (
                <tr><td colSpan={5} style={{padding:12}}>لا توجد سجلات</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {auditTotalPages > 1 && (
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:12}}>
            <Button disabled={auditPage===1} variant={auditPage===1? 'ghost':'primary'} onClick={()=>setAuditPage(p=>Math.max(1,p-1))}>السابق</Button>
            <span style={{alignSelf:'center',fontSize:'.65rem'}}>صفحة {auditPage} / {auditTotalPages}</span>
            <Button disabled={auditPage===auditTotalPages} variant={auditPage===auditTotalPages? 'ghost':'primary'} onClick={()=>setAuditPage(p=>Math.min(auditTotalPages,p+1))}>التالي</Button>
          </div>
        )}
        {error && <div style={{fontSize:'.65rem',color:'var(--color-danger-2)',marginTop:8}}>خطأ: {error}</div>}
      </div>
    </AdminLayout>
  );
}
