import React from 'react';
import { Skeleton } from '../ui/skeleton.jsx';

const AdminTableSkeleton = ({ rows = 8, cols = 6, asRows = false }) => {
  // When used inside an existing <tbody>, render only <tr>/<td> rows
  if (asRows) {
    return (
      <>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} style={{ padding: '10px 8px', borderBottom: '1px solid #f8f8f8' }}>
                <Skeleton className="h-4 w-32" />
              </td>
            ))}
          </tr>
        ))}
      </>
    );
  }

  // Default: standalone table with headers (outside of another table)
  return (
    <div role="status" aria-live="polite" className="w-full">
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'start' }}>
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} style={{ padding: '10px 8px', borderBottom: '1px solid #f8f8f8' }}>
                  <Skeleton className="h-4 w-32" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTableSkeleton;
