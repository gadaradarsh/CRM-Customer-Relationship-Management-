import React, { useState, useEffect } from 'react';
import { clientsAPI, usersAPI } from '../utils/api';
import { useUser } from '../context/UserContext';

const ClientForm = ({ onClose, onSuccess, client = null }) => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
    estimatedValue: '',
    assignedTo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        notes: client.notes || '',
        estimatedValue: client.estimatedValue || '',
        assignedTo: client.assignedTo?._id || ''
      });
    }
    
    // Fetch employees if user is manager
    if (user?.role === 'manager') {
      fetchEmployees();
    }
  }, [client, user]);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await usersAPI.getEmployees();
      if (response.data.success) {
        setEmployees(response.data.employees || []);
      } else {
        console.error('Failed to fetch employees:', response.data.message);
        setEmployees([]);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (formData.phone.trim().length < 10) {
      errors.phone = 'Phone must be at least 10 characters';
    }
    
    if (!formData.company.trim()) {
      errors.company = 'Company is required';
    } else if (formData.company.trim().length < 2) {
      errors.company = 'Company must be at least 2 characters';
    }
    
    if (formData.estimatedValue && isNaN(parseFloat(formData.estimatedValue))) {
      errors.estimatedValue = 'Estimated value must be a number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate form before submitting
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Prepare data with proper validation
      const data = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        notes: formData.notes.trim(),
        estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : 0
      };

      // Add assignedTo only if it's provided and user is manager
      if (user?.role === 'manager' && formData.assignedTo) {
        data.assignedTo = formData.assignedTo.trim();
      }

      let response;
      if (client) {
        response = await clientsAPI.updateClient(client._id, data);
      } else {
        response = await clientsAPI.createClient(data);
      }

      if (response.data.success) {
        onSuccess(response.data.client);
      } else {
        setError(response.data.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Client creation error:', err);
      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        const validationErrors = err.response.data.errors.map(error => error.msg).join(', ');
        setError(validationErrors);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('Please log in to create a client');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to create clients');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-100">
              {client ? 'Edit Client' : 'Add New Client'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`input-field ${validationErrors.name ? 'border-red-500' : ''}`}
                placeholder="Client name"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`input-field ${validationErrors.email ? 'border-red-500' : ''}`}
                placeholder="client@company.com"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className={`input-field ${validationErrors.phone ? 'border-red-500' : ''}`}
                placeholder="+1 (555) 123-4567"
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Company *
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                className={`input-field ${validationErrors.company ? 'border-red-500' : ''}`}
                placeholder="Company name"
              />
              {validationErrors.company && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.company}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Estimated Value
              </label>
              <input
                type="number"
                name="estimatedValue"
                value={formData.estimatedValue}
                onChange={handleChange}
                className={`input-field ${validationErrors.estimatedValue ? 'border-red-500' : ''}`}
                placeholder="0"
                min="0"
                step="0.01"
              />
              {validationErrors.estimatedValue && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.estimatedValue}</p>
              )}
            </div>

            {user?.role === 'manager' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Assign To Employee
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className={`input-field ${validationErrors.assignedTo ? 'border-red-500' : ''}`}
                  disabled={loadingEmployees}
                >
                  <option value="">Select an employee (optional)</option>
                  {employees.length > 0 ? (
                    employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name} ({employee.email})
                      </option>
                    ))
                  ) : (
                    !loadingEmployees && <option value="" disabled>No employees found</option>
                  )}
                </select>
                {loadingEmployees && (
                  <p className="text-xs text-gray-400 mt-1">Loading employees...</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Leave empty to assign to yourself
                </p>
                {validationErrors.assignedTo && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.assignedTo}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input-field"
                placeholder="Additional notes about the client..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (client ? 'Update Client' : 'Create Client')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
