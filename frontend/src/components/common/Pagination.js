import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (totalPages <= 1) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1.25rem',
        padding: '0.5rem 0',
        fontSize: '0.85rem',
        color: '#94a3b8',
      }}
    >
      <span>
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{' '}
        {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            color: currentPage === 1 ? '#475569' : '#e2e8f0',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronLeft size={16} />
        </button>

        <span style={{ padding: '0 8px', fontWeight: 600, color: '#ffffff' }}>
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            color: currentPage >= totalPages ? '#475569' : '#e2e8f0',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
