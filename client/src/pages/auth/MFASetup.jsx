import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../stores/AuthContext';
import { useToast } from '../../stores/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { FiShield, FiCheck } from 'react-icons/fi';

export default function MFASetup() {
  const { user } = useAuth() || {};
  const toast = useToast();
  const [step, setStep] = useState('setup'); // setup, verify, enabled
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && step === 'setup') {
      setupMFA();
    }
  }, [user, step, setupMFA]);

  const setupMFA = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok) {
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
        setStep('verify');
      } else {
        toast?.error?.('فشل في إعداد MFA', data.error || 'حدث خطأ');
      }
    } catch {
      toast?.error?.('فشل في إعداد MFA', 'تحقق من الاتصال');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  async function enableMFA() {
    if (!code) return toast?.error?.('أدخل رمز التحقق');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.ok) {
        toast?.success?.('تم تفعيل MFA', 'الآن يتطلب تسجيل الدخول رمز MFA');
        setStep('enabled');
      } else {
        toast?.error?.('رمز غير صحيح', 'تحقق من الرمز وحاول مرة أخرى');
      }
    } catch {
      toast?.error?.('فشل في تفعيل MFA', 'تحقق من الاتصال');
    } finally {
      setLoading(false);
    }
  }

  async function disableMFA() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok) {
        toast?.success?.('تم إلغاء تفعيل MFA');
        setStep('setup');
      } else {
        toast?.error?.('فشل في إلغاء تفعيل MFA', data.error || 'حدث خطأ');
      }
    } catch {
      toast?.error?.('فشل في إلغاء تفعيل MFA', 'تحقق من الاتصال');
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return <div>يجب تسجيل الدخول أولاً</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FiShield /> إعداد المصادقة الثنائية (MFA)
      </h1>
      <p>أضف طبقة إضافية من الأمان باستخدام تطبيق Google Authenticator.</p>

      {step === 'setup' && (
        <div>
          <p>اضغط على الزر لبدء إعداد MFA.</p>
          <Button onClick={setupMFA} disabled={loading}>
            {loading ? 'جارٍ الإعداد...' : 'إعداد MFA'}
          </Button>
        </div>
      )}

      {step === 'verify' && (
        <div>
          <p>1. قم بتثبيت تطبيق Google Authenticator على هاتفك.</p>
          <p>2. امسح الرمز QR التالي باستخدام التطبيق:</p>
          <img src={qrCodeUrl} alt="QR Code" style={{ maxWidth: 200, margin: '16px 0' }} />
          <p>أو أدخل السر يدويًا: <code>{secret}</code></p>
          <p>3. أدخل رمز التحقق من التطبيق:</p>
          <Input
            type="text"
            placeholder="رمز 6 أرقام"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
          />
          <Button onClick={enableMFA} disabled={loading || !code}>
            {loading ? 'جارٍ التحقق...' : 'تفعيل MFA'}
          </Button>
        </div>
      )}

      {step === 'enabled' && (
        <div>
          <p style={{ color: 'green', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCheck /> تم تفعيل MFA بنجاح!
          </p>
          <p>الآن، عند تسجيل الدخول، ستحتاج إلى إدخال رمز من التطبيق.</p>
          <Button variant="outline" onClick={disableMFA} disabled={loading}>
            إلغاء تفعيل MFA
          </Button>
        </div>
      )}
    </div>
  );
}