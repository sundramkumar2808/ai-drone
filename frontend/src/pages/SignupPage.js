import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../layouts/AuthLayout';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return 0;
    let strength = 0;
    if (p.length >= 8) strength += 25;
    if (/[A-Z]/.test(p)) strength += 25;
    if (/[a-z]/.test(p)) strength += 25;
    if (/[0-9]/.test(p)) strength += 25;
    return strength;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the terms of service and flight protocols.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Registration failed. Please ensure the email is unique and inputs are valid.'
      );
    } finally {
      setLoading(false);
    }
  };


  const strength = getPasswordStrength();

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Register as an authorized drone operator or fleet commander"
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
            marginBottom: '1.25rem',
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Full Name */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
            Full Name
          </label>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              name="full_name"
              required
              placeholder="Commander Jane Doe"
              value={formData.full_name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
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

        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
            Work Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="email"
              name="email"
              required
              placeholder="jane@dronefleet.ai"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
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

        {/* Phone */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
            Phone Number (Optional)
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="tel"
              name="phone"
              placeholder="+1-555-0199"
              value={formData.phone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
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
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 42px 10px 42px',
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
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password strength bar */}
          {formData.password && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ height: '4px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${strength}%`,
                    backgroundColor:
                      strength <= 25 ? '#ef4444' : strength <= 75 ? '#f59e0b' : '#10b981',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirm_password"
              required
              placeholder="••••••••••••"
              value={formData.confirm_password}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
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

        {/* Terms checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#94a3b8',
            cursor: 'pointer',
            lineHeight: 1.4,
          }}
        >
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            style={{ marginTop: '2px', accentColor: '#00d4ff' }}
          />
          <span>
            I agree to the <span style={{ color: '#00d4ff' }}>Terms & Autonomous Drone Flight Safety Protocols</span>.
          </span>
        </label>

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
          {loading ? 'Creating Account...' : (
            <>
              <UserPlus size={18} /> Create Account
            </>
          )}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#94a3b8' }}>
        Already registered?{' '}
        <Link to="/login" style={{ color: '#00d4ff', fontWeight: 600, textDecoration: 'none' }}>
          Sign In
        </Link>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
