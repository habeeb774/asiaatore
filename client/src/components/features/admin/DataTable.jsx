import React, { useMemo } from 'react';

/**
 * Generic Admin DataTable
 * Props:
 * - columns: Array<{ header: string, accessorKey?: string, cell?: (row)=>ReactNode, width?: string }>
 * - data: any[]
 * - serverMode?: boolean
 * - page?: number
 * - pageSize?: number
 * - total?: number
 * - onPageChange?: (n: number) => void
 * - onPageSizeChange?: (n: number) => void
 * - onRowClick?: (row: any) => void
 */
export default function DataTable({
  columns = [],
  data = [],
  serverMode = false,
  page = 1,
  pageSize = 25,
  total = 0,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}) {
  const pageCount = useMemo(() => {
    const t = total || data.length || 0;
    return Math.max(1, Math.ceil(t / Math.max(1, pageSize)));
  }, [total, data.length, pageSize]);

  // Client-side slice when not in server mode
  const visibleRows = useMemo(() => {
    if (serverMode) return data;
    const start = (Math.max(1, page) - 1) * Math.max(1, pageSize);
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize, serverMode]);

  function handlePrev() {
    const next = Math.max(1, page - 1);
    if (next !== page && onPageChange) onPageChange(next);
  }
  function handleNext() {
    const next = Math.min(pageCount, page + 1);
    if (next !== page && onPageChange) onPageChange(next);
  }
  function handleSizeChange(e) {
    const val = Number(e.target.value) || 25;
    onPageSizeChange?.(val);
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="text-left font-semibold px-3 py-2 border-b border-gray-200 dark:border-gray-700"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={columns.length}>
                No data
              </td>
            </tr>
          ) : (
            visibleRows.map((row, rIdx) => (
              <tr
                key={row.id ?? rIdx}
                className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    {col.cell ? col.cell(row) : col.accessorKey ? row[col.accessorKey] : ''}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 mt-3">
        <div className="text-xs text-gray-500">
          Page {page} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 dark:text-gray-300">
            Page size
            <select
              className="ml-2 border rounded px-2 py-1 text-xs bg-white dark:bg-gray-900"
              value={pageSize}
              onChange={handleSizeChange}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button className="btn-outline btn-xs" onClick={handlePrev} disabled={page <= 1}>
              Prev
            </button>
            <button className="btn-outline btn-xs" onClick={handleNext} disabled={page >= pageCount}>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
