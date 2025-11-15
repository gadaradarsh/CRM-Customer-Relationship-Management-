const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

// Generate invoice for a client
router.post('/clients/:clientId/invoices/generate', invoiceController.generateInvoice);

// Get all invoices for a client
router.get('/clients/:clientId/invoices', invoiceController.getClientInvoices);

// Get single invoice details
router.get('/invoices/:id', invoiceController.getInvoice);

// Update invoice status
router.patch('/invoices/:id/status', invoiceController.updateInvoiceStatus);

// Delete invoice
router.delete('/invoices/:id', invoiceController.deleteInvoice);

// Download invoice as PDF
router.get('/invoices/:id/download', invoiceController.downloadInvoice);

// Test endpoint to check expenses for a client
router.get('/clients/:clientId/expenses/test', invoiceController.testExpenses);

// Reset invoiced expenses for a client (for testing purposes)
router.post('/clients/:clientId/expenses/reset', invoiceController.resetInvoicedExpenses);

module.exports = router;