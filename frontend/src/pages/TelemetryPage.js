import React, { useState, useEffect } from 'react';
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
import telemetryService from '../services/telemetryService';
import StatusBadge from '../components/common/StatusBadge';

const TelemetryPage = () => {
  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
  const { data: wsData, isConnected } = useWebSocket(`${wsUrl}/ws/telemetry`);

  const [dronesTelemetry, setDronesTelemetry] = useState([]);
  const [selectedDroneId, setSelectedDroneId] = useState(null);
  const [history, setHistory] = useState([]);

  // Fetch initial telemetry via REST
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const data = await telemetryService.getTelemetry();
        if (data && data.length > 0) {
          setDronesTelemetry(data);
          setSelectedDroneId(data[0].drone_id);
        }
      } catch (err) {
        console.error('Initial telemetry fetch failed:', err);
      }
    };
    fetchInitial();
  }, []);

  // Update telemetry on incoming WebSocket messages
  useEffect(() => {
    if (wsData && wsData.type === 'telemetry' && Array.isArray(wsData.data)) {
      setDronesTelemetry(wsData.data);
      if (!selectedDroneId && wsData.data.length > 0) {
        setSelectedDroneId(wsData.data[0].drone_id);
      }

      // Append to local real-time chart history
      const active = wsData.data.find((d) => d.drone_id === selectedDroneId) || wsData.data[0];
      if (active) {
        setHistory((prev) => {
          const newPoint = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            altitude: active.altitude,
            speed: active.speed,
            battery: active.battery_level,
          };
          const slice = prev.length >= 15 ? prev.slice(1) : prev;
          return [...slice, newPoint];
        });
      }
    }
  }, [wsData, selectedDroneId]);

  const activeDrone =
    dronesTelemetry.find((d) => d.drone_id === selectedDroneId) ||
    dronesTelemetry[0] || {
      drone_name: 'SkyGuardian Alpha-1',
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 124.5,
      speed: 14.2,
      battery_level: 94.0,
      temperature: 28.5,
      gps_signal: 96.0,
      connection_status: 'connected',
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
          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>MSL Ground clearance</span>
        </div>

        <div style={gaugeCardStyle}>
          <div style={gaugeHeaderStyle}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>GROUND SPEED</span>
            <Gauge size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
            {activeDrone.speed} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>m/s</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
            {((activeDrone.speed || 0) * 3.6).toFixed(1)} km/h
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
            top: '42%',
            left: '56%',
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
              backgroundColor: 'rgba(0, 212, 255, 0.25)',
              border: '2px solid #00d4ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px #00d4ff',
              animation: 'pulse 2s infinite',
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
              border: '1px solid rgba(0, 212, 255, 0.3)',
              fontSize: '0.75rem',
              color: '#00d4ff',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {activeDrone.drone_name} ({activeDrone.altitude}m)
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
