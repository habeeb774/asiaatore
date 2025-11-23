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
  <div style={{padding:'60px 24px', textAlign:'center', minHeight:'50vh', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'}}>
    <div className="spinner" style={{width:48,height:48,border:'4px solid #f3f4f6',borderTop:'4px solid #10b981',borderRadius:'50%',margin:'0 auto 20px',animation:'spin 1s linear infinite'}} />
    <p style={{opacity:0.8, fontSize:16, marginBottom:8}}>جاري تحميل الصفحة...</p>
    <p style={{opacity:0.5, fontSize:14}}>يرجى الانتظار لحظة</p>
    <style>{`@keyframes spin {from{transform:rotate(0)} to{transform:rotate(360deg)}}`}</style>
  </div>
);
