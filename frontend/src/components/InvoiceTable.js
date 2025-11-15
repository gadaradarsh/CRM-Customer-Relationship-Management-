import React, { useState, useEffect } from 'react';
import { invoicesAPI } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const InvoiceTable = ({ clientId, clientName, onGenerateInvoice }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [generateData, setGenerateData] = useState({ dueDate: '', notes: '' });

  useEffect(() => {
    fetchInvoices();
  }, [clientId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getClientInvoices(clientId);
      if (response.data.success) {
        setInvoices(response.data.data);
      }
    } catch (err) {
      setError('Failed to load invoices');
      console.error('Invoices error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    try {
      const response = await invoicesAPI.generateInvoice(clientId, generateData);
      if (response.data.success) {
        setShowGenerateForm(false);
        setGenerateData({ dueDate: '', notes: '' });
        fetchInvoices();
        if (onGenerateInvoice) {
          onGenerateInvoice(response.data.data);
        }
      } else {
        setError(response.data.message || 'Failed to generate invoice.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while generating invoice.');
      console.error('Generate invoice error:', err);
    }
  };

  const handleUpdateStatus = async (invoiceId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change the status to ${newStatus}?`)) {
      return;
    }
    try {
      const response = await invoicesAPI.updateInvoiceStatus(invoiceId, newStatus);
      if (response.data.success) {
        fetchInvoices();
      } else {
        setError(response.data.message || 'Failed to update invoice status.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating invoice status.');
      console.error('Update status error:', err);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await invoicesAPI.deleteInvoice(invoiceId);
      if (response.data.success) {
        fetchInvoices();
      } else {
        setError(response.data.message || 'Failed to delete invoice.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while deleting invoice.');
      console.error('Delete invoice error:', err);
    }
  };

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      const response = await invoicesAPI.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download PDF.');
      console.error('Download PDF error:', err);
    }
  };

  const getStatusBadge = (status) => {
    let colorClass = '';
    switch (status) {
      case 'draft':
        colorClass = 'bg-gray-100 text-gray-800';
        break;
      case 'sent':
        colorClass = 'bg-blue-100 text-blue-800';
        break;
      case 'paid':
        colorClass = 'bg-green-100 text-green-800';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800';
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>{status.toUpperCase()}</span>;
  };

  if (loading) {
    return <LoadingSpinner text="Loading invoices..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Invoices for {clientName}</h2>
        <button
          onClick={() => setShowGenerateForm(true)}
          className="btn-primary"
        >
          + Generate Invoice
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</div>}

      {showGenerateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Generate New Invoice</h3>
            <form onSubmit={handleGenerateInvoice} className="space-y-4">
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  id="dueDate"
                  className="input-field"
                  value={generateData.dueDate}
                  onChange={(e) => setGenerateData({ ...generateData, dueDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  id="notes"
                  rows="3"
                  className="input-field"
                  value={generateData.notes}
                  onChange={(e) => setGenerateData({ ...generateData, notes: e.target.value })}
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoices.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <button 
                      onClick={() => navigate(`/bill/${invoice._id}`)} 
                      className="text-primary-600 hover:text-primary-900"
                    >
                      {invoice.invoiceNumber}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Rs {invoice.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getStatusBadge(invoice.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleDownloadPdf(invoice._id, invoice.invoiceNumber)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Download PDF"
                      >
                        📄
                      </button>
                      {invoice.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(invoice._id, 'sent')}
                            className="text-blue-600 hover:text-blue-900"
                            title="Mark as Sent"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(invoice._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Draft"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {invoice.status === 'sent' && (
                        <button
                          onClick={() => handleUpdateStatus(invoice._id, 'paid')}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as Paid"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No invoices found for this client.
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;