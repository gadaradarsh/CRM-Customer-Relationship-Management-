import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const EnhancedClientCard = ({ client, onStatusUpdate, onDelete, isSelected, onSelectionChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(client.status);
  const { showSuccess, showError } = useToast();

  const handleStatusUpdate = async (newStatus) => {
    try {
      await onStatusUpdate(client._id, newStatus);
      showSuccess(`Client status updated to ${newStatus}`, {
        onUndo: () => onStatusUpdate(client._id, client.status)
      });
    } catch (error) {
      showError('Failed to update client status');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
      try {
        await onDelete(client._id);
        showSuccess(`${client.name} deleted successfully`, {
          onUndo: () => {
            // In a real app, you'd restore the client here
            console.log('Undo delete client');
          }
        });
      } catch (error) {
        showError('Failed to delete client');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'status-new',
      contacted: 'status-contacted',
      qualified: 'status-qualified',
      won: 'status-won',
      lost: 'status-lost'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover-lift ${
      isSelected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
    }`}>
      {/* Selection and Actions */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelectionChange(client._id, e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to={`/clients/${client._id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
          >
            View
          </Link>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Client Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{client.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{client.company}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{client.email}</p>
        </div>
        
        {/* Status with inline editing */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
          {isEditing ? (
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              onBlur={() => {
                if (editStatus !== client.status) {
                  handleStatusUpdate(editStatus);
                }
                setIsEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (editStatus !== client.status) {
                    handleStatusUpdate(editStatus);
                  }
                  setIsEditing(false);
                } else if (e.key === 'Escape') {
                  setEditStatus(client.status);
                  setIsEditing(false);
                }
              }}
              className={`status-badge ${getStatusColor(editStatus)} border-0 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
              autoFocus
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`status-badge ${getStatusColor(client.status)} border-0 bg-transparent text-xs hover:bg-opacity-80 transition-all duration-200`}
            >
              {client.status}
            </button>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Value</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Rs {client.estimatedValue?.toLocaleString() || 0}
          </span>
        </div>
        
        {client.assignedTo && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Assigned To</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {client.assignedTo.name}
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200">
              📞 Call
            </button>
            <button className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors duration-200">
              📧 Email
            </button>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {new Date(client.lastContactDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedClientCard;
