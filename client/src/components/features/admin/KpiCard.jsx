import React from 'react';

export const KpiCard = ({ label, value, help }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    {help && <p className="text-xs text-slate-400 mt-1">{help}</p>}
  </div>
);
