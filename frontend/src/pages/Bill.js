import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoicesAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Bill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    try {
      console.log('Downloading PDF for invoice:', id);
      const response = await invoicesAPI.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download PDF error:', err);
      setError(err.response?.data?.message || 'Failed to download PDF.');
    }
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        console.log('=== BILL PAGE DEBUG ===');
        console.log('Invoice ID:', id);
        setLoading(true);
        
        const response = await invoicesAPI.getInvoice(id);
        console.log('Bill page API response:', response);
        
        if (response.data.success) {
          console.log('Invoice data:', response.data.data);
          setInvoice(response.data.data);
        } else {
          console.error('API returned error:', response.data.message);
          setError(response.data.message || 'Failed to load invoice.');
        }
      } catch (err) {
        console.error('=== BILL PAGE ERROR ===');
        console.error('Error object:', err);
        console.error('Error response:', err.response);
        console.error('Error response data:', err.response?.data);
        setError(err.response?.data?.message || 'An error occurred while fetching the invoice.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Loading invoice..." />;
  }

  if (error) {
    return <div className="text-center text-red-600 py-8">{error}</div>;
  }

  if (!invoice) {
    return <div className="text-center text-gray-500 py-8">Invoice not found.</div>;
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { margin: 0; }
          .min-h-screen { min-height: auto; }
          .bg-white { background: white; }
          .shadow-lg { box-shadow: none; }
        }
      `}</style>
      <div className="max-w-4xl mx-auto bg-white">
        {/* Invoice Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            </div>
            <div className="text-right">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">INVOICE NO:</div>
                <div className="text-lg font-bold text-gray-900">{invoice.invoiceNumber}</div>
                <div className="text-sm text-gray-600">DATE: {new Date(invoice.issueDate).toLocaleDateString('en-GB')}</div>
                <div className="text-sm text-gray-600">DUE DATE: {new Date(invoice.dueDate).toLocaleDateString('en-GB')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Company and Client Info */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">ISSUED TO:</div>
              <div className="text-gray-700">
                <div className="font-semibold text-lg">{invoice.clientId.name}</div>
                {invoice.clientId.company && <div className="text-gray-600">{invoice.clientId.company}</div>}
                {invoice.clientId.email && <div className="text-gray-600">{invoice.clientId.email}</div>}
                {invoice.clientId.phone && <div className="text-gray-600">{invoice.clientId.phone}</div>}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">PAY TO:</div>
              <div className="text-gray-700">
                <div className="font-semibold text-lg">CRM System</div>
                <div className="text-gray-600">Account Name: Invoice Management</div>
                <div className="text-gray-600">Account No.: 0123 4567 8901</div>
                <div className="text-gray-600">contact@crmsystem.com</div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 uppercase tracking-wider">
                    DESCRIPTION
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 uppercase tracking-wider">
                    UNIT PRICE
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900 uppercase tracking-wider">
                    QTY
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900 uppercase tracking-wider">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.expenses.map((expense, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 px-4 text-gray-900">
                      {expense.description}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      Rs {expense.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      1
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-semibold">
                      Rs {expense.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Section */}
        <div className="mb-8">
          <div className="flex justify-end">
            <div className="w-full md:w-1/2 lg:w-1/3">
              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">SUBTOTAL</span>
                  <span className="font-semibold">Rs {invoice.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Tax</span>
                  <span className="font-semibold">0%</span>
                </div>
                <div className="border-t-2 border-gray-300 pt-2">
                  <div className="flex justify-between text-xl font-bold">
                    <span>TOTAL</span>
                    <span>Rs {invoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8">
            <div className="text-sm text-gray-600">
              <strong>Notes:</strong> {invoice.notes}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="no-print bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/clients')}
              className="btn-secondary flex items-center"
            >
              <span className="mr-2">←</span> Back to Clients
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={() => window.print()}
                className="btn-secondary flex items-center"
              >
                <span className="mr-2">🖨️</span> Print
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary flex items-center"
              >
                <span className="mr-2">📄</span> Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bill;