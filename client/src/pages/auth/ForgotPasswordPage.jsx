import React, { useState } from 'react';
import api from '../../api/client';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';

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
          <CardDescription>أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3">
            <Input
              id="email"
              type="email"
              label="البريد الإلكتروني"
              placeholder="example@mail.com"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              error={error && !sent ? error : undefined}
            />
            {sent && (<div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">تم إرسال رابط (وهمي) إن كان البريد مسجلاً.</div>)}
            <Button type="submit" disabled={loading} className="w-full">{loading? '...إرسال' : 'إرسال رابط'}</Button>
            <p className="mt-1 text-[0.72rem]">تذكرت؟ <Link to="/login" className="underline">عودة لتسجيل الدخول</Link></p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// legacy inline styles removed; using Tailwind classes

export default ForgotPasswordPage;