import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserCheck,
  UserX,
  UserPlus,
  Activity,
  Server,
  Lock,
  Clock,
} from 'lucide-react';
import adminService from '../services/adminService';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get the current logged-in user id from localStorage token
  const currentUserId = (() => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || null;
    } catch {
      return null;
    }
  })();

  // Add User modal
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'operator',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, logsRes, statsRes] = await Promise.allSettled([
        adminService.getUsers(),
        adminService.getActivityLogs(),
        adminService.getStats(),
      ]);

      if (usersRes.status === 'fulfilled') setUsers(usersRes.value || []);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value || null);
    } catch (err) {
      console.error('Failed to load administrative console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.createUser(userFormData);
      setIsAddUserModalOpen(false);
      setUserFormData({ full_name: '', email: '', phone: '', password: '', role: 'operator' });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await adminService.disableUser(userId);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to change user status');
    }
  };

  const handleRemoveUser = async (userId, userName) => {
    if (!window.confirm(`Permanently delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove user');
    }
  };

  const userColumns = [
    {
      header: 'Full Name',
      accessor: 'full_name',
      render: (row) => (
        <span style={{ fontWeight: 600, color: '#ffffff' }}>{row.full_name}</span>
      ),
    },
    {
      header: 'Email Address',
      accessor: 'email',
      render: (row) => <span style={{ color: '#94a3b8' }}>{row.email}</span>,
    },
    {
      header: 'Role Assignment',
      render: (row) => (
        <select
          value={row.role}
          onChange={(e) => handleRoleChange(row.id, e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#0a0f24',
            color: '#00d4ff',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          <option value="admin">Admin</option>
          <option value="fleet_manager">Fleet Manager</option>
          <option value="operator">Drone Operator</option>
          <option value="viewer">Viewer</option>
        </select>
      ),
    },
    {
      header: 'Account Status',
      render: (row) => (
        <StatusBadge status={row.is_active ? 'active' : 'offline'} />
      ),
    },
    {
      header: 'Joined Date',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Access Control',
      render: (row) => {
        const isSelf = row.id === currentUserId;
        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleToggleActive(row.id)}
              disabled={isSelf}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${row.is_active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                backgroundColor: row.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: row.is_active ? '#ef4444' : '#10b981',
                fontSize: '0.75rem',
                cursor: isSelf ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isSelf ? 0.5 : 1,
              }}
            >
              {row.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
              {row.is_active ? 'Deactivate' : 'Reactivate'}
            </button>
            <button
              onClick={() => handleRemoveUser(row.id, row.full_name)}
              disabled={isSelf}
              title={isSelf ? 'Cannot remove your own account' : `Remove ${row.full_name}`}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: isSelf ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: isSelf ? 0.4 : 1,
              }}
            >
              🗑 Remove
            </button>
          </div>
        );
      },
    },
  ];

  const logColumns = [
    {
      header: 'Timestamp',
      accessor: 'created_at',
      render: (row) => (
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          {row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Security Action',
      accessor: 'action',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', color: '#00d4ff', fontWeight: 600 }}>
          {row.action}
        </span>
      ),
    },
    {
      header: 'Target Resource',
      accessor: 'resource_type',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          {row.resource_type} ({row.resource_id?.slice(0, 8)}...)
        </span>
      ),
    },
    {
      header: 'Audit Description',
      accessor: 'details',
      render: (row) => <span style={{ color: '#ffffff', fontSize: '0.85rem' }}>{row.details}</span>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
              System Administration & Security
            </h1>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              ADMIN PRIVILEGES ONLY
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            User role authorizations, security audit logs, and core service health indicators.
          </p>
        </div>

        {activeTab === 'users' && (
          <button
            onClick={() => setIsAddUserModalOpen(true)}
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
            }}
          >
            <UserPlus size={18} /> Provision New User
          </button>
        )}
      </div>

      {/* System Health Quick Tiles */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={statTileStyle}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>TOTAL OPERATORS</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
              {stats.total_users}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>RBAC Enforced</span>
          </div>
          <div style={statTileStyle}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>REGISTERED AIRFRAMES</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#00d4ff' }}>
              {stats.total_drones}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#00d4ff' }}>Live Telemetry Active</span>
          </div>
          <div style={statTileStyle}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>DATABASE INTEGRITY</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
              {stats.database_status}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>MongoDB 7.0</span>
          </div>
          <div style={statTileStyle}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>TELEMETRY STREAM</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
              {stats.telemetry_stream}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Async Loop: 2000ms</span>
          </div>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'users' ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: activeTab === 'users' ? 'rgba(0, 212, 255, 0.12)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'users' ? '#ffffff' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          User Accounts & Roles
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: activeTab === 'logs' ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: activeTab === 'logs' ? 'rgba(0, 212, 255, 0.12)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'logs' ? '#ffffff' : '#94a3b8',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Security Audit Logs
        </button>
      </div>

      {/* Active Tab View */}
      {loading ? (
        <LoadingSpinner size="medium" text="Accessing secure administrative datastore..." />
      ) : activeTab === 'users' ? (
        <DataTable columns={userColumns} data={users} emptyMessage="No users found." />
      ) : (
        <DataTable columns={logColumns} data={logs} emptyMessage="No security logs recorded." />
      )}

      {/* Provision User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Provision Operator Account"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
              Full Name
            </label>
            <input
              type="text"
              required
              value={userFormData.full_name}
              onChange={(e) => setUserFormData({ ...userFormData, full_name: e.target.value })}
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
              Email Address
            </label>
            <input
              type="email"
              required
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
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
              Temporary Password
            </label>
            <input
              type="password"
              required
              minLength="8"
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
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
              Role Assignment
            </label>
            <select
              value={userFormData.role}
              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
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
              <option value="operator">Drone Operator</option>
              <option value="fleet_manager">Fleet Manager</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(false)}
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
              disabled={submitting}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #00d4ff, #3b82f6)',
                color: '#ffffff',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Creating...' : 'Create Operator'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const statTileStyle = {
  padding: '1.25rem',
  borderRadius: '14px',
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

export default AdminPage;
