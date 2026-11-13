import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

const SearchFilter = ({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  onFilterChange,
  onReset,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* Search input */}
      <div
        style={{
          position: 'relative',
          flex: '1 1 240px',
          minWidth: '220px',
        }}
      >
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b',
          }}
        />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px 9px 38px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            color: '#ffffff',
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Dynamic select filters */}
      {filters.map((f, idx) => (
        <select
          key={idx}
          value={f.value}
          onChange={(e) => onFilterChange && onFilterChange(f.name, e.target.value)}
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            color: '#e2e8f0',
            fontSize: '0.875rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">{f.label}</option>
          {f.options.map((opt, oIdx) => (
            <option key={oIdx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {/* Reset button */}
      {onReset && (
        <button
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          <RotateCcw size={14} /> Reset
        </button>
      )}
    </div>
  );
};

export default SearchFilter;
