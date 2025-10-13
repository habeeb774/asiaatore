import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!email.trim() || !password) return setError('أدخل البريد وكلمة المرور');
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين');
    try {
      setLoading(true);
      const res = await api.authRegister(email.trim(), password, name.trim());
      if (res.ok) {
        navigate('/login', { replace: true, state: { justRegistered: true } });
      } else {
        setError(res.error === 'EMAIL_EXISTS' ? 'البريد مستخدم بالفعل' : (res.error || 'فشل التسجيل'));
      }
    } catch (e2) {
      setError(e2.message || 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] w-full grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>إنشاء حساب</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid gap-1">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" placeholder="الاسم" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="example@mail.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
              <Input id="confirm" type="password" placeholder="••••••••" value={confirm} onChange={e=>setConfirm(e.target.value)} />
            </div>
            {error ? (<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>) : null}
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#69be3c] to-amber-400">{loading? '...جاري' : 'تسجيل'}</Button>
            <p className="mt-1 text-[0.72rem]">لديك حساب؟ <Link to="/login" className="underline">دخول</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// legacy inline styles removed; using Tailwind classes

export default RegisterPage;
