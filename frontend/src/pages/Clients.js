import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clientsAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ClientForm from '../components/ClientForm';

const Clients = () => {
  const { user } = useUser();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    assignedTo: '',
    search: ''
  });
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchClients();
    if (user?.role === 'manager') {
      fetchEmployees();
    }
  }, [user, filters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getClients(filters);
      
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (err) {
      setError('Failed to load clients');
      console.error('Clients error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      // This would typically be a separate API endpoint
      // For now, we'll extract unique employees from clients
      const uniqueEmployees = [...new Set(clients.map(client => 
        client.assignedTo ? client.assignedTo._id : null
      ))].filter(Boolean);
      
      setEmployees(uniqueEmployees);
    } catch (err) {
      console.error('Employees error:', err);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleStatusUpdate = async (clientId, newStatus) => {
    try {
      const response = await clientsAPI.updateStatus(clientId, newStatus);
      
      if (response.data.success) {
        setClients(clients.map(client => 
          client._id === clientId 
            ? { ...client, status: newStatus }
            : client
        ));
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      const response = await clientsAPI.deleteClient(clientId);
      
      if (response.data.success) {
        setClients(clients.filter(client => client._id !== clientId));
      }
    } catch (err) {
      console.error('Delete error:', err);
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

  if (loading) {
    return <LoadingSpinner text="Loading clients..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-md border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Clients
            </h1>
            <p className="text-gray-500 mt-1">Manage your client relationships and track progress</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Search Bar (managers only) */}
          {user?.role === 'manager' && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search clients by name, company, or email..."
                className="input-field pl-10 text-sm"
              />
            </div>
          )}
          
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input-field text-sm"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            
            {user?.role === 'manager' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned To
                </label>
                <select
                  name="assignedTo"
                  value={filters.assignedTo}
                  onChange={handleFilterChange}
                  className="input-field text-sm"
                >
                  <option value="">All Employees</option>
                  {employees.map(empId => {
                    const emp = clients.find(c => c.assignedTo?._id === empId)?.assignedTo;
                    return emp ? (
                      <option key={empId} value={empId}>
                        {emp.name}
                      </option>
                    ) : null;
                  })}
                </select>
              </div>
            )}
            
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', assignedTo: '', search: '' })}
                className="btn-link w-full text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Clients Grid */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-6">
        {clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div key={client._id} className="bg-white border border-gray-200 rounded-md p-6 hover:shadow-sm hover:border-blue-300 transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{client.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {client.company}
                    </p>
                    <p className="text-xs text-gray-500">
                      {client.email}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/clients/${client._id}`}
                      className="btn-link text-sm font-medium"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteClient(client._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <select
                      value={client.status}
                      onChange={(e) => handleStatusUpdate(client._id, e.target.value)}
                      className={`status-badge ${getStatusColor(client.status)} border-0 bg-transparent text-xs`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Value</span>
                    <span className="text-sm font-semibold text-gray-900">
                      Rs {client.estimatedValue?.toLocaleString() || 0}
                    </span>
                  </div>
                  
                  {user?.role === 'manager' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Assigned To</span>
                      <span className="text-sm text-gray-900">
                        {client.assignedTo?.name || 'Unassigned'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">👥</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first client</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              Add Your First Client
            </button>
          </div>
        )}
      </div>

      {/* Client Form Modal */}
      {showForm && (
        <ClientForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchClients();
          }}
        />
      )}
    </div>
  );
};

export default Clients;
