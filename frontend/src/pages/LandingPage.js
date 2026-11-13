import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plane, Brain, Radio, Wrench, BarChart3, Bell, Menu, X,
  ChevronRight, ArrowRight, Shield, Zap, Globe, Users,
  Mail, Phone, MapPin, Github, Twitter, Linkedin, Facebook,
  CheckCircle, Star, Send, Database, Server, Cpu, Bot
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [counters, setCounters] = useState({ drones: 0, hours: 0, rate: 0, missions: 0 });
  const [countersStarted, setCountersStarted] = useState(false);
  const statsRef = useRef(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !countersStarted) {
          setCountersStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, [countersStarted]);

  useEffect(() => {
    if (!countersStarted) return;
    const targets = { drones: 24, hours: 1200, rate: 91, missions: 156 };
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounters({
        drones: Math.round(targets.drones * eased),
        hours: Math.round(targets.hours * eased),
        rate: Math.round(targets.rate * eased),
        missions: Math.round(targets.missions * eased),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [countersStarted]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => setContactSubmitted(false), 3000);
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  const keyframesStyle = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-15px) rotate(2deg); }
      66% { transform: translateY(-8px) rotate(-1deg); }
    }
    @keyframes particle {
      0% { transform: translateY(0) translateX(0); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes gridMove {
      0% { background-position: 0 0; }
      100% { background-position: 50px 50px; }
    }
    @keyframes droneFloat {
      0%, 100% { transform: translateY(0) translateX(0) rotate(-5deg); }
      25% { transform: translateY(-20px) translateX(10px) rotate(0deg); }
      50% { transform: translateY(-10px) translateX(20px) rotate(5deg); }
      75% { transform: translateY(-25px) translateX(5px) rotate(0deg); }
    }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
      50% { box-shadow: 0 0 40px rgba(0, 212, 255, 0.6); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 8,
    duration: Math.random() * 10 + 8,
    opacity: Math.random() * 0.5 + 0.2,
  }));

  const features = [
    { icon: Plane, title: 'Drone Fleet Management', description: 'Centralized control for your entire drone fleet with real-time status monitoring, asset tracking, and lifecycle management.' },
    { icon: Brain, title: 'AI-Powered Mission Planning', description: 'Leverage Google Gemini AI to intelligently plan missions, optimize routes, and predict outcomes with natural language interaction.' },
    { icon: Radio, title: 'Real-Time Telemetry', description: 'Live WebSocket streaming of drone telemetry including altitude, speed, battery, GPS coordinates, and environmental data.' },
    { icon: Wrench, title: 'Predictive Maintenance', description: 'AI-driven maintenance scheduling that predicts component failures before they happen, reducing downtime by up to 40%.' },
    { icon: BarChart3, title: 'Flight Analytics', description: 'Comprehensive analytics dashboards with mission statistics, fleet performance metrics, and exportable reports.' },
    { icon: Bell, title: 'Intelligent Alerts', description: 'Smart alerting system with severity-based notifications for battery levels, geofence breaches, and system anomalies.' },
  ];

  const steps = [
    { num: '01', title: 'Register', desc: 'Create your account and set up your organization profile.' },
    { num: '02', title: 'Add Drones', desc: 'Register your drone fleet with specifications and configurations.' },
    { num: '03', title: 'Plan Missions', desc: 'Use AI to plan optimal flight paths and mission parameters.' },
    { num: '04', title: 'Monitor & Analyze', desc: 'Track operations in real-time and analyze performance data.' },
  ];

  const techStack = [
    { name: 'React', color: '#61dafb', icon: '⚛️' },
    { name: 'FastAPI', color: '#009688', icon: '⚡' },
    { name: 'PostgreSQL', color: '#336791', icon: '🐘' },
    { name: 'Redis', color: '#dc382d', icon: '🔴' },
    { name: 'Docker', color: '#2496ed', icon: '🐳' },
    { name: 'Gemini AI', color: '#8b5cf6', icon: '🤖' },
  ];

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
    padding: scrolled ? '10px 0' : '16px 0',
    background: scrolled ? 'rgba(10, 14, 39, 0.95)' : 'transparent',
    backdropFilter: scrolled ? 'blur(20px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
    transition: 'all 0.3s ease',
  };

  const glassCard = {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #050816 0%, #0a0e27 50%, #050816 100%)', color: '#fff', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{keyframesStyle}</style>

      {/* Navbar */}
      <nav style={navStyle}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#fff' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #00d4ff, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plane size={22} color="#fff" />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>Drone Fleet <span style={{ color: '#00d4ff' }}>AI</span></span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="desktop-nav">
            {['Home', 'Features', 'Solutions', 'About', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#94a3b8'}>
                {item}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.2s' }}
              onMouseOver={e => { e.target.style.borderColor = '#00d4ff'; e.target.style.color = '#00d4ff'; }}
              onMouseOut={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.color = '#fff'; }}>
              Login
            </button>
            <button onClick={() => navigate('/signup')} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #00d4ff, #3b82f6)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'transform 0.2s' }}
              onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={e => e.target.style.transform = 'scale(1)'}>
              Get Started
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ display: 'none', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }} className="mobile-menu-btn">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, ...glassCard, borderRadius: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {['Home', 'Features', 'Solutions', 'About', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '16px', fontWeight: 500, padding: '8px 0' }}>
                {item}
              </a>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => navigate('/login')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>Login</button>
              <button onClick={() => navigate('/signup')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #00d4ff, #3b82f6)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: '80px' }}>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05,
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px', animation: 'gridMove 20s linear infinite',
        }} />

        {/* Particles */}
        {particles.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: p.left, bottom: '-20px', width: p.size, height: p.size,
            borderRadius: '50%', background: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#3b82f6' : '#8b5cf6',
            opacity: p.opacity, animation: `particle ${p.duration}s ${p.delay}s linear infinite`,
          }} />
        ))}

        {/* Radial glow */}
        <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-200px', left: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ animation: 'fadeInUp 0.8s ease forwards' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', ...glassCard, marginBottom: '24px', fontSize: '13px', color: '#00d4ff' }}>
              <Zap size={14} /> AI-Powered Platform
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-2px' }}>
              Intelligent{' '}
              <span style={{ background: 'linear-gradient(135deg, #00d4ff, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Drone Fleet
              </span>{' '}
              Management
            </h1>
            <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '36px', maxWidth: '520px' }}>
              Harness the power of artificial intelligence to manage, monitor, and optimize your drone operations. Real-time telemetry, predictive maintenance, and intelligent mission planning — all in one platform.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/signup')} style={{
                padding: '14px 32px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #00d4ff, #3b82f6)', color: '#fff',
                fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.3s', boxShadow: '0 0 30px rgba(0,212,255,0.3)',
              }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                Get Started <ArrowRight size={18} />
              </button>
              <button onClick={() => { const el = document.getElementById('features'); el && el.scrollIntoView({ behavior: 'smooth' }); }} style={{
                padding: '14px 32px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)', color: '#fff',
                fontSize: '16px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.3s', backdropFilter: 'blur(10px)',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = '#00d4ff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Explore Features
              </button>
            </div>
          </div>

          {/* Drone Illustration */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeInUp 0.8s 0.3s ease forwards', opacity: 0, animationFillMode: 'forwards' }}>
            <div style={{ position: 'relative', width: '400px', height: '400px' }}>
              <div style={{ position: 'absolute', inset: '20px', borderRadius: '50%', border: '1px solid rgba(0,212,255,0.2)', animation: 'pulse 4s ease infinite' }} />
              <div style={{ position: 'absolute', inset: '60px', borderRadius: '50%', border: '1px solid rgba(59,130,246,0.2)', animation: 'pulse 4s 1s ease infinite' }} />
              <div style={{ position: 'absolute', inset: '100px', borderRadius: '50%', border: '1px solid rgba(139,92,246,0.2)', animation: 'pulse 4s 2s ease infinite' }} />
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                animation: 'droneFloat 6s ease-in-out infinite',
              }}>
                <svg width="180" height="120" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Drone body */}
                  <ellipse cx="90" cy="65" rx="30" ry="15" fill="url(#bodyGrad)" />
                  {/* Arms */}
                  <line x1="60" y1="55" x2="20" y2="35" stroke="#00d4ff" strokeWidth="3" />
                  <line x1="120" y1="55" x2="160" y2="35" stroke="#00d4ff" strokeWidth="3" />
                  <line x1="65" y1="70" x2="25" y2="85" stroke="#3b82f6" strokeWidth="3" />
                  <line x1="115" y1="70" x2="155" y2="85" stroke="#3b82f6" strokeWidth="3" />
                  {/* Propellers */}
                  <ellipse cx="20" cy="35" rx="18" ry="4" fill="rgba(0,212,255,0.4)" style={{ animation: 'spin 0.3s linear infinite' }} />
                  <ellipse cx="160" cy="35" rx="18" ry="4" fill="rgba(0,212,255,0.4)" style={{ animation: 'spin 0.3s linear infinite' }} />
                  <ellipse cx="25" cy="85" rx="18" ry="4" fill="rgba(59,130,246,0.4)" style={{ animation: 'spin 0.3s linear infinite' }} />
                  <ellipse cx="155" cy="85" rx="18" ry="4" fill="rgba(59,130,246,0.4)" style={{ animation: 'spin 0.3s linear infinite' }} />
                  {/* Motors */}
                  <circle cx="20" cy="35" r="5" fill="#00d4ff" />
                  <circle cx="160" cy="35" r="5" fill="#00d4ff" />
                  <circle cx="25" cy="85" r="5" fill="#3b82f6" />
                  <circle cx="155" cy="85" r="5" fill="#3b82f6" />
                  {/* Camera */}
                  <circle cx="90" cy="80" r="6" fill="#8b5cf6" />
                  <circle cx="90" cy="80" r="3" fill="#fff" opacity="0.5" />
                  {/* LED */}
                  <circle cx="90" cy="52" r="3" fill="#00ff88" style={{ animation: 'pulse 2s ease infinite' }} />
                  <defs>
                    <linearGradient id="bodyGrad" x1="60" y1="50" x2="120" y2="80">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              {/* Glow effect under drone */}
              <div style={{ position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '40px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,212,255,0.3) 0%, transparent 70%)', filter: 'blur(10px)', animation: 'pulse 3s ease infinite' }} />
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'float 3s ease infinite' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: '2px', height: '30px', background: 'linear-gradient(to bottom, #00d4ff, transparent)', borderRadius: '2px' }} />
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} style={{ padding: '80px 24px', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {[
            { value: `${counters.drones}+`, label: 'Active Drones', icon: Plane, color: '#00d4ff' },
            { value: `${counters.hours >= 1000 ? (counters.hours / 1000).toFixed(1) + 'K' : counters.hours}+`, label: 'Flight Hours', icon: Globe, color: '#3b82f6' },
            { value: `${counters.rate}%`, label: 'Mission Success Rate', icon: CheckCircle, color: '#10b981' },
            { value: `${counters.missions}+`, label: 'Daily Missions', icon: Zap, color: '#8b5cf6' },
          ].map((stat, i) => (
            <div key={i} style={{ ...glassCard, padding: '32px 24px', textAlign: 'center', transition: 'all 0.3s', animation: `fadeInUp 0.6s ${i * 0.15}s ease forwards`, opacity: 0, animationFillMode: 'forwards' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = stat.color; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
              <stat.icon size={32} color={stat.color} style={{ marginBottom: '16px' }} />
              <div style={{ fontSize: '40px', fontWeight: 800, color: stat.color, marginBottom: '8px', fontFamily: 'monospace' }}>{stat.value}</div>
              <div style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '100px 24px', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', ...glassCard, marginBottom: '16px', fontSize: '13px', color: '#00d4ff', fontWeight: 600 }}>FEATURES</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>
              Everything You Need to{' '}
              <span style={{ background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Manage Your Fleet
              </span>
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7 }}>
              A comprehensive suite of tools designed for modern drone operations, powered by cutting-edge AI technology.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {features.map((feature, i) => (
              <div key={i} style={{ ...glassCard, padding: '32px', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${['#00d4ff', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i]}22, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: `1px solid ${['#00d4ff', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i]}33` }}>
                  <feature.icon size={26} color={['#00d4ff', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][i]} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>{feature.title}</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="solutions" style={{ padding: '100px 24px', position: 'relative' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', ...glassCard, marginBottom: '16px', fontSize: '13px', color: '#3b82f6', fontWeight: 600 }}>HOW IT WORKS</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px' }}>
              Get Started in{' '}
              <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>4 Simple Steps</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', position: 'relative' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', top: '50px', left: '12.5%', right: '12.5%', height: '2px', background: 'linear-gradient(90deg, #00d4ff, #3b82f6, #8b5cf6, #10b981)', zIndex: 0, opacity: 0.3 }} />

            {steps.map((step, i) => (
              <div key={i} style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 24px',
                  background: `linear-gradient(135deg, ${['#00d4ff', '#3b82f6', '#8b5cf6', '#10b981'][i]}33, transparent)`,
                  border: `2px solid ${['#00d4ff', '#3b82f6', '#8b5cf6', '#10b981'][i]}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: 800, color: ['#00d4ff', '#3b82f6', '#8b5cf6', '#10b981'][i],
                  boxShadow: `0 0 30px ${['#00d4ff', '#3b82f6', '#8b5cf6', '#10b981'][i]}33`,
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', ...glassCard, marginBottom: '16px', fontSize: '13px', color: '#8b5cf6', fontWeight: 600 }}>TECH STACK</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px' }}>
              Built with{' '}
              <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Modern Technology</span>
            </h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
            {techStack.map((tech, i) => (
              <div key={i} style={{ ...glassCard, padding: '24px 32px', textAlign: 'center', transition: 'all 0.3s', minWidth: '140px' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = tech.color; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{tech.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: tech.color }}>{tech.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', ...glassCard, marginBottom: '16px', fontSize: '13px', color: '#00d4ff', fontWeight: 600 }}>ABOUT US</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, marginBottom: '20px', letterSpacing: '-1px' }}>
              Pioneering the Future of{' '}
              <span style={{ background: 'linear-gradient(135deg, #00d4ff, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Autonomous Flight</span>
            </h2>
            <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: 1.8, marginBottom: '24px' }}>
              Drone Fleet AI was founded with a singular vision: to make drone fleet operations as intuitive and intelligent as possible. Our platform combines cutting-edge artificial intelligence with robust fleet management tools, enabling organizations to scale their aerial operations with confidence.
            </p>
            <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: 1.8, marginBottom: '32px' }}>
              From logistics and agriculture to infrastructure inspection and emergency response, we're empowering industries worldwide to leverage the full potential of drone technology.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              {[
                { val: '50+', label: 'Enterprise Clients' },
                { val: '99.9%', label: 'Platform Uptime' },
                { val: '24/7', label: 'Support Available' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#00d4ff', marginBottom: '4px' }}>{s.val}</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ ...glassCard, padding: '48px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
              <Shield size={64} color="#00d4ff" style={{ marginBottom: '24px' }} />
              <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>Enterprise Grade Security</h3>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, marginBottom: '24px' }}>End-to-end encryption, role-based access control, and SOC 2 compliance. Your fleet data is always secure.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                {['256-bit AES Encryption', 'Multi-Factor Authentication', 'Role-Based Access Control', 'Audit Logging'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#94a3b8' }}>
                    <CheckCircle size={16} color="#10b981" /> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', ...glassCard, marginBottom: '16px', fontSize: '13px', color: '#3b82f6', fontWeight: 600 }}>CONTACT</span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px' }}>
              Get in{' '}
              <span style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Touch</span>
            </h2>
          </div>

          <div style={{ ...glassCard, padding: '40px' }}>
            {contactSubmitted ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={64} color="#10b981" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Message Sent!</h3>
                <p style={{ color: '#94a3b8' }}>We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>Name</label>
                    <input type="text" required value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="John Doe" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>Email</label>
                    <input type="email" required value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                      placeholder="john@example.com" />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>Subject</label>
                  <input type="text" required value={contactForm.subject} onChange={e => setContactForm(p => ({ ...p, subject: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="How can we help?" />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px', fontWeight: 500 }}>Message</label>
                  <textarea required rows={5} value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    placeholder="Tell us about your project..." />
                </div>
                <button type="submit" style={{
                  width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #00d4ff, #3b82f6)', color: '#fff',
                  fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.3s',
                }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <Send size={18} /> Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '60px 24px 30px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #00d4ff, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plane size={18} color="#fff" />
                </div>
                <span style={{ fontSize: '18px', fontWeight: 700 }}>Drone Fleet <span style={{ color: '#00d4ff' }}>AI</span></span>
              </div>
              <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '300px', marginBottom: '20px' }}>
                The next generation of drone fleet management powered by artificial intelligence.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[Twitter, Github, Linkedin, Facebook].map((Icon, i) => (
                  <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: '10px', ...glassCard, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.borderColor = '#00d4ff'; }}
                    onMouseOut={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>Product</h4>
              {['Features', 'Pricing', 'Documentation', 'API Reference', 'Changelog'].map((item, i) => (
                <a key={i} href="#" style={{ display: 'block', fontSize: '13px', color: '#94a3b8', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#94a3b8'}>
                  {item}
                </a>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>Company</h4>
              {['About Us', 'Blog', 'Careers', 'Partners', 'Contact'].map((item, i) => (
                <a key={i} href="#" style={{ display: 'block', fontSize: '13px', color: '#94a3b8', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#94a3b8'}>
                  {item}
                </a>
              ))}
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: '#fff' }}>Legal</h4>
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Security'].map((item, i) => (
                <a key={i} href="#" style={{ display: 'block', fontSize: '13px', color: '#94a3b8', textDecoration: 'none', marginBottom: '10px', transition: 'color 0.2s' }}
                  onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#94a3b8'}>
                  {item}
                </a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#64748b' }}>© 2024 Drone Fleet AI. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#64748b' }}>
              <Mail size={14} /> support@dronefleetai.com
            </div>
          </div>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (max-width: 768px) {
          section > div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          section > div > div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: 1fr !important;
          }
          section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          footer > div > div[style*="grid-template-columns: 2fr"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
