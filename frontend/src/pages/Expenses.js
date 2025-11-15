import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { expensesAPI, clientsAPI, invoicesAPI } from '../utils/api';
import { useUser } from '../context/UserContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Expenses = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grouped'
  const [filters, setFilters] = useState({
    client: '',
    category: '',
    dateRange: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchClients();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // Use different API based on user role
      let response;
      if (user?.role === 'manager') {
        // Managers can see all expenses
        response = await expensesAPI.getAllExpenses(filters);
      } else {
        // Employees see only stats (for now)
        response = await expensesAPI.getExpenseStats();
      }
      
      if (response.data.success) {
        if (user?.role === 'manager') {
          setExpenses(response.data.expenses || []);
        } else {
          // For employees, we'll need to implement a different approach
          setExpenses([]);
        }
      }
    } catch (err) {
      setError('Failed to load expenses');
      console.error('Expenses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientsAPI.getClients();
      if (response.data.success) {
        setClients(response.data.clients);
      }
    } catch (err) {
      console.error('Clients error:', err);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleExpenseSelection = (expenseId, isSelected) => {
    if (isSelected) {
      setSelectedExpenses([...selectedExpenses, expenseId]);
    } else {
      setSelectedExpenses(selectedExpenses.filter(id => id !== expenseId));
    }
  };

  const handleSelectAll = () => {
    const allExpenseIds = expenses.map(exp => exp._id);
    setSelectedExpenses(allExpenseIds);
  };

  const handleDeselectAll = () => {
    setSelectedExpenses([]);
  };

  const handleGenerateInvoice = async () => {
    if (selectedExpenses.length === 0) {
      alert('Please select at least one expense to generate an invoice.');
      return;
    }

    try {
      setGeneratingInvoice(true);
      
      // Get the selected expenses
      const selectedExpenseData = expenses.filter(exp => selectedExpenses.includes(exp._id));
      
      // Group expenses by client
      const expensesByClient = selectedExpenseData.reduce((acc, expense) => {
        const clientId = expense.clientId._id;
        if (!acc[clientId]) {
          acc[clientId] = {
            client: expense.clientId,
            expenses: []
          };
        }
        acc[clientId].expenses.push(expense);
        return acc;
      }, {});

      // For now, we'll handle the first client (you can enhance this to handle multiple clients)
      const clientId = Object.keys(expensesByClient)[0];
      const clientData = expensesByClient[clientId];
      
      if (!clientId) {
        alert('No valid client found for selected expenses.');
        return;
      }

      // Prepare invoice data
      const invoiceData = {
        selectedExpenseIds: clientData.expenses.map(exp => exp._id),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        notes: `Invoice for ${clientData.expenses.length} expense(s) - Generated on ${new Date().toLocaleDateString()}`
      };

      // Generate invoice
      const response = await invoicesAPI.generateInvoice(clientId, invoiceData);
      
      if (response.data.success) {
        // Clear selected expenses
        setSelectedExpenses([]);
        
        // Show success message and redirect to client details page with invoices tab
        alert('Invoice generated successfully!');
        navigate(`/clients/${clientId}?tab=invoices`);
      } else {
        alert('Failed to generate invoice: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Invoice generation error:', err);
      alert('Failed to generate invoice: ' + (err.response?.data?.message || err.message));
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      travel: 'bg-blue-100 text-blue-800',
      meals: 'bg-green-100 text-green-800',
      supplies: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
      'Consulting': 'bg-purple-100 text-purple-800',
      'Hosting': 'bg-indigo-100 text-indigo-800',
      'Maintenance': 'bg-orange-100 text-orange-800',
      'Development': 'bg-teal-100 text-teal-800',
      'Design': 'bg-pink-100 text-pink-800',
      'Marketing': 'bg-cyan-100 text-cyan-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const groupExpensesByClient = () => {
    const grouped = expenses.reduce((acc, expense) => {
      const clientId = expense.clientId?._id || 'unknown';
      const clientName = expense.clientId?.name || 'Unknown Client';
      
      if (!acc[clientId]) {
        acc[clientId] = {
          client: {
            _id: clientId,
            name: clientName,
            company: expense.clientId?.company || ''
          },
          categories: {},
          totalAmount: 0,
          expenseCount: 0
        };
      }
      
      const category = expense.category || 'Other';
      if (!acc[clientId].categories[category]) {
        acc[clientId].categories[category] = {
          expenses: [],
          totalAmount: 0,
          count: 0
        };
      }
      
      acc[clientId].categories[category].expenses.push(expense);
      acc[clientId].categories[category].totalAmount += expense.amount;
      acc[clientId].categories[category].count += 1;
      
      acc[clientId].totalAmount += expense.amount;
      acc[clientId].expenseCount += 1;
      
      return acc;
    }, {});
    
    return Object.values(grouped);
  };

  if (loading) {
    return <LoadingSpinner text="Loading expenses..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchExpenses}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600 mt-1">Track and manage business expenses</p>
          </div>
          <div className="flex items-center space-x-4">
            {user?.role === 'manager' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📊 Table View
                </button>
                <button
                  onClick={() => setViewMode('grouped')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'grouped' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📁 Grouped by Client
                </button>
              </div>
            )}
            {user?.role === 'employee' && (
              <button className="btn-primary flex items-center space-x-2 px-6 py-3 text-sm font-semibold">
                <span>+</span>
                <span>Add Expense</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <select
              name="client"
              value={filters.client}
              onChange={handleFilterChange}
              className="input-field text-sm"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="input-field text-sm"
            >
              <option value="">All Categories</option>
              <option value="travel">Travel</option>
              <option value="meals">Meals</option>
              <option value="supplies">Supplies</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              name="dateRange"
              value={filters.dateRange}
              onChange={handleFilterChange}
              className="input-field text-sm"
            >
              <option value="">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ client: '', category: '', dateRange: '' })}
              className="btn-secondary w-full text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Expenses Content */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">All Expenses</h2>
              {expenses.length > 0 && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Deselect All
                  </button>
                  <span className="text-sm text-gray-600">
                    {selectedExpenses.length} selected
                  </span>
                </div>
              )}
            </div>
          </div>
        
        {expenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.length === expenses.length}
                      onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedExpenses.includes(expense._id)}
                        onChange={(e) => handleExpenseSelection(expense._id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.clientId?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.createdBy?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Rs {expense.amount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        expense.isInvoiced ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {expense.isInvoiced ? 'Invoiced' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-4">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-400">💰</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-500 mb-6">Start tracking your business expenses</p>
            {user?.role === 'employee' && (
              <button className="btn-primary">
                Add Your First Expense
              </button>
            )}
          </div>
        )}
        </div>
      ) : (
        /* Grouped View */
        <div className="space-y-6">
          {groupExpensesByClient().map((clientGroup) => (
            <div key={clientGroup.client._id} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{clientGroup.client.name}</h3>
                    <p className="text-sm text-gray-600">{clientGroup.client.company}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      Rs {clientGroup.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {clientGroup.expenseCount} expense{clientGroup.expenseCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {Object.entries(clientGroup.categories).map(([category, categoryData]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                            {category}
                          </span>
                          <span className="text-sm text-gray-600">
                            {categoryData.count} expense{categoryData.count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          Rs {categoryData.totalAmount.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {categoryData.expenses.map((expense) => (
                          <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                              <input
                                type="checkbox"
                                checked={selectedExpenses.includes(expense._id)}
                                onChange={(e) => handleExpenseSelection(expense._id, e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <div>
                                <div className="font-medium text-gray-900">{expense.description}</div>
                                <div className="text-sm text-gray-600">
                                  {expense.createdBy?.name || 'N/A'} • {new Date(expense.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <div className="font-semibold text-gray-900">Rs {expense.amount.toFixed(2)}</div>
                                <div className="text-sm text-gray-600">
                                  {expense.isInvoiced ? (
                                    <span className="text-green-600">Invoiced</span>
                                  ) : (
                                    <span className="text-yellow-600">Pending</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {expenses.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">💰</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
              <p className="text-gray-500 mb-6">Start tracking your business expenses</p>
              {user?.role === 'employee' && (
                <button className="btn-primary">
                  Add Your First Expense
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedExpenses.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedExpenses.length} expenses selected
            </span>
            <button 
              onClick={handleGenerateInvoice}
              disabled={generatingInvoice}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingInvoice ? 'Generating...' : 'Generate Invoice'}
            </button>
            <button
              onClick={handleDeselectAll}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
