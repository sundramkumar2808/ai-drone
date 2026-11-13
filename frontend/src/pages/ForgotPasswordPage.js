import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import authService from '../services/authService';
import AuthLayout from '../layouts/AuthLayout';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setSubmitted(true);
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to generate password reset request. Please check email address.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your account email to receive security verification"
    >
      {submitted ? (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '14px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ margin: '0 0 0.5rem', color: '#ffffff', fontSize: '1.2rem' }}>
            Reset Link Dispatched
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.5 }}>
            A secure recovery verification has been generated for <strong>{email}</strong>.
          </p>

          {resetToken && (
            <div style={{ marginTop: '1.25rem', padding: '10px', backgroundColor: 'rgba(0, 212, 255, 0.08)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: '#00d4ff', marginBottom: '6px' }}>
                DIRECT PASSWORD RESET ACCESS:
              </div>
              <Link
                to={`/reset-password?token=${resetToken}`}
                style={{
                  display: 'inline-block',
                  color: '#ffffff',
                  backgroundColor: '#0284c7',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Proceed to Reset Password
              </Link>
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <Link
              to="/login"
              style={{
                color: '#00d4ff',
                textDecoration: 'none',
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeft size={16} /> Return to Login
            </Link>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>
                Registered Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder="admin@dronefleet.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 42px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(0, 212, 255, 0.35)',
              }}
            >
              {loading ? 'Generating...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link
                to="/login"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
