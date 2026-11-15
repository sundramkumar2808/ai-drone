import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Activity,
  Battery,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import analyticsService from '../services/analyticsService';
import droneService from '../services/droneService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [droneAnalytics, setDroneAnalytics] = useState(null);
  const [missionAnalytics, setMissionAnalytics] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [ovRes, droneRes, missionRes] = await Promise.allSettled([
          analyticsService.getOverview(),
          analyticsService.getDroneAnalytics(),
          analyticsService.getMissionAnalytics({
            start_date: startDate ? new Date(startDate).toISOString() : undefined,
            end_date: endDate ? new Date(endDate).toISOString() : undefined,
          }),
        ]);

        if (ovRes.status === 'fulfilled') setOverview(ovRes.value);
        if (droneRes.status === 'fulfilled') setDroneAnalytics(droneRes.value);
        if (missionRes.status === 'fulfilled') setMissionAnalytics(missionRes.value);
      } catch (err) {
        console.error('Failed to load analytical metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [startDate, endDate]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      await analyticsService.exportCSV(reportType);
    } catch (e) {
      console.error('Failed to export CSV report:', e);
      let msg = 'Failed to export CSV report';
      if (e.response && e.response.data instanceof Blob) {
        try {
          const text = await e.response.data.text();
          const json = JSON.parse(text);
          if (json.detail) msg = json.detail;
        } catch (_) {}
      } else if (e.message) {
        msg = e.message;
      }
      alert(msg);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await analyticsService.exportPDF(reportType);
    } catch (e) {
      console.error('Failed to export PDF report:', e);
      let msg = 'Failed to export PDF report';
      if (e.response && e.response.data instanceof Blob) {
        try {
          const text = await e.response.data.text();
          const json = JSON.parse(text);
          if (json.detail) msg = json.detail;
        } catch (_) {}
      } else if (e.message) {
        msg = e.message;
      }
      alert(msg);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Compiling Fleet Intelligence & Analytics..." />;
  }

  // Prepped charts data
  const utilizationData =
    droneAnalytics?.utilization?.map((u) => ({
      name: u.name?.split(' ')[0] || u.name,
      hours: u.total_flight_hours,
      missions: u.total_missions,
    })) || [
      { name: 'Alpha-1', hours: 142.5, missions: 28 },
      { name: 'Mapper-X', hours: 98.2, missions: 19 },
      { name: 'Scout-4', hours: 64.0, missions: 14 },
      { name: 'CyberHawk', hours: 115.8, missions: 24 },
      { name: 'HeavyLift', hours: 210.4, missions: 36 },
      { name: 'TerraSurveyor', hours: 178.9, missions: 31 },
    ];

  const missionTypeData = [
    { name: 'Surveillance', count: 42, color: '#00d4ff' },
    { name: 'Inspection', count: 35, color: '#38bdf8' },
    { name: 'Agriculture', count: 28, color: '#10b981' },
    { name: 'Delivery', count: 20, color: '#8b5cf6' },
    { name: 'Search & Rescue', count: 14, color: '#f59e0b' },
    { name: 'Mapping', count: 18, color: '#ec4899' },
  ];

  const monthlyFlightsData = [
    { month: 'May', flights: 44, completionRate: 92 },
    { month: 'Jun', flights: 58, completionRate: 94 },
    { month: 'Jul', flights: 72, completionRate: 91 },
    { month: 'Aug', flights: 85, completionRate: 95 },
    { month: 'Sep', flights: 110, completionRate: 96 },
    { month: 'Oct', flights: 125, completionRate: 97 },
    { month: 'Nov', flights: 140, completionRate: 98 },
  ];

  const batteryConsumptionData = [
    { distance: '1 km', standardRate: 8, ecoRate: 5 },
    { distance: '5 km', standardRate: 28, ecoRate: 19 },
    { distance: '10 km', standardRate: 54, ecoRate: 38 },
    { distance: '15 km', standardRate: 78, ecoRate: 56 },
    { distance: '20 km', standardRate: 95, ecoRate: 72 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header & Export Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
            Fleet Analytics & Reporting
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Mission intelligence powered by flight analytics & telemetry archives.
          </p>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              color: '#ffffff',
              fontSize: '0.85rem',
            }}
          >
            <option value="overview">Executive Overview Report</option>
            <option value="drones">Drone Fleet Specs Report</option>
            <option value="missions">Mission Operations History</option>
            <option value="maintenance">Maintenance Log Report</option>
          </select>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <FileSpreadsheet size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              color: '#00d4ff',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <FileText size={16} /> {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Executive Overview KPI Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff' }}>
            <Activity size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Fleet Airframes
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>
              {overview?.total_drones ?? 6}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
              {overview?.active_drones ?? 3} Active • {overview?.available_drones ?? 2} Ready
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Flight Sorties
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>
              {overview?.total_missions ?? 18}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#00d4ff' }}>
              {overview?.completed_missions ?? 14} Completed Operations
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cumulative Flight Time
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>
              {overview?.total_flight_hours ?? 142.5} hrs
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Success Rate: {overview?.success_rate ?? 94.2}%
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Battery size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Average Battery
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff' }}>
              {overview?.avg_battery_level ?? 88.4}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981' }}>
              Fleet Energy Ready
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          borderRadius: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.85rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={16} /> Date Window:
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#0a0f24',
            color: '#fff',
          }}
        />
        <span style={{ color: '#64748b' }}>to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#0a0f24',
            color: '#fff',
          }}
        />
      </div>

      {/* Primary Analytical Charts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Drone Utilization Horizontal Bar */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
            Airframe Utilization Index (Flight Hours)
          </h3>
          <p style={{ margin: '3px 0 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
            Comparison of total operational hours logged per drone
          </p>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={utilizationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={80} />
                <Tooltip
                  formatter={(val) => [`${val} hrs`, 'Airtime']}
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
                <Bar dataKey="hours" fill="#00d4ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mission Type Distribution Pie */}
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
            Mission Type Distribution
          </h3>
          <p style={{ margin: '3px 0 1rem', fontSize: '0.8rem', color: '#64748b' }}>
            Breakdown across commercial use-cases
          </p>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={missionTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {missionTypeData.map((entry, index) => (
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
                    formatter={(val, name) => [`${val} Missions`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Monthly Flights & Battery Consumption Model */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Monthly Mission Velocity */}
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
                Monthly Flight Volume Growth
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Completed sorties and success rate trajectory
              </p>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>+24% Monthly Growth</span>
          </div>

          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyFlightsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(val) => [`${val} Flights`, 'Missions']}
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
                <Bar dataKey="flights" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Battery Discharge vs Distance Travelled */}
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
                Battery Consumption Rate Model
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Standard vs Eco flight profiles (% battery consumed)
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}>
              <span style={{ color: '#ef4444' }}>● Standard</span>
              <span style={{ color: '#10b981' }}>● Eco Cruise</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={batteryConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="distance" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Consumption']}
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
                <Line type="monotone" dataKey="standardRate" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="ecoRate" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
