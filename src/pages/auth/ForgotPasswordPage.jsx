import React, { useState } from 'react';
import { api } from '../../api/client';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Label } from '../../components/ui/label.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card.jsx';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!email.trim()) return setError('أدخل البريد');
    try {
      setLoading(true);
      const r = await api.authForgot(email.trim());
      if (r.ok) setSent(true); else setError(r.error || 'فشل الإرسال');
    } catch (e2) {
      setError(e2.message || 'خطأ غير متوقع');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] w-full grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>استرجاع كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3">
            <p className="text-xs text-gray-500">أدخل بريدك لإرسال رابط/رمز إعادة التعيين (محاكاة).</p>
            <div className="grid gap-1">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" placeholder="example@mail.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            {error ? (<div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>) : null}
            {sent ? (<div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">تم إرسال رابط (وهمي) إن كان البريد مسجلاً.</div>) : null}
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-[#69be3c] to-amber-400">{loading? '...إرسال' : 'إرسال رابط'}</Button>
            <p className="mt-1 text-[0.72rem]">تذكرت؟ <Link to="/login" className="underline">عودة لتسجيل الدخول</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// legacy inline styles removed; using Tailwind classes

export default ForgotPasswordPage;