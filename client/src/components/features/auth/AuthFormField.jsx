import React from 'react';
import { Label } from '../../ui';

const AuthFormField = ({ id, label, error, hint, children }) => (
  <div className="space-y-2 text-right">
    {label ? (
      <Label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
      </Label>
    ) : null}
    <div className="relative mt-1.5">
      {children}
    </div>
    {hint ? <p className="text-[0.7rem] text-slate-400">{hint}</p> : null}
    {error ? (
      <p className="text-xs text-red-400" role="alert">
        {error}
      </p>
    ) : null}
  </div>
);

export default AuthFormField;
