import React from 'react';

const StatsCard = ({ title, value, icon: Icon, trend, trendValue, color = '#00d4ff', subtitle }) => {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = `${color}66`;
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>{title}</span>
        {Icon && (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
        <span
          style={{
            fontSize: '1.85rem',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </span>
        {trendValue && (
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
          </span>
        )}
      </div>

      {subtitle && (
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          {subtitle}
        </span>
      )}

      {/* Decorative accent bottom line */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
        }}
      />
    </div>
  );
};

export default StatsCard;
