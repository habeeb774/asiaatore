import React from 'react';
import { Label } from '../../ui';

const AuthFormField = ({ id, label, error, hint, children }) => (
  <div className="space-y-2 text-right">
    {label ? (
      <Label htmlFor={id} className="modern-label">
        {label}
      </Label>
    ) : null}
    <div className="relative">
      {children}
    </div>
    {hint ? <p className="text-[0.7rem] text-gray-500">{hint}</p> : null}
    {error ? (
      <p className="text-xs text-red-600 font-medium" role="alert">
        {error}
      </p>
    ) : null}
  </div>
);

export default AuthFormField;
