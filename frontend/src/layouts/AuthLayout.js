import React from 'react';
import { Compass, ShieldCheck, Activity, Cpu } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#050816',
        color: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Left Hero Graphic Section */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'none',
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 30% 30%, #101c42 0%, #050816 75%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '3rem',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
        className="auth-hero-desktop"
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            }}
          >
            <Compass size={24} color="#ffffff" />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                background: 'linear-gradient(90deg, #ffffff 0%, #00d4ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Drone Fleet AI
            </span>
            <div style={{ fontSize: '0.7rem', color: '#64748b', letterSpacing: '0.06em' }}>
              AUTONOMOUS OPERATIONS
            </div>
          </div>
        </div>

        {/* Center illustration & pitch */}
        <div style={{ maxWidth: '480px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '99px',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              fontSize: '0.75rem',
              color: '#38bdf8',
              fontWeight: 600,
              marginBottom: '1.5rem',
            }}
          >
            <Cpu size={14} /> NEXT-GEN AI MISSION MANAGEMENT
          </div>

          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '1rem',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            Intelligent Fleet Command at Planetary Scale.
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Empower your commercial drone operations with real-time telemetry streaming, predictive
            maintenance alerts, and automated multi-drone mission coordination.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div
              style={{
                padding: '1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <Activity size={20} color="#00d4ff" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>99.98%</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Telemetry Uptime</div>
            </div>
            <div
              style={{
                padding: '1rem',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <ShieldCheck size={20} color="#10b981" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Zero-Trust</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Role-Based Access</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
          © 2026 Drone Fleet AI Technologies Inc. All rights reserved.
        </div>
      </div>

      {/* Right Form Container */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2.5rem 1.5rem',
          backgroundColor: '#050816',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {title && (
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: '1.85rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>{subtitle}</p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-hero-desktop {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
