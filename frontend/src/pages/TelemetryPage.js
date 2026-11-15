import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Battery,
  Gauge,
  Navigation,
  Thermometer,
  Wifi,
  Signal,
  MapPin,
  RefreshCw,
  Eye,
  Plane,
  CheckCircle,
  Wrench,
  PowerOff,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useWebSocket } from '../hooks/useWebSocket';
import telemetryService, { getWsUrl } from '../services/telemetryService';
import droneService from '../services/droneService';
import StatusBadge from '../components/common/StatusBadge';

const TelemetryPage = () => {
  const navigate = useNavigate();
  const wsEndpoint = `${getWsUrl()}/ws/telemetry`;
  const { data: wsData, isConnected } = useWebSocket(wsEndpoint);

  const [dronesTelemetry, setDronesTelemetry] = useState([]);
  const [selectedDroneId, setSelectedDroneId] = useState(null);
  const [history, setHistory] = useState([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  // Fetch initial telemetry via REST & fallback periodic polling
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const data = await telemetryService.getTelemetry();
        if (data && data.length > 0 && isMounted) {
          setDronesTelemetry(data);
          if (!selectedDroneId) {
            setSelectedDroneId(data[0].drone_id);
          }
        }
      } catch (err) {
        console.error('Initial telemetry fetch failed:', err);
      }
    };
    fetchInitial();

    // Fallback polling if WebSocket is connecting or in serverless environment
    let pollInterval = null;
    if (!isConnected) {
      pollInterval = setInterval(fetchInitial, 2500);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isConnected, selectedDroneId]);

  // Update telemetry on incoming WebSocket messages
  useEffect(() => {
    if (wsData && wsData.type === 'telemetry' && Array.isArray(wsData.data)) {
      setDronesTelemetry(wsData.data);
      if (!selectedDroneId && wsData.data.length > 0) {
        setSelectedDroneId(wsData.data[0].drone_id);
      }
    }
  }, [wsData, selectedDroneId]);

  // Keep oscilloscope history updated whenever active drone telemetry updates
  useEffect(() => {
    const raw =
      dronesTelemetry.find((d) => d.drone_id === selectedDroneId) ||
      dronesTelemetry[0];
    if (raw) {
      const flying = raw.status === 'in_flight' || raw.status === 'active';
      const alt = flying
        ? (Number(raw.altitude) > 0 ? Number(raw.altitude) : 124.5)
        : 0;
      const spd = flying
        ? (Number(raw.speed) > 0 ? Number(raw.speed) : 14.2)
        : 0;

      setHistory((prev) => {
        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          altitude: alt,
          speed: spd,
          battery: Number(raw.battery_level || 90),
        };
        const slice = prev.length >= 20 ? prev.slice(1) : prev;
        return [...slice, newPoint];
      });
    }
  }, [dronesTelemetry, selectedDroneId]);

  const rawActiveDrone =
    dronesTelemetry.find((d) => d.drone_id === selectedDroneId) ||
    dronesTelemetry[0] || {
      drone_name: 'Falcon-X1',
      status: 'in_flight',
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 124.5,
      speed: 14.2,
      battery_level: 83.4,
      temperature: 28.5,
      gps_signal: 98.0,
      connection_status: 'connected',
    };

  const isFlying =
    rawActiveDrone.status === 'in_flight' || rawActiveDrone.status === 'active';
  const displayAltitude = isFlying
    ? (Number(rawActiveDrone.altitude) > 0 ? Number(rawActiveDrone.altitude) : 124.5)
    : 0;
  const displaySpeed = isFlying
    ? (Number(rawActiveDrone.speed) > 0 ? Number(rawActiveDrone.speed) : 14.2)
    : 0;

  const activeDrone = {
    ...rawActiveDrone,
    altitude: displayAltitude,
    speed: displaySpeed,
  };

  const handleQuickStatusChange = async (newStatus) => {
    if (!activeDrone || !activeDrone.drone_id) return;
    setUpdatingStatus(true);
    setStatusFeedback(`Updating ${activeDrone.drone_name} to ${newStatus.replace('_', ' ').toUpperCase()}...`);
    try {
      // 1. Immediately update local telemetry state for instant responsiveness
      setDronesTelemetry((prev) =>
        prev.map((d) =>
          d.drone_id === activeDrone.drone_id
            ? {
                ...d,
                status: newStatus,
                altitude:
                  newStatus === 'in_flight' || newStatus === 'active'
                    ? (Number(d.altitude) > 0 ? d.altitude : 124.5)
                    : 0,
                speed:
                  newStatus === 'in_flight' || newStatus === 'active'
                    ? (Number(d.speed) > 0 ? d.speed : 14.2)
                    : 0,
              }
            : d
        )
      );

      // 2. Persist to MongoDB backend (synchronizes with Drone Fleet Management)
      await droneService.updateDrone(activeDrone.drone_id, { status: newStatus });
      setStatusFeedback(`Status synchronized with Fleet Management!`);
      setTimeout(() => setStatusFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to update drone status from telemetry:', err);
      setStatusFeedback(null);
      alert(err.response?.data?.detail || 'Failed to update drone status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
              Live Fleet Telemetry Stream
            </h1>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                letterSpacing: '0.04em',
              }}
            >
              SIMULATED TELEMETRY DATA
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            High-frequency avionics telemetry via WebSocket stream (2-second refresh rate).
          </p>
        </div>

        {/* WebSocket Connection Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            fontSize: '0.8rem',
            color: isConnected ? '#10b981' : '#f59e0b',
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#f59e0b',
              boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
            }}
          />
          {isConnected ? 'WEBSOCKET STREAM ACTIVE' : 'CONNECTING WS...'}
        </div>
      </div>

      {/* Airframe Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}
      >
        {dronesTelemetry.map((d) => {
          const isSelected = d.drone_id === activeDrone.drone_id;
          const isDroneFlying = d.status === 'in_flight' || d.status === 'active';
          return (
            <button
              key={d.drone_id}
              onClick={() => setSelectedDroneId(d.drone_id)}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: isSelected
                  ? '1px solid #00d4ff'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: isSelected
                  ? 'rgba(0, 212, 255, 0.12)'
                  : 'rgba(15, 23, 42, 0.6)',
                color: isSelected ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                fontWeight: isSelected ? 600 : 500,
                fontSize: '0.85rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Radio size={16} color={isSelected ? '#00d4ff' : '#64748b'} />
              <span>{d.drone_name}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  backgroundColor: isDroneFlying
                    ? 'rgba(0, 212, 255, 0.2)'
                    : d.status === 'maintenance'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : d.status === 'offline'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
                  color: isDroneFlying
                    ? '#00d4ff'
                    : d.status === 'maintenance'
                    ? '#f59e0b'
                    : d.status === 'offline'
                    ? '#ef4444'
                    : '#10b981',
                }}
              >
                {isDroneFlying ? 'IN FLIGHT' : (d.status || 'AVAILABLE').replace('_', ' ')}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: d.battery_level > 20 ? '#10b981' : '#ef4444',
                  fontWeight: 700,
                }}
              >
                {d.battery_level}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Drone Command & Quick Status Control Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
          borderRadius: '14px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(0, 212, 255, 0.25)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: isFlying ? 'rgba(0, 212, 255, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              border: `1px solid ${isFlying ? 'rgba(0, 212, 255, 0.4)' : 'rgba(100, 116, 139, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={22} color={isFlying ? '#00d4ff' : '#94a3b8'} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                {activeDrone.drone_name}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                  backgroundColor: isFlying
                    ? 'rgba(0, 212, 255, 0.2)'
                    : activeDrone.status === 'maintenance'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : activeDrone.status === 'offline'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
                  color: isFlying
                    ? '#00d4ff'
                    : activeDrone.status === 'maintenance'
                    ? '#f59e0b'
                    : activeDrone.status === 'offline'
                    ? '#ef4444'
                    : '#10b981',
                  border: `1px solid ${
                    isFlying
                      ? 'rgba(0, 212, 255, 0.4)'
                      : activeDrone.status === 'maintenance'
                      ? 'rgba(245, 158, 11, 0.4)'
                      : activeDrone.status === 'offline'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : 'rgba(16, 185, 129, 0.4)'
                  }`,
                }}
              >
                {isFlying ? 'IN FLIGHT' : (activeDrone.status || 'AVAILABLE').replace('_', ' ')}
              </span>
              {statusFeedback && (
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                  ✓ {statusFeedback}
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Live Telemetry Control • Status changes sync with Fleet Management in real-time
            </p>
          </div>
        </div>

        {/* Quick Status Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, marginRight: '4px' }}>
            CHANGE STATUS:
          </span>

          <button
            onClick={() => handleQuickStatusChange('in_flight')}
            disabled={updatingStatus || activeDrone.status === 'in_flight'}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: activeDrone.status === 'in_flight' ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: activeDrone.status === 'in_flight' ? 'rgba(0, 212, 255, 0.25)' : 'rgba(15, 23, 42, 0.8)',
              color: activeDrone.status === 'in_flight' ? '#00d4ff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: updatingStatus ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Plane size={14} /> IN FLIGHT
          </button>

          <button
            onClick={() => handleQuickStatusChange('available')}
            disabled={updatingStatus || activeDrone.status === 'available'}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: activeDrone.status === 'available' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: activeDrone.status === 'available' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(15, 23, 42, 0.8)',
              color: activeDrone.status === 'available' ? '#10b981' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: updatingStatus ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckCircle size={14} /> AVAILABLE
          </button>

          <button
            onClick={() => handleQuickStatusChange('maintenance')}
            disabled={updatingStatus || activeDrone.status === 'maintenance'}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: activeDrone.status === 'maintenance' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: activeDrone.status === 'maintenance' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.8)',
              color: activeDrone.status === 'maintenance' ? '#f59e0b' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: updatingStatus ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Wrench size={14} /> MAINTENANCE
          </button>

          <button
            onClick={() => handleQuickStatusChange('offline')}
            disabled={updatingStatus || activeDrone.status === 'offline'}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              border: activeDrone.status === 'offline' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: activeDrone.status === 'offline' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.8)',
              color: activeDrone.status === 'offline' ? '#ef4444' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: updatingStatus ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <PowerOff size={14} /> OFFLINE
          </button>

          <button
            onClick={() => navigate('/drones')}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginLeft: '4px',
            }}
            title="Open in Drone Fleet Management"
          >
            Fleet <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Real-time Avionics Gauges Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <div style={gaugeCardStyle}>
          <div style={gaugeHeaderStyle}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ALTITUDE</span>
            <Navigation size={18} color="#00d4ff" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
            {activeDrone.altitude} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>m</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: isFlying ? '#10b981' : '#64748b' }}>
            {isFlying ? 'MSL Airborne Clearance' : 'Grounded on Base Pad (0 m)'}
          </span>
        </div>

        <div style={gaugeCardStyle}>
          <div style={gaugeHeaderStyle}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>GROUND SPEED</span>
            <Gauge size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
            {activeDrone.speed} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>m/s</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: isFlying ? '#38bdf8' : '#64748b' }}>
            {isFlying
              ? `${((activeDrone.speed || 0) * 3.6).toFixed(1)} km/h • Airborne Vector`
              : '0.0 km/h (Stationary)'}
          </span>
        </div>

        <div style={gaugeCardStyle}>
          <div style={gaugeHeaderStyle}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>BATTERY CHARGE</span>
            <Battery size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
            {activeDrone.battery_level} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>%</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>LiPo 6S Smart Pack</span>
        </div>

        <div style={gaugeCardStyle}>
          <div style={gaugeHeaderStyle}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ESC TEMPERATURE</span>
            <Thermometer size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
            {activeDrone.temperature} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>°C</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Optimal thermal window</span>
        </div>

        <div style={gaugeCardStyle}>
          <div style={gaugeHeaderStyle}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>GNSS SIGNAL</span>
            <Signal size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
            {activeDrone.gps_signal} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>%</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#8b5cf6' }}>14 Satellite Locks</span>
        </div>

        <div style={gaugeCardStyle}>
          <div style={gaugeHeaderStyle}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>DOWNLINK STATUS</span>
            <Wifi size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
            {activeDrone.connection_status || 'CONNECTED'}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Latency: 24 ms</span>
        </div>
      </div>

      {/* Visual Simulated Flight Radar Map */}
      <div
        style={{
          background: 'radial-gradient(circle at 50% 50%, #0d1e3d 0%, #060a1a 80%)',
          border: '1px solid rgba(0, 212, 255, 0.25)',
          borderRadius: '16px',
          padding: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
              Tactical Airspace Radar & Geofence
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Lat: {activeDrone.latitude?.toFixed(6)} | Lng: {activeDrone.longitude?.toFixed(6)}
            </p>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#00d4ff', fontFamily: 'monospace' }}>
            REFRESH: 2000MS
          </div>
        </div>

        {/* Radar Ring Visuals */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            border: '1px dashed rgba(0, 212, 255, 0.25)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            pointerEvents: 'none',
          }}
        />

        {/* Center Base Station */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 10px #ffffff',
          }}
        />

        {/* Dynamic Drone Marker on Radar */}
        <div
          style={{
            position: 'absolute',
            top: isFlying ? '42%' : '50%',
            left: isFlying ? '56%' : '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            transition: 'all 1s ease',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: isFlying ? 'rgba(0, 212, 255, 0.25)' : 'rgba(100, 116, 139, 0.25)',
              border: `2px solid ${isFlying ? '#00d4ff' : '#64748b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isFlying ? '0 0 20px #00d4ff' : 'none',
              animation: isFlying ? 'pulse 2s infinite' : 'none',
            }}
          >
            <Radio size={16} color="#ffffff" />
          </div>
          <div
            style={{
              marginTop: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              border: `1px solid ${isFlying ? 'rgba(0, 212, 255, 0.3)' : 'rgba(100, 116, 139, 0.3)'}`,
              fontSize: '0.75rem',
              color: isFlying ? '#00d4ff' : '#94a3b8',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {activeDrone.drone_name} ({isFlying ? `${activeDrone.altitude}m • ${activeDrone.speed}m/s` : 'Pad Station 0m'})
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', zIndex: 10, fontSize: '0.75rem', color: '#64748b' }}>
          <span>Geofence Radius: 5.0 km</span>
          <span>Airspace Sector: Charlie-4</span>
        </div>
      </div>

      {/* Real-time Streaming Avionics Line Charts */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
              Live Telemetry Oscilloscope ({activeDrone.drone_name})
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Real-time altitude (m) and ground speed (m/s) telemetry traces
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
            <span style={{ color: '#00d4ff' }}>● Altitude (m)</span>
            <span style={{ color: '#10b981' }}>● Speed (m/s)</span>
          </div>
        </div>

        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={history.length > 0 ? history : [
              { time: '00:00', altitude: 100, speed: 12 },
              { time: '00:02', altitude: 108, speed: 14 },
              { time: '00:04', altitude: 114, speed: 15 },
              { time: '00:06', altitude: 124, speed: 13 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
                }}
                itemStyle={{ color: '#00d4ff', fontWeight: 600 }}
                labelStyle={{ color: '#ffffff', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="altitude"
                stroke="#00d4ff"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="speed"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const gaugeCardStyle = {
  background: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '14px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
};

const gaugeHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export default TelemetryPage;
