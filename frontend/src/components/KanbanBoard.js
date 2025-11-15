import React, { useState } from 'react';
import DraggableTask from './DraggableTask';
import { useToast } from '../context/ToastContext';

const KanbanBoard = ({ tasks, onTaskUpdate, onTaskDelete }) => {
  const [draggedOver, setDraggedOver] = useState(null);
  const { showSuccess, showError } = useToast();

  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-700' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'done', title: 'Done', color: 'bg-green-100 dark:bg-green-900/30' }
  ];

  const getTasksForColumn = (columnId) => {
    switch (columnId) {
      case 'todo':
        return tasks.filter(task => !task.done && !task.inProgress);
      case 'in-progress':
        return tasks.filter(task => task.inProgress);
      case 'done':
        return tasks.filter(task => task.done);
      default:
        return [];
    }
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDraggedOver(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = async (e, columnId) => {
    e.preventDefault();
    setDraggedOver(null);
    
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t._id === taskId);
    
    if (!task) return;

    try {
      let updates = {};
      switch (columnId) {
        case 'todo':
          updates = { done: false, inProgress: false };
          break;
        case 'in-progress':
          updates = { done: false, inProgress: true };
          break;
        case 'done':
          updates = { done: true, inProgress: false };
          break;
      }
      
      await onTaskUpdate(taskId, updates);
      showSuccess(`Task moved to ${columns.find(c => c.id === columnId)?.title}`);
    } catch (error) {
      showError('Failed to update task');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => (
        <div
          key={column.id}
          className={`rounded-lg p-4 transition-colors duration-200 ${
            draggedOver === column.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
              {getTasksForColumn(column.id).length}
            </span>
          </div>
          
          <div className="space-y-3 min-h-[200px]">
            {getTasksForColumn(column.id).map((task) => (
              <DraggableTask
                key={task._id}
                task={task}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
              />
            ))}
            
            {getTasksForColumn(column.id).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm">No tasks here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
