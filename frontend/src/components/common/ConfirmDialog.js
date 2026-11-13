import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  type = 'danger',
  loading = false,
}) => {
  const isDanger = type === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              backgroundColor: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDanger ? '#ef4444' : '#f59e0b',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isDanger ? '#ef4444' : '#00d4ff',
              color: '#ffffff',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: isDanger
                ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                : '0 4px 12px rgba(0, 212, 255, 0.3)',
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
