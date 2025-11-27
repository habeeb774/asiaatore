import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    try { console.error('ErrorBoundary caught', error, info); } catch {}
    try { this.setState({ errorInfo: info }); } catch {}
  }
  handleReload = () => { try { window.location.reload(); } catch {} };
  handleHome = () => { try { window.location.assign('/'); } catch {} };
  handleRetry = () => {
    try { if (typeof this.props.onRetry === 'function') this.props.onRetry(); } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };
  handleCopy = async () => {
    try {
      const payload = {
        message: String(this.state.error?.message || this.state.error || ''),
        stack: String(this.state.error?.stack || ''),
        componentStack: String(this.state.errorInfo?.componentStack || ''),
        ts: Date.now(),
      };
      const text = JSON.stringify(payload, null, 2);
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(text);
    } catch {}
  };
  render() {
    if (this.state.hasError) {
      const supportEmail = this.props.supportEmail;
      return (
        <div style={{ padding: 24, minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
          <div style={{ maxWidth: 720, width: '100%', background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, padding: 20 }}>
            <h3 style={{ margin: 0, marginBottom: 8 }}>حدث خطأ غير متوقع</h3>
            <p style={{ marginTop: 0, opacity: 0.8 }}>يمكنك المحاولة مرة أخرى أو إعادة تحميل الصفحة.</p>
            <pre style={{ whiteSpace: 'pre-wrap', direction: 'ltr', background: '#f8f9fb', padding: 12, borderRadius: 10, overflow: 'auto', maxHeight: 180 }}>{String(this.state.error?.message || this.state.error)}</pre>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <button onClick={this.handleRetry} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', cursor: 'pointer' }}>محاولة مرة أخرى</button>
              <button onClick={this.handleReload} style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(120deg, var(--color-primary-alt,#1C75BC), var(--color-primary,#ED1C24))', color: '#fff', cursor: 'pointer' }}>إعادة تحميل الصفحة</button>
              <button onClick={this.handleHome} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', cursor: 'pointer' }}>العودة للرئيسية</button>
              <button onClick={() => this.setState({ showDetails: !this.state.showDetails })} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', cursor: 'pointer' }}>{this.state.showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</button>
              <button onClick={this.handleCopy} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', cursor: 'pointer' }}>نسخ التفاصيل</button>
              {supportEmail ? (
                <a href={`mailto:${supportEmail}`} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: '#fff', textDecoration: 'none' }}>التواصل مع الدعم</a>
              ) : null}
            </div>
            {this.state.showDetails ? (
              <div style={{ marginTop: 12 }}>
                <pre style={{ whiteSpace: 'pre-wrap', direction: 'ltr', background: '#f1f3f5', padding: 12, borderRadius: 10, overflow: 'auto', maxHeight: 260 }}>{String(this.state.error?.stack || '')}\n\n{String(this.state.errorInfo?.componentStack || '')}</pre>
              </div>
            ) : null}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
