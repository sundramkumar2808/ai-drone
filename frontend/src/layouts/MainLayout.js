import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Plane,
  Target,
  Radio,
  Wrench,
  BarChart3,
  Bell,
  Shield,
  LogOut,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AIChatbot from '../components/ai/AIChatbot';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Fleet Drones', path: '/drones', icon: Plane },
    { name: 'Missions', path: '/missions', icon: Target },
    { name: 'Live Telemetry', path: '/telemetry', icon: Radio },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    { name: 'Alerts', path: '/alerts', icon: Bell },
  ];

  // Admin section only visible to admin role
  if (user?.role === 'admin') {
    navItems.push({ name: 'Admin Control', path: '/admin', icon: Shield });
  }

  const currentNavItem = navItems.find((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#050816',
        color: '#ffffff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? '250px' : '74px',
          transition: 'width 0.25s ease',
          backgroundColor: '#070b1a',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarOpen ? 'space-between' : 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/dashboard')}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(0, 212, 255, 0.35)',
              }}
            >
              <Compass size={22} color="#ffffff" />
            </div>
            {sidebarOpen && (
              <div>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(90deg, #ffffff 0%, #00d4ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Drone Fleet AI
                </span>
                <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.05em' }}>
                  MISSION CONTROL
                </div>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Toggle open when collapsed */}
        {!sidebarOpen && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        {/* Navigation list */}
        <nav
          style={{
            flex: 1,
            padding: '1rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            overflowY: 'auto',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarOpen ? '10px 14px' : '10px 0',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  color: isActive ? '#00d4ff' : '#94a3b8',
                  backgroundColor: isActive ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(0, 212, 255, 0.25)'
                    : '1px solid transparent',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div
          style={{
            padding: '1rem 0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {sidebarOpen ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00d4ff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    flexShrink: 0,
                  }}
                >
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#ffffff',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {user?.full_name || 'Operator'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#00d4ff',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {user?.role || 'Viewer'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                padding: '8px 0',
              }}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? '250px' : '74px',
          transition: 'margin-left 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Top Header */}
        <header
          style={{
            height: '64px',
            backgroundColor: 'rgba(7, 11, 26, 0.75)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 90,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              {currentNavItem?.name || 'Mission Control'}
            </h2>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 9px',
                borderRadius: '99px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.7rem',
                color: '#10b981',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                }}
              />
              SYSTEM OPERATIONAL
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Quick alert icon button */}
            <button
              onClick={() => navigate('/alerts')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
                position: 'relative',
              }}
              title="Notifications"
            >
              <Bell size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#00d4ff',
                  boxShadow: '0 0 6px #00d4ff',
                }}
              />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '2rem' }}>{children}</main>

        {/* Global Floating AI Chatbot */}
        <AIChatbot />
      </div>
    </div>
  );
};

export default MainLayout;
