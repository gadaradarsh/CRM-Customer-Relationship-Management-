import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const BatchOperations = ({ selectedItems, onClearSelection, onBulkAction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleBulkAction = async (action) => {
    try {
      await onBulkAction(action, selectedItems);
      showSuccess(`${selectedItems.length} clients ${action} successfully`);
      onClearSelection();
    } catch (error) {
      showError(`Failed to ${action} clients`);
    }
  };

  const actions = [
    {
      id: 'email',
      label: 'Send Email',
      icon: '📧',
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200'
    },
    {
      id: 'assign',
      label: 'Assign Task',
      icon: '✅',
      color: 'bg-green-100 text-green-600 hover:bg-green-200'
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: '📦',
      color: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
    },
    {
      id: 'export',
      label: 'Export',
      icon: '📊',
      color: 'bg-purple-100 text-purple-600 hover:bg-purple-200'
    }
  ];

  if (selectedItems.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-slide-up">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedItems.length} selected
            </span>
            <button
              onClick={onClearSelection}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleBulkAction(action.id)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${action.color}`}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchOperations;
