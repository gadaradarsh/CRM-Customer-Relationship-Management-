import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const DraggableTask = ({ task, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title || task.description);
  const { showSuccess, showError } = useToast();

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleStatusToggle = async () => {
    try {
      await onUpdate(task._id, { done: !task.done });
      showSuccess(`Task ${task.done ? 'marked as pending' : 'completed'}!`, {
        onUndo: () => onUpdate(task._id, { done: task.done })
      });
    } catch (error) {
      showError('Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await onDelete(task._id);
        showSuccess('Task deleted successfully', {
          onUndo: () => {
            // In a real app, you'd restore the task here
            console.log('Undo delete task');
          }
        });
      } catch (error) {
        showError('Failed to delete task');
      }
    }
  };

  const handleTitleEdit = async () => {
    if (editTitle !== task.title && editTitle.trim()) {
      try {
        await onUpdate(task._id, { title: editTitle.trim() });
        showSuccess('Task updated successfully');
      } catch (error) {
        showError('Failed to update task');
      }
    }
    setIsEditing(false);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-move transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 scale-95' : 'hover-lift'
      } ${task.done ? 'opacity-75' : ''}`}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        <div className="flex-shrink-0 mt-1">
          <div className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-move">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
            </svg>
          </div>
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={handleStatusToggle}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                task.done 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-300 hover:border-green-500'
              }`}
            >
              {task.done && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleEdit();
                  } else if (e.key === 'Escape') {
                    setEditTitle(task.title || task.description);
                    setIsEditing(false);
                  }
                }}
                className="flex-1 text-sm font-medium text-gray-900 dark:text-white bg-transparent border-none outline-none focus:ring-0"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className={`flex-1 text-left text-sm font-medium transition-colors duration-200 ${
                  task.done 
                    ? 'text-gray-500 dark:text-gray-400 line-through' 
                    : 'text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {task.title || task.description}
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            
            {task.dueDate && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            
            {task.clientId && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {task.clientId.name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraggableTask;
