import React, { useState } from 'react';
import adminApi from '../../../services/api/admin';
import { useToast } from '../../../stores/ToastContext';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/input';
import { Select } from '../../ui/select';

const AddUserForm = ({ onUserAdded, onCancel }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user', phone: '', sendInvite: true, showPassword: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const genPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*()_+';
    let pass = '';
    for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    setForm(f => ({ ...f, password: pass, confirmPassword: pass, showPassword: true, sendInvite: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        password: form.sendInvite ? undefined : form.password,
        name: form.name.trim() || undefined,
        role: form.role,
        phone: form.phone.trim() || undefined,
        sendInvite: form.sendInvite,
      };

      if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
        throw new Error('يرجى إدخال بريد إلكتروني صحيح');
      }
      if (!form.sendInvite) {
        if (!payload.password || payload.password.length < 6) {
          throw new Error('كلمة المرور يجب ألا تقل عن 6 أحرف');
        }
        if (form.password !== form.confirmPassword) {
          throw new Error('تأكيد كلمة المرور لا يطابق');
        }
      }

  const res = await adminApi.createUser(payload);
      if (res.user) {
        onUserAdded(res.user);
      }
    } catch (e) {
      const msg = e.message || 'فشل إنشاء المستخدم';
      setError(msg.includes('EMAIL_EXISTS') ? 'هذا البريد مستخدم بالفعل' : msg);
      toast.error('فشل الإنشاء', msg);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'user', label: 'مستخدم' },
    { value: 'admin', label: 'مدير' },
    { value: 'seller', label: 'بائع' },
  ];

  return (
    <form onSubmit={handleSubmit} className="p-4 my-4 bg-slate-50 border rounded-lg space-y-4">
      <h3 className="font-bold text-lg">إضافة مستخدم جديد</h3>
      {error && <div className="bg-red-100 border border-red-200 text-red-700 p-3 rounded-md text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="الاسم" value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="اختياري" />
        <Input label="البريد الإلكتروني" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} required />
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">كلمة المرور</label>
          <div className="flex gap-2">
            <Input
              type={form.showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              disabled={form.sendInvite}
              minLength={form.sendInvite ? 0 : 6}
              placeholder={form.sendInvite ? 'سيتم إرسال رابط تعيين' : ''}
            />
            <Button type="button" variant="outline" onClick={() => handleChange('showPassword', !form.showPassword)}>{form.showPassword ? 'إخفاء' : 'إظهار'}</Button>
            <Button type="button" variant="outline" onClick={genPassword} disabled={form.sendInvite}>توليد</Button>
          </div>
        </div>
        {!form.sendInvite && (
          <Input label="تأكيد كلمة المرور" type={form.showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} minLength={6} />
        )}
        <Select label="الدور" value={form.role} onChange={e => handleChange('role', e.target.value)}>
          {roleOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input label="الجوال" type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="اختياري" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="sendInvite" checked={form.sendInvite} onChange={e => handleChange('sendInvite', e.target.checked)} />
        <label htmlFor="sendInvite" className="text-sm">إرسال دعوة عبر البريد لتعيين كلمة المرور</label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>إلغاء</Button>
        <Button type="submit" disabled={loading}>{loading ? 'جارٍ الإضافة…' : 'حفظ'}</Button>
      </div>
    </form>
  );
};

export default AddUserForm;
