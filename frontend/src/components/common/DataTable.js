import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const DataTable = ({
  columns,
  data = [],
  onRowClick,
  loading = false,
  emptyMessage = 'No records found',
}) => {
  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            {columns.map((col, index) => (
              <th
                key={index}
                style={{
                  padding: '1rem 1.25rem',
                  color: '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  width: col.width || 'auto',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '3rem 1rem' }}>
                <LoadingSpinner size="medium" text="Fetching records..." />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: '3rem 1rem',
                  textAlign: 'center',
                  color: '#64748b',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                style={{
                  borderBottom:
                    rowIndex === data.length - 1
                      ? 'none'
                      : '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: onRowClick ? 'pointer' : 'default',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      padding: '1rem 1.25rem',
                      color: '#e2e8f0',
                      verticalAlign: 'middle',
                    }}
                  >
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
