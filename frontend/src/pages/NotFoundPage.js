import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#050816',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)',
        }}
      >
        <Compass size={40} color="#ffffff" />
      </div>

      <h1
        style={{
          fontSize: '4.5rem',
          fontWeight: 900,
          margin: 0,
          background: 'linear-gradient(90deg, #00d4ff 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.04em',
        }}
      >
        404
      </h1>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0.5rem 0 1rem' }}>
        Wayward Airspace / Route Not Found
      </h2>

      <p style={{ maxWidth: '440px', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
        The requested tactical flight coordinate or navigation page does not exist within the fleet sector.
      </p>

      <Link
        to="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
          color: '#ffffff',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 4px 20px rgba(0, 212, 255, 0.35)',
        }}
      >
        <ArrowLeft size={18} /> Return to Mission Control
      </Link>
    </div>
  );
};

export default NotFoundPage;
