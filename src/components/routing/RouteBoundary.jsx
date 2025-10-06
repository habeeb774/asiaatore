import React from 'react';

export class RouteErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError:false, error:null };
  }
  static getDerivedStateFromError(error){
    return { hasError:true, error };
  }
  componentDidCatch(error, info){
    // Optionally log
    if (window && window.console) console.error('Route boundary error', error, info);
  }
  render(){
    if (this.state.hasError){
      return (
        <div style={{padding:'40px', textAlign:'center'}}>
          <h2 style={{marginBottom:16}}>⚠ حدث خطأ في تحميل الصفحة</h2>
          <pre style={{whiteSpace:'pre-wrap', direction:'ltr', textAlign:'left', background:'#f8f8f8', padding:12, borderRadius:8, maxWidth:600, margin:'0 auto'}}>{String(this.state.error)}</pre>
          <button style={{marginTop:20}} onClick={() => window.location.reload()}>إعادة تحميل</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const PageFallback = () => (
  <div style={{padding:'60px 24px', textAlign:'center'}}>
    <div className="spinner" style={{width:42,height:42,border:'5px solid #eee',borderTop:'5px solid #69be3c',borderRadius:'50%',margin:'0 auto 24px',animation:'spin 1s linear infinite'}} />
    <p style={{opacity:.7}}>جاري تحميل الصفحة...</p>
    <style>{`@keyframes spin {from{transform:rotate(0)} to{transform:rotate(360deg)}}`}</style>
  </div>
);
