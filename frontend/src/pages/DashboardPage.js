import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plane,
  Radio,
  CheckCircle2,
  Wrench,
  Target,
  BatteryCharging,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from 'recharts';
import StatsCard from '../components/common/StatsCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import analyticsService from '../services/analyticsService';
import droneService from '../services/droneService';
import alertService from '../services/alertService';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [drones, setDrones] = useState([]);
  const [droneAnalytics, setDroneAnalytics] = useState(null);
  const [missionAnalytics, setMissionAnalytics] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [overviewRes, dronesRes, droneAnRes, missionAnRes, alertsRes] =
          await Promise.allSettled([
            analyticsService.getOverview(),
            droneService.getDrones({ limit: 6 }),
            analyticsService.getDroneAnalytics(),
            analyticsService.getMissionAnalytics(),
            alertService.getAlerts({ limit: 5 }),
          ]);

        if (overviewRes.status === 'fulfilled') setStats(overviewRes.value);
        if (dronesRes.status === 'fulfilled') setDrones(dronesRes.value.drones || []);
        if (droneAnRes.status === 'fulfilled') setDroneAnalytics(droneAnRes.value);
        if (missionAnRes.status === 'fulfilled') setMissionAnalytics(missionAnRes.value);
        if (alertsRes.status === 'fulfilled') setRecentAlerts(alertsRes.value.alerts || []);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner size="large" text="Synchronizing Fleet Metrics..." />;
  }

  // Fallback / simulated display charts data
  const statusPieData = [
    { name: 'Active/In Flight', value: stats?.active_drones || 2, color: '#00d4ff' },
    { name: 'Available', value: stats?.available_drones || 4, color: '#10b981' },
    { name: 'Maintenance', value: stats?.maintenance_drones || 1, color: '#f59e0b' },
    { name: 'Offline', value: 1, color: '#ef4444' },
  ];

  const missionActivityData = [
    { day: 'Mon', missions: 8, flightHours: 14 },
    { day: 'Tue', missions: 12, flightHours: 22 },
    { day: 'Wed', missions: 15, flightHours: 28 },
    { day: 'Thu', missions: 11, flightHours: 19 },
    { day: 'Fri', missions: 18, flightHours: 34 },
    { day: 'Sat', missions: 14, flightHours: 25 },
    { day: 'Sun', missions: stats?.active_missions || 9, flightHours: 18 },
  ];

  const batteryBarData = (drones.length > 0 ? drones : [
    { drone_name: 'Alpha-1', battery_percentage: 94 },
    { drone_name: 'Mapper-X', battery_percentage: 88 },
    { drone_name: 'Scout-4', battery_percentage: 100 },
    { drone_name: 'CyberHawk', battery_percentage: 78 },
    { drone_name: 'HeavyLift', battery_percentage: 45 },
    { drone_name: 'Vanguard', battery_percentage: 18 },
  ]).map((d) => ({
    name: d.drone_name?.split(' ')[0] || d.drone_name,
    battery: d.battery_percentage,
  }));

  const flightHoursTrend = [
    { month: 'Jun', hours: 85 },
    { month: 'Jul', hours: 110 },
    { month: 'Aug', hours: 135 },
    { month: 'Sep', hours: 160 },
    { month: 'Oct', hours: 190 },
    { month: 'Nov', hours: stats?.total_flight_hours || 240 },
  ];

  const successRate = stats?.success_rate || 91.0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. TOP STATISTICS CARDS ROW (6 CARDS) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
        }}
      >
        <StatsCard
          title="Total Drones"
          value={stats?.total_drones || 8}
          icon={Plane}
          color="#00d4ff"
          trend="up"
          trendValue="+2 this mo"
        />
        <StatsCard
          title="Active In-Flight"
          value={stats?.active_drones || 2}
          icon={Radio}
          color="#38bdf8"
          subtitle="Real-time telemetry"
        />
        <StatsCard
          title="Ready / Available"
          value={stats?.available_drones || 3}
          icon={CheckCircle2}
          color="#10b981"
          subtitle="Dispatched on demand"
        />
        <StatsCard
          title="In Maintenance"
          value={stats?.maintenance_drones || 1}
          icon={Wrench}
          color="#f59e0b"
          subtitle="Scheduled servicing"
        />
        <StatsCard
          title="Active Missions"
          value={stats?.active_missions || 2}
          icon={Target}
          color="#a855f7"
          trend="up"
          trendValue="+14%"
        />
        <StatsCard
          title="Completed Missions"
          value={stats?.completed_missions || 128}
          icon={Activity}
          color="#10b981"
          trend="up"
          trendValue="91% Success"
        />
      </div>

      {/* 2. MAIN CHARTS ROW: MISSION ACTIVITY & FLEET STATUS DONUT */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Mission Activity Chart */}
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
                Mission Flight Activity
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Daily completed missions & cumulative flight duration
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem' }}>
              <span style={{ color: '#00d4ff' }}>● Missions</span>
              <span style={{ color: '#8b5cf6' }}>● Hours</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={missionActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(0, 212, 255, 0.4)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#00d4ff', fontWeight: 600 }}
                />
                <Line
                  type="monotone"
                  dataKey="missions"
                  stroke="#00d4ff"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#00d4ff' }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="flightHours"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drone Status Distribution Donut */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
            Drone Status Overview
          </h3>
          <p style={{ margin: '3px 0 1rem', fontSize: '0.8rem', color: '#64748b' }}>
            Current fleet readiness distribution
          </p>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(0, 212, 255, 0.4)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
                      padding: '8px 12px',
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: 600 }}
                    labelStyle={{ color: '#00d4ff', fontWeight: 600 }}
                    formatter={(val, name) => [`${val} ${val === 1 ? 'Drone' : 'Drones'}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '8px',
              marginTop: '0.5rem',
              fontSize: '0.75rem',
            }}
          >
            {statusPieData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />
                <span style={{ color: '#94a3b8' }}>{item.name}:</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ROW 3: BATTERY HEALTH & FLIGHT HOURS ANALYTICS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Battery Health Monitoring Bar Chart */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
                Battery Health Monitoring
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Live charge % across fleet airframes
              </p>
            </div>
            <BatteryCharging size={20} color="#00d4ff" />
          </div>

          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={batteryBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
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
                <Bar dataKey="battery" fill="#00d4ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flight Hours Analytics Area Chart */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
                Flight Hours Analytics
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Cumulative operational airtime progression
              </p>
            </div>
            <Clock size={20} color="#8b5cf6" />
          </div>

          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={flightHoursTrend}>
                <defs>
                  <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(val) => [`${val} hrs`, 'Airtime']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
                  }}
                  itemStyle={{ color: '#a78bfa', fontWeight: 600 }}
                  labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#hoursGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. ROW 4: FLEET OVERVIEW TABLE & CRITICAL ALERTS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Fleet Overview */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
                Fleet Overview
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Primary registered airframes
              </p>
            </div>
            <button
              onClick={() => navigate('/drones')}
              style={{
                background: 'none',
                border: 'none',
                color: '#00d4ff',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {drones.slice(0, 5).map((drone) => (
              <div
                key={drone.id}
                onClick={() => navigate(`/drones/${drone.id}`)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 600 }}>
                    {drone.drone_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {drone.model} • {drone.serial_number}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#00d4ff', fontWeight: 600 }}>
                    {drone.battery_percentage}%
                  </span>
                  <StatusBadge status={drone.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alerts & Quick Actions */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
                Critical Alerts & Warnings
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Safety thresholds requiring attention
              </p>
            </div>
            <button
              onClick={() => navigate('/alerts')}
              style={{
                background: 'none',
                border: 'none',
                color: '#00d4ff',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Alerts Log <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentAlerts.length === 0 ? (
              <div
                style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                }}
              >
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px' }} />
                <div>All telemetry parameters within normal tolerances.</div>
              </div>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor:
                      alert.severity === 'critical'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(245, 158, 11, 0.08)',
                    border: `1px solid ${
                      alert.severity === 'critical'
                        ? 'rgba(239, 68, 68, 0.25)'
                        : 'rgba(245, 158, 11, 0.25)'
                    }`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <AlertTriangle
                    size={18}
                    color={alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.825rem', color: '#ffffff', fontWeight: 500 }}>
                      {alert.message}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                      {new Date(alert.created_at).toLocaleTimeString()} • Severity:{' '}
                      <span style={{ textTransform: 'uppercase' }}>{alert.severity}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mission Success Rate Bar */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '12px 16px',
              backgroundColor: 'rgba(0, 212, 255, 0.05)',
              border: '1px solid rgba(0, 212, 255, 0.15)',
              borderRadius: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Fleet Mission Success Rate</span>
              <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>
                {successRate}%
              </span>
            </div>
            <div
              style={{
                height: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${successRate}%`,
                  backgroundColor: '#10b981',
                  borderRadius: '3px',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
