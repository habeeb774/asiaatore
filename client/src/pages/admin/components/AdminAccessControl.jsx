import React from 'react';

const AdminAccessControl = ({ user }) => {
  return (
    <div className="admin-access-denied">
      <h2>🚫 صلاحيات غير كافية</h2>
      <p>لا تملك صلاحية الوصول إلى لوحة المدير. إذا كنت تعتقد أن هذا خطأ، تواصل مع المدير الرئيسي.</p>
      
      {/* معلومات التصحيح - إزالة في الإنتاج */}
      <div className="debug-info">
        <h4>Debug Info:</h4>
        <div>User: {JSON.stringify(user, null, 2)}</div>
        <div>Role: {user?.role || 'undefined'}</div>
        <div>Has admin role: {user?.role === 'admin' ? 'true' : 'false'}</div>
        <div>Development mode: {import.meta?.env?.DEV ? 'true' : 'false'}</div>
      </div>
      
      <a href="/" className="back-home">العودة للرئيسية</a>
    </div>
  );
};

export default AdminAccessControl;
