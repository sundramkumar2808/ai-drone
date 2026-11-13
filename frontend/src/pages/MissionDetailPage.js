import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Target,
  Plane,
  Clock,
  MapPin,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  AlertOctagon,
} from 'lucide-react';
import missionService from '../services/missionService';
import droneService from '../services/droneService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MissionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mission, setMission] = useState(null);
  const [assignedDrone, setAssignedDrone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMission = async () => {
    setLoading(true);
    try {
      const data = await missionService.getMission(id);
      setMission(data);
      if (data.drone_id) {
        try {
          const drone = await droneService.getDrone(data.drone_id);
          setAssignedDrone(drone);
        } catch (e) {
          console.error('Could not fetch drone info:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load mission details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMission();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await missionService.updateMission(id, { status: newStatus });
      await fetchMission();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update mission state');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" text="Loading Mission Briefing..." />;
  }

  if (!mission) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Mission record not found</h2>
        <button
          onClick={() => navigate('/missions')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#00d4ff',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Return to Operations
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate('/missions')}
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
          <ArrowLeft size={18} /> Back to Missions Command
        </button>

        {/* State Transition Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {mission.status !== 'in_progress' && mission.status !== 'completed' && (
            <button
              onClick={() => handleUpdateStatus('in_progress')}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <Play size={15} /> Launch / In Progress
            </button>
          )}

          {mission.status === 'in_progress' && (
            <button
              onClick={() => handleUpdateStatus('completed')}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <CheckCircle size={15} /> Mark Completed
            </button>
          )}

          {mission.status !== 'completed' && mission.status !== 'cancelled' && (
            <button
              onClick={() => handleUpdateStatus('cancelled')}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <XCircle size={15} /> Abort / Cancel
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner */}
      <div
        style={{
          background: 'radial-gradient(circle at 10% 20%, #1e1338 0%, #0a0f24 100%)',
          borderRadius: '18px',
          border: '1px solid rgba(168, 85, 247, 0.25)',
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
              background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.4)',
            }}
          >
            <Target size={36} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#ffffff' }}>
                {mission.mission_name}
              </h1>
              <StatusBadge status={mission.status} />
            </div>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Type:{' '}
              <span style={{ color: '#00d4ff', textTransform: 'uppercase', fontWeight: 600 }}>
                {mission.mission_type}
              </span>{' '}
              • Assigned Drone:{' '}
              <span style={{ color: '#ffffff', fontWeight: 600 }}>
                {assignedDrone?.drone_name || 'Unassigned'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Grid Information */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Waypoint Coordinates Card */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <MapPin size={20} color="#00d4ff" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
              Flight Routing & Waypoints
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ORIGIN / DEPARTURE POINT</div>
              <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
                {mission.start_location || 'Base Station'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                {mission.start_lat?.toFixed(4)}, {mission.start_lng?.toFixed(4)}
              </div>
            </div>

            <div style={{ padding: '10px 14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>DESTINATION WAYPOINT</div>
              <div style={{ fontSize: '0.95rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
                {mission.destination || 'Target Sector'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontFamily: 'monospace' }}>
                {mission.dest_lat?.toFixed(4)}, {mission.dest_lng?.toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps Card */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <Clock size={20} color="#8b5cf6" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
              Timeline Execution
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Scheduled Start:</span>
              <span style={{ color: '#ffffff' }}>
                {mission.scheduled_at ? new Date(mission.scheduled_at).toLocaleString() : 'Not Set'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Actual Launch:</span>
              <span style={{ color: '#ffffff' }}>
                {mission.started_at ? new Date(mission.started_at).toLocaleString() : 'Awaiting Launch'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Completion Time:</span>
              <span style={{ color: '#ffffff' }}>
                {mission.completed_at ? new Date(mission.completed_at).toLocaleString() : 'In Progress'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Flight Objectives & Sensor Notes */}
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
          <FileText size={20} color="#00d4ff" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#ffffff', fontWeight: 600 }}>
            Mission Briefing Notes
          </h3>
        </div>
        <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.6, fontSize: '0.9rem' }}>
          {mission.notes || 'No custom flight parameters or payload notes logged for this mission.'}
        </p>
      </div>
    </div>
  );
};

export default MissionDetailPage;
