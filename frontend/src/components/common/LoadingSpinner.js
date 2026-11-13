import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  const dimensions = {
    small: 24,
    medium: 48,
    large: 64,
  }[size] || 48;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: dimensions,
          height: dimensions,
          borderRadius: '50%',
          border: '3px solid rgba(0, 212, 255, 0.15)',
          borderTopColor: '#00d4ff',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && (
        <span
          style={{
            color: '#94a3b8',
            fontSize: '0.875rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {text}
        </span>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
