import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Plane } from 'lucide-react';
import droneService from '../services/droneService';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import DataTable from '../components/common/DataTable';
import SearchFilter from '../components/common/SearchFilter';
import Pagination from '../components/common/Pagination';
import { useAuth } from '../context/AuthContext';

const DronesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'fleet_manager';
  const canDelete = user?.role === 'admin';

  const [drones, setDrones] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [droneToDelete, setDroneToDelete] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    drone_name: '',
    model: '',
    manufacturer: '',
    serial_number: '',
    battery_percentage: 100,
    status: 'available',
    location: '',
    latitude: 37.7749,
    longitude: -122.4194,
    max_flight_time: 45,
    max_payload: 3.5,
  });

  const fetchDrones = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await droneService.getDrones({
        skip: (page - 1) * 10,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setDrones(res.drones || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load fleet drones:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrones(false);
    const interval = setInterval(() => {
      fetchDrones(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [page, search, statusFilter]);

  const handleOpenAdd = () => {
    setFormData({
      drone_name: '',
      model: '',
      manufacturer: '',
      serial_number: `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      battery_percentage: 100,
      status: 'available',
      location: 'Central Hangar Hub',
      latitude: 37.7749,
      longitude: -122.4194,
      max_flight_time: 45,
      max_payload: 3.5,
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (drone, e) => {
    e.stopPropagation();
    setSelectedDrone(drone);
    setFormData({
      drone_name: drone.drone_name,
      model: drone.model,
      manufacturer: drone.manufacturer,
      serial_number: drone.serial_number,
      battery_percentage: drone.battery_percentage,
      status: drone.status,
      location: drone.location || '',
      latitude: drone.latitude || 37.7749,
      longitude: drone.longitude || -122.4194,
      max_flight_time: drone.max_flight_time,
      max_payload: drone.max_payload,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (drone, e) => {
    e.stopPropagation();
    setDroneToDelete(drone);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await droneService.createDrone(formData);
      setIsAddModalOpen(false);
      fetchDrones();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to register drone');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      const droneId = selectedDrone.id || selectedDrone._id;
      await droneService.updateDrone(droneId, formData);
      setIsEditModalOpen(false);
      fetchDrones();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update drone specifications');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!droneToDelete) return;
    setFormSubmitting(true);
    try {
      await droneService.deleteDrone(droneToDelete.id);
      setIsDeleteDialogOpen(false);
      fetchDrones();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to decommission drone');
    } finally {
      setFormSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Drone Airframe',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00d4ff',
            }}
          >
            <Plane size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#ffffff' }}>{row.drone_name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {row.manufacturer} • {row.model}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Serial Number',
      accessor: 'serial_number',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{row.serial_number}</span>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Battery',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '45px',
              height: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${row.battery_percentage}%`,
                height: '100%',
                backgroundColor:
                  row.battery_percentage > 50
                    ? '#10b981'
                    : row.battery_percentage > 20
                    ? '#f59e0b'
                    : '#ef4444',
              }}
            />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{row.battery_percentage}%</span>
        </div>
      ),
    },
    {
      header: 'Flight Hours',
      render: (row) => `${(row.total_flight_hours || 0).toFixed(1)} hrs`,
    },
    {
      header: 'Station Location',
      accessor: 'location',
      render: (row) => row.location || 'Base Station',
    },
    {
      header: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/drones/${row.id}`)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              color: '#00d4ff',
              cursor: 'pointer',
            }}
            title="Inspect Telemetry & Specs"
          >
            <Eye size={15} />
          </button>
          {canEdit && (
            <button
              onClick={(e) => handleOpenEdit(row, e)}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                color: '#38bdf8',
                cursor: 'pointer',
              }}
              title="Edit Airframe Specs"
            >
              <Edit size={15} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => handleOpenDelete(row, e)}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                color: '#ef4444',
                cursor: 'pointer',
              }}
              title="Decommission Drone"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
            Drone Fleet Management
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Manage autonomous airframes, payload capacities, battery health, and maintenance cycles.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 212, 255, 0.35)',
            }}
          >
            <Plus size={18} /> Add New Drone
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <SearchFilter
        searchPlaceholder="Search by drone name, serial number, model..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            name: 'status',
            label: 'All Drone Statuses',
            value: statusFilter,
            options: [
              { label: 'Available', value: 'available' },
              { label: 'In Flight', value: 'in_flight' },
              { label: 'Active', value: 'active' },
              { label: 'Charging', value: 'charging' },
              { label: 'Maintenance', value: 'maintenance' },
              { label: 'Offline', value: 'offline' },
            ],
          },
        ]}
        onFilterChange={(_, val) => setStatusFilter(val)}
        onReset={() => {
          setSearch('');
          setStatusFilter('');
        }}
      />

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={drones}
        loading={loading}
        onRowClick={(row) => navigate(`/drones/${row.id}`)}
        emptyMessage="No drones matching the filter criteria were found."
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={10}
        onPageChange={setPage}
      />

      {/* Add / Edit Drone Modal Form */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Register New Drone' : `Edit Drone: ${selectedDrone?.drone_name}`}
        maxWidth="600px"
      >
        <form
          onSubmit={isAddModalOpen ? handleCreateSubmit : handleEditSubmit}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
        >
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Drone Call-Sign / Name
            </label>
            <input
              type="text"
              required
              value={formData.drone_name}
              onChange={(e) => setFormData({ ...formData, drone_name: e.target.value })}
              placeholder="e.g. SkyGuardian Alpha-2"
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
              Model
            </label>
            <input
              type="text"
              required
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g. Matrice 300 RTK"
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
              Manufacturer
            </label>
            <input
              type="text"
              required
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="e.g. DJI, Skydio, Wingtra"
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
              Serial Number (Unique)
            </label>
            <input
              type="text"
              required
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              placeholder="SN-2024-XXXXX"
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
              Current Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              <option value="available">Available</option>
              <option value="active">Active</option>
              <option value="in_flight">In Flight</option>
              <option value="charging">Charging</option>
              <option value="maintenance">Maintenance</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Battery Level (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.battery_percentage}
              onChange={(e) =>
                setFormData({ ...formData, battery_percentage: parseFloat(e.target.value) || 0 })
              }
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
              Max Flight Time (min)
            </label>
            <input
              type="number"
              min="1"
              value={formData.max_flight_time}
              onChange={(e) =>
                setFormData({ ...formData, max_flight_time: parseFloat(e.target.value) || 30 })
              }
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
              Max Payload (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.max_payload}
              onChange={(e) =>
                setFormData({ ...formData, max_payload: parseFloat(e.target.value) || 1.0 })
              }
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
              Station / Hangar Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. North Perimeter Hangar Bay 2"
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

          <div
            style={{
              gridColumn: 'span 2',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '1rem',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
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
                background: 'linear-gradient(135deg, #00d4ff 0%, #3b82f6 100%)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: formSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {formSubmitting
                ? 'Processing...'
                : isAddModalOpen
                ? 'Register Drone'
                : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Decommission Airframe"
        message={`Are you sure you want to delete "${droneToDelete?.drone_name}" (${droneToDelete?.serial_number})? This action removes all historical flight records.`}
        confirmText="Decommission"
        type="danger"
        loading={formSubmitting}
      />
    </div>
  );
};

export default DronesPage;
