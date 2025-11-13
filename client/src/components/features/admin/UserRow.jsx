import React, { useState } from 'react';
import adminApi from '../../../services/api/admin';
import { useToast } from '../../../stores/ToastContext';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/select';
import { MoreVertical, Trash2, UserX, UserCheck } from 'lucide-react';

const UserRow = ({ user, onUserUpdated, onUserDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newRole, setNewRole] = useState(user.role);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toast = useToast();

  const handleRoleUpdate = async () => {
    try {
  await adminApi.updateUser(user.id, { role: newRole });
      onUserUpdated({ ...user, role: newRole });
      setIsEditing(false);
      toast.success('تم تحديث الدور بنجاح');
    } catch (e) {
      toast.error('فشل تحديث الدور', e.message);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = !user.active;
    try {
      if (newStatus) await adminApi.activateUser(user.id);
      else await adminApi.deactivateUser(user.id);
      onUserUpdated({ ...user, active: newStatus });
      toast.success(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} المستخدم`);
    } catch (e) {
      toast.error('فشل تغيير حالة المستخدم', e.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`هل أنت متأكد من حذف المستخدم: ${user.name || user.email}؟`)) {
      try {
  await adminApi.deleteUser(user.id);
        onUserDeleted(user.id);
        toast.success('تم حذف المستخدم بنجاح');
      } catch (e) {
        toast.error('فشل حذف المستخدم', e.message);
      }
    }
  };

  const roleOptions = [
    { value: 'user', label: 'مستخدم' },
    { value: 'admin', label: 'مدير' },
    { value: 'seller', label: 'بائع' },
  ];
  
  const roleObj = roleOptions.find(r => r.value === user.role);

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="p-3">
        <div className="flex items-center gap-3">
          <img
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-medium text-slate-800">{user.name || '—'}</span>
        </div>
      </td>
      <td className="p-3 text-slate-600">{user.email}</td>
      <td className="p-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Select value={newRole} onChange={e => setNewRole(e.target.value)} className="h-8">
              {roleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={handleRoleUpdate}>حفظ</Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>إلغاء</Button>
          </div>
        ) : (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              user.role === 'admin' ? 'bg-green-100 text-green-800' :
              user.role === 'seller' ? 'bg-orange-100 text-orange-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {roleObj?.label || user.role}
          </span>
        )}
      </td>
      <td className="p-3">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {user.active ? 'مفعل' : 'غير مفعل'}
        </span>
      </td>
      <td className="p-3 text-slate-500">
        {new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
      </td>
      <td className="p-3 text-left relative">
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(o => !o)}>
          <MoreVertical size={16} />
        </Button>
        {isMenuOpen && (
          <div
            className="absolute left-0 top-10 mt-2 w-48 bg-white border rounded-md shadow-lg z-10"
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <ul className="py-1">
              <li>
                <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">تعديل الدور</button>
              </li>
              <li>
                <button onClick={handleStatusToggle} className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  {user.active ? <UserX size={14} /> : <UserCheck size={14} />}
                  {user.active ? 'تعطيل' : 'تفعيل'}
                </button>
              </li>
              <li>
                <button onClick={handleDelete} className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <Trash2 size={14} />
                  حذف
                </button>
              </li>
            </ul>
          </div>
        )}
      </td>
    </tr>
  );
};

export default UserRow;
