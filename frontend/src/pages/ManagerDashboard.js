import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, expensesAPI, invoicesAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ManagerDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [expenseStats, setExpenseStats] = useState(null);
  const [invoiceStats, setInvoiceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch core dashboard data first
      const [summaryRes, performanceRes] = await Promise.all([
        reportsAPI.getSummary(),
        reportsAPI.getEmployeePerformance()
      ]);

      if (summaryRes.data.success) {
        setSummary(summaryRes.data.summary);
      }

      if (performanceRes.data.success) {
        setPerformance(performanceRes.data.performance);
      }

      // Try to fetch expense and invoice stats (optional)
      // These are new features and might not be available yet
      try {
        const expenseRes = await expensesAPI.getExpenseStats();
        if (expenseRes.data && expenseRes.data.success) {
          setExpenseStats(expenseRes.data.data);
        }
      } catch (expenseErr) {
        console.warn('Expense stats not available:', expenseErr);
        // Set default values
        setExpenseStats({
          totalAmount: 0,
          totalExpenses: 0,
          averageAmount: 0,
          categoryBreakdown: {}
        });
      }

      try {
        const invoiceRes = await invoicesAPI.getInvoiceStats();
        if (invoiceRes.data && invoiceRes.data.success) {
          setInvoiceStats(invoiceRes.data.data);
        }
      } catch (invoiceErr) {
        console.warn('Invoice stats not available:', invoiceErr);
        // Set default values
        setInvoiceStats({
          totalInvoices: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          statusBreakdown: {}
        });
      }

    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchDashboardData}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your CRM system performance</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs {summary.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{summary.conversionRate}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Won Deals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.statusBreakdown.find(s => s._id === 'won')?.count || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Expense Statistics */}
          {expenseStats && expenseStats.totalAmount > 0 && (
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">💸</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rs {expenseStats.totalAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Statistics */}
          {invoiceStats && invoiceStats.unpaidAmount > 0 && (
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">🧾</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unpaid Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Rs {invoiceStats.unpaidAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Employee Performance */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Employee Performance</h2>
          <Link to="/reports" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View Full Report →
          </Link>
        </div>
        
        {performance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Won Clients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performance.map((emp) => (
                  <tr key={emp._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{emp.employeeName}</div>
                        <div className="text-sm text-gray-500">{emp.employeeEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {emp.totalClients}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {emp.wonClients}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {emp.conversionRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rs {emp.totalValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No employee performance data available
          </div>
        )}
      </div>

    </div>
  );
};

export default ManagerDashboard;
