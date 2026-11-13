import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  CheckCheck,
  Battery,
  WifiOff,
  Wrench,
  Navigation,
} from 'lucide-react';
import alertService from '../services/alertService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlertsData = async () => {
    setLoading(true);
    try {
      const [alRes, notifRes] = await Promise.allSettled([
        alertService.getAlerts({ severity: severityFilter || undefined, limit: 50 }),
        alertService.getNotifications(),
      ]);

      if (alRes.status === 'fulfilled') setAlerts(alRes.value.alerts || []);
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value || []);
    } catch (err) {
      console.error('Failed to load alert logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [severityFilter]);

  const handleMarkAlertRead = async (id) => {
    try {
      await alertService.markAlertRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'low_battery':
        return <Battery size={18} color="#ef4444" />;
      case 'drone_offline':
      case 'gps_lost':
        return <WifiOff size={18} color="#f59e0b" />;
      case 'maintenance_required':
        return <Wrench size={18} color="#00d4ff" />;
      default:
        return <AlertTriangle size={18} color="#f59e0b" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
          Alerts & Notification Center
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
          Real-time safety events, telemetry breaches, and automated operator alerts.
        </p>
      </div>

      {/* Severity Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { label: 'All Alerts', val: '' },
          { label: 'Critical', val: 'critical' },
          { label: 'Warning', val: 'warning' },
          { label: 'Info', val: 'info' },
        ].map((tab) => (
          <button
            key={tab.val}
            onClick={() => setSeverityFilter(tab.val)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border:
                severityFilter === tab.val
                  ? '1px solid #00d4ff'
                  : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor:
                severityFilter === tab.val
                  ? 'rgba(0, 212, 255, 0.12)'
                  : 'rgba(15, 23, 42, 0.6)',
              color: severityFilter === tab.val ? '#ffffff' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts Stream List */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {loading ? (
          <LoadingSpinner size="medium" text="Syncing event logs..." />
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            No active alerts recorded for the selected filter.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: alert.is_read
                  ? 'rgba(255, 255, 255, 0.02)'
                  : 'rgba(15, 23, 42, 0.8)',
                border: alert.is_read
                  ? '1px solid rgba(255, 255, 255, 0.05)'
                  : `1px solid ${
                      alert.severity === 'critical'
                        ? 'rgba(239, 68, 68, 0.4)'
                        : 'rgba(245, 158, 11, 0.4)'
                    }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor:
                      alert.severity === 'critical'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {getAlertIcon(alert.alert_type)}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      color: alert.is_read ? '#94a3b8' : '#ffffff',
                      fontWeight: alert.is_read ? 400 : 600,
                    }}
                  >
                    {alert.message}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
                    Type: <span style={{ color: '#00d4ff' }}>{alert.alert_type}</span> •{' '}
                    {new Date(alert.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge status={alert.severity} />
                {!alert.is_read && (
                  <button
                    onClick={() => handleMarkAlertRead(alert.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCircle size={14} /> Dismiss
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
