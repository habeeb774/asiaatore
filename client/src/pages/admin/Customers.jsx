import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { Plus, RefreshCw, Upload, Search, ChevronDown, ChevronUp } from 'lucide-react';
import Seo from '../../components/Seo';
import { adminApi } from '../../services/api/admin';
import { useToast } from '../../stores/ToastContext';
import AdminLayout from '../../components/features/admin/AdminLayout';
import AdminTableSkeleton from '../../components/features/admin/AdminTableSkeleton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import { KpiCard } from '../../components/features/admin/KpiCard';
import AddUserForm from '../../components/features/admin/AddUserForm';
import UserRow from '../../components/features/admin/UserRow';

const Customers = () => {
  // Filters and pagination state
  const [filters, setFilters] = useState({ search: '', role: '', status: '', from: '', to: '' });
  const [debouncedSearch] = useDebounce(filters.search, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState({ by: 'createdAt', dir: 'desc' });

  // Data state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  
  const toast = useToast();

  // UI state
  const [addOpen, setAddOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        role: filters.role || undefined,
        status: filters.status || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        sortBy: sort.by,
        sortDir: sort.dir,
      };
  const res = await adminApi.listUsers(params);
      setUsers(res.users || []);
      setTotalUsers(res.total || 0);
    } catch (e) {
      setError(e.message || 'فشل تحميل المستخدمين');
      toast.error('فشل تحميل المستخدمين', e.message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filters.role, filters.status, filters.from, filters.to, sort.by, sort.dir, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleFilterChange = (field, value) => {
    setFilters(f => ({ ...f, [field]: value }));
    setPage(1);
  };

  const handleSort = (column) => {
    if (sort.by === column) {
      setSort(s => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }));
    } else {
      setSort({ by: column, dir: 'desc' });
    }
  };

  const onUserAdded = (newUser) => {
    setUsers(currentUsers => [newUser, ...currentUsers]);
    setTotalUsers(t => t + 1);
    setAddOpen(false);
    toast.success('تم إنشاء المستخدم بنجاح');
  };

  const onUserUpdated = (updatedUser) => {
    setUsers(users => users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const onUserDeleted = (userId) => {
    setUsers(users => users.filter(u => u.id !== userId));
    setTotalUsers(t => t - 1);
  };

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  const kpiData = useMemo(() => [
    { label: 'إجمالي العملاء', value: totalUsers },
    { label: 'العملاء النشطون', value: users.filter(u => u.active).length, help: 'المستخدمون الذين سجلوا دخولاً خلال آخر 30 يومًا' },
    { label: 'عدد المدراء', value: users.filter(u => u.role === 'admin').length },
    { label: 'مسجّلون هذا الشهر', value: users.filter(u => new Date(u.createdAt) > new Date(new Date().setDate(new Date().getDate() - 30))).length },
  ], [users, totalUsers]);

  const roleOptions = [
    { value: '', label: 'كل الأدوار' },
    { value: 'user', label: 'مستخدم' },
    { value: 'admin', label: 'مدير' },
    { value: 'seller', label: 'بائع' },
  ];

  const statusOptions = [
    { value: '', label: 'كل الحالات' },
    { value: 'active', label: 'مفعل' },
    { value: 'inactive', label: 'غير مفعل' },
  ];

  const renderSortArrow = (column) => {
    if (sort.by !== column) return null;
    return sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <AdminLayout title="إدارة العملاء">
      <Seo title="إدارة العملاء" description="إدارة المستخدمين والعملاء في لوحة التحكم" />
      
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>قائمة العملاء ({totalUsers})</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
                <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button variant="outline" size="sm" onClick={() => { /* export logic */ }}>
                <Upload size={14} className="mr-2" />
                تصدير
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus size={14} className="mr-2" />
                إضافة مستخدم
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border">
              <div className="lg:col-span-2">
                <Input
                  placeholder="بحث بالاسم، البريد، أو الجوال..."
                  value={filters.search}
                  onChange={e => handleFilterChange('search', e.target.value)}
                  icon={<Search size={16} className="text-slate-400" />}
                />
              </div>
              <Select
                value={filters.role}
                onChange={e => handleFilterChange('role', e.target.value)}
                options={roleOptions}
              />
              <Select
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                options={statusOptions}
              />
              <Input
                type="date"
                value={filters.from}
                onChange={e => handleFilterChange('from', e.target.value)}
                label="من تاريخ"
              />
            </div>

            {addOpen && <AddUserForm onUserAdded={onUserAdded} onCancel={() => setAddOpen(false)} />}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-slate-500 bg-slate-50">
                  <tr>
                    <th className="p-3 font-semibold cursor-pointer" onClick={() => handleSort('name')}>
                      <span className="flex items-center gap-1">الاسم {renderSortArrow('name')}</span>
                    </th>
                    <th className="p-3 font-semibold cursor-pointer" onClick={() => handleSort('email')}>
                      <span className="flex items-center gap-1">البريد {renderSortArrow('email')}</span>
                    </th>
                    <th className="p-3 font-semibold cursor-pointer" onClick={() => handleSort('role')}>
                      <span className="flex items-center gap-1">الدور {renderSortArrow('role')}</span>
                    </th>
                    <th className="p-3 font-semibold">الحالة</th>
                    <th className="p-3 font-semibold cursor-pointer" onClick={() => handleSort('createdAt')}>
                      <span className="flex items-center gap-1">تاريخ الانضمام {renderSortArrow('createdAt')}</span>
                    </th>
                    <th className="p-3 font-semibold text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <AdminTableSkeleton rows={pageSize} cols={6} asRows />
                  ) : error ? (
                    <tr><td colSpan="6" className="text-center py-12 text-red-500">{error}</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-12 text-slate-500">لا توجد نتائج تطابق بحثك.</td></tr>
                  ) : (
                    users.map(user => (
                      <UserRow 
                        key={user.id} 
                        user={user} 
                        onUserUpdated={onUserUpdated}
                        onUserDeleted={onUserDeleted}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-4 border-t mt-4">
              <span className="text-sm text-slate-500">
                إجمالي: {totalUsers} | صفحة {page} من {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                  السابق
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  التالي
                </Button>
                <Select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  options={[
                    { value: 10, label: '10 / صفحة' },
                    { value: 20, label: '20 / صفحة' },
                    { value: 50, label: '50 / صفحة' },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Customers;
