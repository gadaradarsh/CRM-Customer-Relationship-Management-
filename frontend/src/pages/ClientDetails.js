import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { clientsAPI, activitiesAPI, expensesAPI, invoicesAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ActivityForm from '../components/ActivityForm';
import ClientForm from '../components/ClientForm';
import FeedbackForm from '../components/FeedbackForm';
import ExpenseForm from '../components/ExpenseForm';
import InvoiceTable from '../components/InvoiceTable';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const [client, setClient] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingClient, setEditingClient] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'activities');
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);

  useEffect(() => {
    fetchClientDetails();
    fetchActivities();
    fetchExpenses();
    fetchInvoices();
  }, [id]);

  const fetchClientDetails = async () => {
    try {
      const response = await clientsAPI.getClient(id);
      
      if (response.data.success) {
        setClient(response.data.client);
      } else {
        setError('Client not found');
      }
    } catch (err) {
      setError('Failed to load client details');
      console.error('Client details error:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await activitiesAPI.getClientActivities(id);
      
      if (response.data.success) {
        setActivities(response.data.activities);
      }
    } catch (err) {
      console.error('Activities error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await expensesAPI.getClientExpenses(id);
      
      if (response.data.success) {
        setExpenses(response.data.data);
      }
    } catch (err) {
      console.error('Expenses error:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await invoicesAPI.getClientInvoices(id);
      
      if (response.data.success) {
        setInvoices(response.data.data);
      }
    } catch (err) {
      console.error('Invoices error:', err);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const response = await clientsAPI.updateStatus(id, newStatus);
      
      if (response.data.success) {
        setClient({ ...client, status: newStatus });
        
        // Show feedback form if status is changed to 'won'
        if (newStatus === 'won' && client.status !== 'won') {
          setShowFeedbackForm(true);
        }
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleActivitySuccess = () => {
    setShowActivityForm(false);
    fetchActivities();
  };

  const handleActivityUpdate = async (activityId, updates) => {
    try {
      const response = await activitiesAPI.updateActivity(activityId, updates);
      
      if (response.data.success) {
        setActivities(activities.map(activity => 
          activity._id === activityId 
            ? { ...activity, ...updates }
            : activity
        ));
      }
    } catch (err) {
      console.error('Activity update error:', err);
    }
  };

  const handleActivityDelete = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      const response = await activitiesAPI.deleteActivity(activityId);
      
      if (response.data.success) {
        setActivities(activities.filter(activity => activity._id !== activityId));
      }
    } catch (err) {
      console.error('Activity delete error:', err);
    }
  };

  const handleExpenseSuccess = () => {
    setShowExpenseForm(false);
    setEditingExpense(null);
    fetchExpenses();
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      const response = await expensesAPI.deleteExpense(expenseId);
      
      if (response.data.success) {
        fetchExpenses();
      }
    } catch (err) {
      console.error('Expense delete error:', err);
    }
  };

  const handleInvoiceGenerated = (invoice) => {
    fetchInvoices();
    // Redirect to bill page
    navigate(`/bill/${invoice._id}`);
  };


  const handleGenerateInvoiceFromSelected = async () => {
    try {
      if (selectedExpenses.length === 0) {
        alert('Please select expenses to include in invoice');
        return;
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

      const requestData = {
        dueDate: dueDate.toISOString().split('T')[0],
        notes: `Invoice generated from ${selectedExpenses.length} selected expenses`,
        selectedExpenseIds: selectedExpenses // Pass the selected expense IDs
      };

      console.log('Sending selected expenses invoice generation request...');
      const response = await invoicesAPI.generateInvoice(client._id, requestData);
      console.log('Selected expenses invoice generation response:', response);

      if (response.data.success) {
        console.log('Selected expenses invoice generated successfully, redirecting...');
        // Show success message
        alert('Invoice generated successfully! Redirecting to bill page...');
        // Clear selection
        setSelectedExpenses([]);
        // Refresh expenses and invoices
        await fetchExpenses();
        await fetchInvoices();
        // Redirect to bill page
        navigate(`/bill/${response.data.data._id}`);
      } else {
        console.error('Selected expenses invoice generation failed:', response.data.message);
        alert(`Invoice generation failed: ${response.data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('=== FRONTEND SELECTED EXPENSES INVOICE GENERATION ERROR ===');
      console.error('Error object:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      alert(`Failed to generate invoice: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleExpenseSelection = (expenseId, isSelected) => {
    if (isSelected) {
      setSelectedExpenses([...selectedExpenses, expenseId]);
    } else {
      setSelectedExpenses(selectedExpenses.filter(id => id !== expenseId));
    }
  };

  const handleSelectAllExpenses = () => {
    const uninvoicedExpenses = expenses.filter(exp => !exp.isInvoiced);
    setSelectedExpenses(uninvoicedExpenses.map(exp => exp._id));
  };

  const handleDeselectAllExpenses = () => {
    setSelectedExpenses([]);
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

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner text="Loading client details..." />;
  }

  if (error || !client) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Client not found'}</div>
        <button
          onClick={() => navigate('/clients')}
          className="btn-primary"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600 mt-1">{client.company}</p>
            <div className="flex items-center space-x-4 mt-3">
              <span className={`status-badge ${getStatusColor(client.status)}`}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500">
                Rs {client.estimatedValue?.toLocaleString() || 0} estimated value
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setEditingClient(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <span>✏️</span>
              <span>Edit Client</span>
            </button>
            <button
              onClick={() => setShowActivityForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <span>+</span>
              <span>Add Activity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Client Basic Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Client Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{client.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-sm text-gray-900">{client.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={client.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className={`status-badge ${getStatusColor(client.status)} border-0 bg-transparent w-full`}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value</label>
                <p className="text-lg font-semibold text-gray-900">Rs {client.estimatedValue?.toLocaleString() || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <p className="text-sm text-gray-900">{client.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                <p className="text-sm text-gray-900">{client.createdBy?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Contact</label>
                <p className="text-sm text-gray-900">
                  {new Date(client.lastContactDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {client.notes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{client.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Tabs for Activities, Expenses, Invoices */}
        <div className="lg:col-span-2">

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'activities', name: 'Activities', icon: '📋' },
                  { id: 'expenses', name: 'Expenses', icon: '💰' },
                  { id: 'invoices', name: 'Invoices', icon: '🧾' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-6">

              {/* Tab Content */}
              {activeTab === 'activities' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
                    <button
                      onClick={() => setShowActivityForm(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <span>+</span>
                      <span>Add Activity</span>
                    </button>
                  </div>
                
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-medium text-gray-900 capitalize">{activity.type}</h3>
                                <span className={`status-badge ${getPriorityColor(activity.priority)}`}>
                                  {activity.priority}
                                </span>
                                {activity.done && (
                                  <span className="status-badge bg-green-100 text-green-800">
                                    ✓ Done
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(activity.date).toLocaleDateString()} • 
                                Created by {activity.createdBy?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleActivityUpdate(activity._id, { done: !activity.done })}
                              className={`text-xs px-2 py-1 rounded ${
                                activity.done 
                                  ? 'bg-gray-100 text-gray-600' 
                                  : 'bg-green-100 text-green-600'
                              }`}
                            >
                              {activity.done ? 'Mark Undone' : 'Mark Done'}
                            </button>
                            <button
                              onClick={() => handleActivityDelete(activity._id)}
                              className="text-xs px-2 py-1 rounded bg-red-100 text-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No activities yet. Add one to get started.
                  </div>
                )}
              </div>
            )}

              {activeTab === 'expenses' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
                    <div className="flex space-x-3">
                      {selectedExpenses.length > 0 && (
                        <button
                          onClick={() => handleGenerateInvoiceFromSelected()}
                          className="btn-secondary flex items-center space-x-2"
                        >
                          <span>🧾</span>
                          <span>Generate Invoice ({selectedExpenses.length})</span>
                        </button>
                      )}
                      {user?.role === 'employee' && (
                        <button
                          onClick={() => setShowExpenseForm(true)}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <span>+</span>
                          <span>Add Expense</span>
                        </button>
                      )}
                    </div>
                  </div>

                
                {expenses.length > 0 ? (
                  <div>
                    {/* Selection Controls */}
                    {expenses.filter(exp => !exp.isInvoiced).length > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={handleSelectAllExpenses}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Select All Uninvoiced
                            </button>
                            <button
                              onClick={handleDeselectAllExpenses}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              Deselect All
                            </button>
                            <span className="text-sm text-gray-600">
                              {selectedExpenses.length} selected
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      {expenses.map((expense) => (
                        <div key={expense._id} className={`border rounded-lg p-4 ${
                          selectedExpenses.includes(expense._id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              {!expense.isInvoiced && (
                                <input
                                  type="checkbox"
                                  checked={selectedExpenses.includes(expense._id)}
                                  onChange={(e) => handleExpenseSelection(expense._id, e.target.checked)}
                                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-medium text-gray-900">{expense.description}</h3>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {expense.category}
                                  </span>
                                  {expense.isInvoiced && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                      ✓ Invoiced
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                                  <div>
                                    <span className="font-medium">Amount:</span>
                                    <div className="text-lg font-bold text-green-600">
                                      Rs {expense.amount.toFixed(2)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Date:</span>
                                    <div>{new Date(expense.date).toLocaleDateString()}</div>
                                  </div>
                                  <div>
                                    <span className="font-medium">Created by:</span>
                                    <div>{expense.createdBy?.name}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-600"
                                disabled={expense.isInvoiced}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense._id)}
                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-600"
                                disabled={expense.isInvoiced}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No expenses yet. Add one to get started.
                  </div>
                )}
              </div>
            )}

              {activeTab === 'invoices' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
                  </div>
                  <InvoiceTable 
                    clientId={client._id} 
                    clientName={client.name}
                    onGenerateInvoice={handleInvoiceGenerated}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Form Modal */}
      {showActivityForm && (
        <ActivityForm
          clientId={id}
          onClose={() => setShowActivityForm(false)}
          onSuccess={handleActivitySuccess}
        />
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <ClientForm
          client={client}
          onClose={() => setEditingClient(false)}
          onSuccess={(updatedClient) => {
            setEditingClient(false);
            setClient(updatedClient);
          }}
        />
      )}

      {/* Feedback Form Modal */}
      {showFeedbackForm && (
        <FeedbackForm
          clientId={client._id}
          clientName={client.name}
          onClose={() => setShowFeedbackForm(false)}
          onSuccess={() => {
            setShowFeedbackForm(false);
            // Optionally refresh client data to show updated feedback info
            fetchClientDetails();
          }}
        />
      )}

      {/* Expense Form Modal (employees only) */}
      {showExpenseForm && user?.role === 'employee' && (
        <ExpenseForm
          clientId={client._id}
          clientName={client.name}
          expense={editingExpense}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          onSuccess={handleExpenseSuccess}
        />
      )}
    </div>
  );
};

export default ClientDetails;
