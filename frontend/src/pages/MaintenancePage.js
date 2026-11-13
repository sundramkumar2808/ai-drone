import React, { useState, useEffect } from 'react';
import { Wrench, Plus, CheckCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import maintenanceService from '../services/maintenanceService';
import droneService from '../services/droneService';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import DataTable from '../components/common/DataTable';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../context/AuthContext';

const MaintenancePage = () => {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'fleet_manager' || user?.role === 'operator';

  const [records, setRecords] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const [dronesList, setDronesList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    drone_id: '',
    category: 'general_servicing',
    description: '',
    scheduled_date: '',
    notes: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await maintenanceService.getMaintenanceRecords({
        skip: (page - 1) * 10,
        limit: 10,
        status: statusFilter || undefined,
      });
      setRecords(res.records || []);
      setTotal(res.total || 0);

      const upc = await maintenanceService.getUpcoming(14);
      setUpcoming(upc || []);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, statusFilter]);

  useEffect(() => {
    const loadDrones = async () => {
      try {
        const res = await droneService.getDrones({ limit: 50 });
        setDronesList(res.drones || []);
      } catch (e) {
        console.error(e);
      }
    };
    loadDrones();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      drone_id: dronesList.length > 0 ? dronesList[0].id : '',
      category: 'general_servicing',
      description: 'Routine 50-hour inspection and motor vibration test',
      scheduled_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await maintenanceService.createMaintenance({
        ...formData,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
      });
      setIsModalOpen(false);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to schedule maintenance');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCompleteRecord = async (recordId) => {
    try {
      await maintenanceService.updateMaintenance(recordId, {
        status: 'completed',
        cost: 240.0,
      });
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to complete record');
    }
  };

  const columns = [
    {
      header: 'Category',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
            }}
          >
            <Wrench size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>
              {row.category?.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Airframe ID',
      accessor: 'drone_id',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#94a3b8' }}>
          {String(row.drone_id).slice(0, 8)}...
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Scheduled Date',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {row.scheduled_date ? new Date(row.scheduled_date).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Cost',
      render: (row) => (
        <span style={{ color: '#10b981', fontWeight: 600 }}>
          {row.cost ? `$${row.cost.toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (row) =>
        canManage && row.status !== 'completed' ? (
          <button
            onClick={() => handleCompleteRecord(row.id)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CheckCircle size={13} /> Complete
          </button>
        ) : null,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
            Maintenance & Health Management
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Manage diagnostic inspections, battery swaps, sensor calibrations, and repair logs.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Plus size={18} /> Schedule Maintenance
          </button>
        )}
      </div>

      {/* Upcoming Maintenance Alert Cards */}
      {upcoming.length > 0 && (
        <div
          style={{
            padding: '1.25rem',
            borderRadius: '14px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 600, marginBottom: '0.75rem' }}>
            <AlertCircle size={18} />
            <span>Upcoming Scheduled Airframe Servicing (Next 14 Days)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {upcoming.map((u) => (
              <div
                key={u.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                    {u.category?.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Due: {new Date(u.scheduled_date).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={u.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {['', 'scheduled', 'in_progress', 'completed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: statusFilter === st ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: statusFilter === st ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: statusFilter === st ? '#ffffff' : '#94a3b8',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {st ? st.replace('_', ' ') : 'All Logs'}
          </button>
        ))}
      </div>

      {/* Maintenance Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        emptyMessage="No maintenance records found."
      />

      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={10}
        onPageChange={setPage}
      />

      {/* Modal for Scheduling Maintenance */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Drone Maintenance"
        maxWidth="540px"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Select Drone
            </label>
            <select
              required
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
              <option value="">-- Choose Airframe --</option>
              {dronesList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.drone_name} ({d.model} - {d.serial_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Maintenance Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
              <option value="general_servicing">General Servicing</option>
              <option value="battery_replacement">Battery Replacement</option>
              <option value="motor_inspection">Motor Inspection</option>
              <option value="propeller_replacement">Propeller Replacement</option>
              <option value="camera_repair">Camera Repair</option>
              <option value="sensor_calibration">Sensor Calibration</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Target Scheduled Date
            </label>
            <input
              type="datetime-local"
              required
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
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
              Task Description
            </label>
            <textarea
              rows="3"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
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
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                fontWeight: 600,
                cursor: formSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {formSubmitting ? 'Saving...' : 'Book Maintenance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenancePage;
