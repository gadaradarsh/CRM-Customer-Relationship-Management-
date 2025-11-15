import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AdaptiveDashboard = ({ user, summary, recentClients, recentTasks, recentActivities }) => {
  const [widgets, setWidgets] = useState([]);

  useEffect(() => {
    initializeWidgets();
  }, [summary, recentClients, recentTasks]);

  const initializeWidgets = () => {
    const defaultWidgets = [
      {
        id: 'quick-stats',
        title: 'Quick Stats',
        type: 'stats',
        size: 'medium',
        priority: 1
      },
      {
        id: 'recent-clients',
        title: 'Recent Clients',
        type: 'clients',
        size: 'large',
        priority: 2
      },
      {
        id: 'recent-tasks',
        title: 'Recent Tasks',
        type: 'tasks',
        size: 'large',
        priority: 3
      },
      {
        id: 'recent-activities',
        title: 'Recent Activities',
        type: 'activities',
        size: 'large',
        priority: 4
      }
    ];
    setWidgets(defaultWidgets);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'from-green-400 to-green-600';
    if (percentage >= 60) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getActivityIcon = (type) => {
    const icons = {
      call: '📞',
      meeting: '🤝',
      note: '📝',
      email: '📧',
      'follow-up': '⏰'
    };
    return icons[type] || '📋';
  };


  const renderWidget = (widget) => {
    switch (widget.type) {
      case 'stats':
        return (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{widget.title}</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{summary?.clients?.total || 0}</div>
                <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">Total Clients</div>
              </div>
              {user?.role !== 'employee' && (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{summary?.tasks?.completed || 0}</div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">Tasks Done</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{summary?.activities?.total || 0}</div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">Activities</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{summary?.revenue?.total || 0}</div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 mt-1">Revenue</div>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'clients':
        return (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">{widget.title}</h3>
              <Link to="/clients" className="btn-link text-sm">
                View All →
              </Link>
            </div>
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-md">
              {recentClients?.slice(0, 4).map((client) => (
                <div key={client._id} className="flex items-center justify-between p-3 bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 font-semibold text-sm">
                        {client.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-500">{client.company}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`status-badge ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                    <Link to={`/clients/${client._id}`} className="btn-link text-sm">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">{widget.title}</h3>
              <Link to="/tasks" className="btn-link text-sm">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentTasks && recentTasks.length > 0 ? (
                recentTasks.slice(0, 2).map((task, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md bg-white">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 text-sm">✅</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{task.title || task.description || 'Task'}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(task.createdAt || task.date || new Date()).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status === 'completed' ? 'Done' : 
                         task.status === 'in_progress' ? 'In Progress' : 
                         'Pending'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📝</div>
                  <div className="text-gray-500 text-sm">No recent tasks</div>
                  <div className="text-gray-400 text-xs mt-1">Create your first task to get started</div>
                </div>
              )}
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">{widget.title}</h3>
              <Link to="/clients" className="btn-link text-sm">
                View Clients →
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.slice(0, 4).map((act) => (
                  <div key={act._id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md bg-white">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-gray-700 text-sm">{getActivityIcon(act.type)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900 capitalize">{act.type}</div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          act.priority === 'high' ? 'bg-red-100 text-red-800' : act.priority === 'low' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {act.priority}
                        </span>
                        {act.done && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Done</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700">{act.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(act.date).toLocaleDateString()} {act.clientId?.name ? `• ${act.clientId.name}` : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📋</div>
                  <div className="text-gray-500 text-sm">No recent activities</div>
                </div>
              )}
            </div>
          </div>
        );


      default:
        return null;
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-md border border-gray-200 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your clients today</p>
        </div>
      </div>

      {/* Adaptive Widget Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className={`${widget.size === 'large' ? 'lg:col-span-2' : ''}`}
          >
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdaptiveDashboard;
