import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, Calendar, MapPin, Eye, XCircle } from 'lucide-react';
import missionService from '../services/missionService';
import droneService from '../services/droneService';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import DataTable from '../components/common/DataTable';
import SearchFilter from '../components/common/SearchFilter';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../context/AuthContext';

const MissionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user?.role === 'admin' || user?.role === 'fleet_manager' || user?.role === 'operator';

  const [missions, setMissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Available drones for assignment
  const [dronesList, setDronesList] = useState([]);

  // Create mission modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    mission_name: '',
    mission_type: 'surveillance',
    start_location: '',
    destination: '',
    start_lat: 37.7749,
    start_lng: -122.4194,
    dest_lat: 37.7850,
    dest_lng: -122.4100,
    drone_id: '',
    scheduled_at: '',
    notes: '',
  });

  const fetchMissions = async () => {
    setLoading(true);
    try {
      const res = await missionService.getMissions({
        skip: (page - 1) * 10,
        limit: 10,
        status: statusFilter || undefined,
        mission_type: typeFilter || undefined,
      });
      setMissions(res.missions || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load flight missions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    const fetchDrones = async () => {
      try {
        const res = await droneService.getDrones({ limit: 50 });
        setDronesList(res.drones || []);
      } catch (e) {
        console.error('Could not load drones for selection:', e);
      }
    };
    fetchDrones();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      mission_name: '',
      mission_type: 'surveillance',
      start_location: 'Central Command Hub Alpha',
      destination: 'Sector 5 Outpost',
      start_lat: 37.7749,
      start_lng: -122.4194,
      dest_lat: 37.7850,
      dest_lng: -122.4100,
      drone_id: dronesList.length > 0 ? dronesList[0].id : '',
      scheduled_at: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const payload = {
        ...formData,
        drone_id: formData.drone_id || undefined,
        scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : undefined,
      };
      await missionService.createMission(payload);
      setIsModalOpen(false);
      fetchMissions();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to dispatch mission');
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Mission Name',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a855f7',
            }}
          >
            <Target size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>{row.mission_name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              From: {row.start_location || 'Base'} → {row.destination || 'Waypoint'}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category Type',
      render: (row) => (
        <span
          style={{
            fontSize: '0.75rem',
            padding: '3px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#38bdf8',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {row.mission_type?.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Schedule',
      render: (row) => (
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {row.scheduled_at ? new Date(row.scheduled_at).toLocaleString() : 'Immediate'}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/missions/${row.id}`)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              color: '#00d4ff',
              cursor: 'pointer',
            }}
            title="Inspect Mission Dossier"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
            Mission Operations Command
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Plan, assign, schedule, and monitor autonomous aerial flight operations.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.35)',
            }}
          >
            <Plus size={18} /> Plan New Mission
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <SearchFilter
        searchPlaceholder="Filter mission parameters..."
        filters={[
          {
            name: 'status',
            label: 'All Mission Statuses',
            value: statusFilter,
            options: [
              { label: 'Scheduled', value: 'scheduled' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' },
              { label: 'Cancelled', value: 'cancelled' },
            ],
          },
          {
            name: 'type',
            label: 'All Mission Types',
            value: typeFilter,
            options: [
              { label: 'Surveillance', value: 'surveillance' },
              { label: 'Agriculture', value: 'agriculture' },
              { label: 'Delivery', value: 'delivery' },
              { label: 'Mapping', value: 'mapping' },
              { label: 'Search and Rescue', value: 'search_rescue' },
              { label: 'Inspection', value: 'inspection' },
            ],
          },
        ]}
        onFilterChange={(name, val) => {
          if (name === 'status') setStatusFilter(val);
          if (name === 'type') setTypeFilter(val);
        }}
        onReset={() => {
          setStatusFilter('');
          setTypeFilter('');
        }}
      />

      {/* Missions Table */}
      <DataTable
        columns={columns}
        data={missions}
        loading={loading}
        onRowClick={(row) => navigate(`/missions/${row.id}`)}
        emptyMessage="No missions matching the criteria."
      />

      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={10}
        onPageChange={setPage}
      />

      {/* Create Mission Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Aerial Operation"
        maxWidth="620px"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Mission Name
            </label>
            <input
              type="text"
              required
              value={formData.mission_name}
              onChange={(e) => setFormData({ ...formData, mission_name: e.target.value })}
              placeholder="e.g. Infrastructure Thermal Radiometric Survey"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Mission Type
            </label>
            <select
              value={formData.mission_type}
              onChange={(e) => setFormData({ ...formData, mission_type: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value="surveillance">Surveillance</option>
              <option value="agriculture">Agriculture</option>
              <option value="delivery">Delivery</option>
              <option value="mapping">Mapping</option>
              <option value="search_rescue">Search and Rescue</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Assign Drone Airframe
            </label>
            <select
              value={formData.drone_id}
              onChange={(e) => setFormData({ ...formData, drone_id: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value="">-- Select Available Airframe --</option>
              {dronesList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.drone_name} ({d.status} - {d.battery_percentage}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Origin / Departure Point
            </label>
            <input
              type="text"
              value={formData.start_location}
              onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
              placeholder="Base Hub Alpha"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Target Destination
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="Solar Array Substation 3"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Schedule Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Mission Flight Notes & Objectives
            </label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Specify sensor payloads, waypoints, geofence constraints..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                color: '#ffffff',
                boxSizing: 'border-box',
                resize: 'none',
              }}
            />
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: formSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {formSubmitting ? 'Authorizing Mission...' : 'Dispatch Mission'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MissionsPage;
