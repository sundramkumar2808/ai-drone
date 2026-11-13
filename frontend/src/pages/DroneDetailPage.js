import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plane,
  BatteryCharging,
  Clock,
  Weight,
  Calendar,
  Wrench,
  Shield,
  Activity,
  Radio,
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
import droneService from '../services/droneService';
import missionService from '../services/missionService';
import maintenanceService from '../services/maintenanceService';
import telemetryService from '../services/telemetryService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DroneDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [drone, setDrone] = useState(null);
  const [missions, setMissions] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDroneDetails = async () => {
      setLoading(true);
      try {
        const [droneRes, missionsRes, maintRes, telRes] = await Promise.allSettled([
          droneService.getDrone(id),
          missionService.getMissions({ drone_id: id, limit: 10 }),
          maintenanceService.getMaintenanceRecords({ drone_id: id, limit: 10 }),
          telemetryService.getDroneTelemetry(id, 20),
        ]);

        if (droneRes.status === 'fulfilled') setDrone(droneRes.value);
        if (missionsRes.status === 'fulfilled') setMissions(missionsRes.value.missions || []);
        if (maintRes.status === 'fulfilled') setMaintenance(maintRes.value.records || []);
        if (telRes.status === 'fulfilled') setTelemetryHistory(telRes.value || []);
      } catch (err) {
        console.error('Failed to load drone profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDroneDetails();
  }, [id]);

  if (loading) {
    return <LoadingSpinner size="large" text="Retrieving Airframe Telemetry Profile..." />;
  }

  if (!drone) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Drone airframe not found</h2>
        <button
          onClick={() => navigate('/drones')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#00d4ff',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Return to Fleet List
        </button>
      </div>
    );
  }

  // Generate simulated chart data if telemetry is low
  const chartData =
    telemetryHistory.length > 0
      ? telemetryHistory.map((t, idx) => ({
          time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          battery: t.battery_level,
          altitude: t.altitude,
          speed: t.speed,
        }))
      : [
          { time: '10:00', battery: 100, altitude: 0, speed: 0 },
          { time: '10:15', battery: 92, altitude: 120, speed: 14 },
          { time: '10:30', battery: 84, altitude: 150, speed: 16 },
          { time: '10:45', battery: 76, altitude: 140, speed: 12 },
          { time: '11:00', battery: drone.battery_percentage, altitude: 0, speed: 0 },
        ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Navigation Back Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate('/drones')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={18} /> Back to Drones Directory
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/telemetry')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              backgroundColor: 'rgba(0, 212, 255, 0.08)',
              color: '#00d4ff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Radio size={16} /> Live Radar Tracking
          </button>
        </div>
      </div>

      {/* Main Drone Header Banner */}
      <div
        style={{
          background: 'radial-gradient(circle at 10% 20%, #0d1e3d 0%, #0a0f24 100%)',
          borderRadius: '18px',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 25px rgba(0, 212, 255, 0.4)',
            }}
          >
            <Plane size={36} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
                {drone.drone_name}
              </h1>
              <StatusBadge status={drone.status} />
            </div>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              {drone.manufacturer} • Model: {drone.model} • Serial:{' '}
              <span style={{ fontFamily: 'monospace', color: '#00d4ff' }}>
                {drone.serial_number}
              </span>
            </p>
          </div>
        </div>

        {/* Quick stat highlights */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>BATTERY HEALTH</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00d4ff' }}>
              {drone.battery_percentage}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>LOGGED FLIGHT TIME</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
              {drone.total_flight_hours} hrs
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>MAX FLIGHT TIME</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
              {drone.max_flight_time} min
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Airframe Specs & Battery Telemetry Chart */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Specifications Card */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', color: '#ffffff', fontWeight: 600 }}>
            Technical Specifications
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Airframe ID</span>
              <span style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '0.8rem' }}>{drone.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Maximum Payload Capacity</span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{drone.max_payload} kg</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Current Station Location</span>
              <span style={{ color: '#ffffff' }}>{drone.location || 'Base Station'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>GPS Coordinates</span>
              <span style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {drone.latitude?.toFixed(4)}, {drone.longitude?.toFixed(4)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Last Flight Timestamp</span>
              <span style={{ color: '#ffffff' }}>
                {drone.last_flight_date
                  ? new Date(drone.last_flight_date).toLocaleDateString()
                  : 'Recent Flight Today'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Registration Date</span>
              <span style={{ color: '#ffffff' }}>
                {new Date(drone.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Discharge / Altitude Telemetry Graph */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff', fontWeight: 600 }}>
              Flight Telemetry Trends
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#00d4ff' }}>● Battery %  ● Alt (m)</span>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Battery']}
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
                  dataKey="battery"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="altitude"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mission History & Maintenance Records Tables */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Mission History */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
            Recent Assigned Missions
          </h3>

          {missions.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem 0' }}>
              No mission history recorded for this drone yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {missions.map((m) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/missions/${m.id}`)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                      {m.mission_name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Type: {m.mission_type}
                    </div>
                  </div>
                  <StatusBadge status={m.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance Records */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
            Maintenance & Inspection Log
          </h3>

          {maintenance.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem 0' }}>
              Airframe has no pending or recorded maintenance logs.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {maintenance.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                      {rec.category?.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {rec.description}
                    </div>
                  </div>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DroneDetailPage;
