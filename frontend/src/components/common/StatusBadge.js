import React from 'react';

const StatusBadge = ({ status, type = 'drone' }) => {
  const getBadgeStyle = () => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'active':
      case 'available':
      case 'completed':
      case 'connected':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          color: '#10b981',
          border: 'rgba(16, 185, 129, 0.3)',
          dot: '#10b981',
        };
      case 'in_flight':
      case 'in_progress':
      case 'scheduled':
        return {
          bg: 'rgba(0, 212, 255, 0.12)',
          color: '#00d4ff',
          border: 'rgba(0, 212, 255, 0.3)',
          dot: '#00d4ff',
        };
      case 'charging':
      case 'pending':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          color: '#f59e0b',
          border: 'rgba(245, 158, 11, 0.3)',
          dot: '#f59e0b',
        };
      case 'maintenance':
      case 'warning':
        return {
          bg: 'rgba(249, 115, 22, 0.12)',
          color: '#f97316',
          border: 'rgba(249, 115, 22, 0.3)',
          dot: '#f97316',
        };
      case 'offline':
      case 'failed':
      case 'cancelled':
      case 'critical':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          border: 'rgba(239, 68, 68, 0.3)',
          dot: '#ef4444',
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.12)',
          color: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.3)',
          dot: '#94a3b8',
        };
    }
  };

  const style = getBadgeStyle();
  const label = String(status || '').replace(/_/g, ' ').toUpperCase();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: style.dot,
        }}
      />
      {label}
    </span>
  );
};

export default StatusBadge;
