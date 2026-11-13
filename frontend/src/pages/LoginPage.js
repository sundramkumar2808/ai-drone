import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../layouts/AuthLayout';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Authentication failed. Please verify your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Enter your credentials to access the flight control dashboard"
    >
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
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}

      {/* Demo Quick Fill Helper */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: '10px',
          backgroundColor: 'rgba(0, 212, 255, 0.05)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.8rem',
        }}
      >
        <span style={{ color: '#94a3b8' }}>Demo Admin Login:</span>
        <button
          type="button"
          onClick={() => {
            setEmail('admin@dronefleet.ai');
            setPassword('AdminPassword123!');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#00d4ff',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          Auto-fill credentials
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Email */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              color: '#94a3b8',
              marginBottom: '6px',
              fontWeight: 500,
            }}
          >
            Email Address
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
              placeholder="pilot@dronefleet.ai"
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

        {/* Password */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              color: '#94a3b8',
              marginBottom: '6px',
              fontWeight: 500,
            }}
          >
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock
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
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 42px 11px 42px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                color: '#ffffff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot Password */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.825rem',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: '#00d4ff' }}
            />
            Remember me
          </label>

          <Link
            to="/forgot-password"
            style={{
              fontSize: '0.825rem',
              color: '#00d4ff',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(0, 212, 255, 0.35)',
            marginTop: '0.5rem',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            'Authenticating...'
          ) : (
            <>
              <LogIn size={18} /> Sign In
            </>
          )}
        </button>
      </form>

      {/* Footer link to sign up */}
      <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem', color: '#94a3b8' }}>
        Don't have an operator account?{' '}
        <Link
          to="/signup"
          style={{ color: '#00d4ff', fontWeight: 600, textDecoration: 'none' }}
        >
          Create Account
        </Link>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
