const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Client = require('../models/Client');
const PDFDocument = require('pdfkit');

// Generate invoice for a client
const generateInvoice = async (req, res) => {
  try {
    console.log('=== INVOICE GENERATION START ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Session user:', req.session.user);

    const { clientId } = req.params;
    const { dueDate, notes, selectedExpenseIds } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    // Validate required fields
    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required'
      });
    }

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check user permissions
    if (userRole === 'employee' && client.assignedTo && client.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only generate invoices for your assigned clients.'
      });
    }

    // Get uninvoiced expenses
    console.log('=== DEBUGGING EXPENSE QUERY ===');
    console.log('Client ID:', clientId);
    console.log('Client ID type:', typeof clientId);
    
    // First, let's see ALL expenses for this client
    const allExpenses = await Expense.find({ clientId });
    console.log('Total expenses for client:', allExpenses.length);
    console.log('All expenses:', allExpenses.map(exp => ({
      id: exp._id,
      description: exp.description,
      amount: exp.amount,
      isInvoiced: exp.isInvoiced,
      invoiceId: exp.invoiceId
    })));
    
    // Now get expenses for invoice generation
    let query = {
      clientId
    };
    
    // If specific expenses are selected, filter by those IDs
    if (selectedExpenseIds && selectedExpenseIds.length > 0) {
      console.log('Selected expense IDs:', selectedExpenseIds);
      query._id = { $in: selectedExpenseIds };
    } else {
      // If no specific expenses selected, only get uninvoiced ones
      query.isInvoiced = false;
    }
    
    const uninvoicedExpenses = await Expense.find(query).sort({ date: 1 });

    console.log('Found uninvoiced expenses:', uninvoicedExpenses.length);
    console.log('Uninvoiced expenses:', uninvoicedExpenses.map(exp => ({
      id: exp._id,
      description: exp.description,
      amount: exp.amount,
      isInvoiced: exp.isInvoiced
    })));

    if (uninvoicedExpenses.length === 0) {
      console.log('No uninvoiced expenses found - returning error response');
      return res.status(400).json({
        success: false,
        message: 'No uninvoiced expenses found for this client. All expenses have already been invoiced.'
      });
    }

    // Calculate total amount
    const totalAmount = uninvoicedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    console.log('Total amount:', totalAmount);

    // Generate invoice number
    let invoiceNumber;
    try {
      const count = await Invoice.countDocuments();
      invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;
      console.log('Generated invoice number:', invoiceNumber);
    } catch (error) {
      console.error('Error counting invoices:', error);
      // Fallback to timestamp-based number
      invoiceNumber = `INV-${Date.now()}`;
      console.log('Using fallback invoice number:', invoiceNumber);
    }

    // Ensure invoice number is set
    if (!invoiceNumber) {
      invoiceNumber = `INV-${Date.now()}`;
      console.log('Using emergency fallback invoice number:', invoiceNumber);
    }

    // Create invoice
    const invoiceData = {
      invoiceNumber,
      clientId,
      expenses: uninvoicedExpenses.map(expense => expense._id),
      totalAmount,
      dueDate: new Date(dueDate),
      notes: notes || '',
      createdBy: userId
    };

    console.log('Creating invoice with data:', invoiceData);
    const invoice = new Invoice(invoiceData);
    console.log('Invoice object created with number:', invoice.invoiceNumber);
    console.log('Invoice object validation:', invoice.validateSync());

    console.log('Saving invoice...');
    console.log('Invoice number before save:', invoice.invoiceNumber);
    
    // Validate the invoice before saving
    const validationError = invoice.validateSync();
    if (validationError) {
      console.error('Invoice validation failed:', validationError);
      throw validationError;
    }
    
    await invoice.save();
    console.log('Invoice saved with ID:', invoice._id);

    // Mark expenses as invoiced
    console.log('Marking expenses as invoiced...');
    await Expense.updateMany(
      { _id: { $in: uninvoicedExpenses.map(expense => expense._id) } },
      { $set: { isInvoiced: true, invoiceId: invoice._id } }
    );

    // Populate invoice data
    try {
      console.log('Populating invoice data...');
      await invoice.populate([
        { path: 'clientId', select: 'name company email phone' },
        { path: 'expenses', select: 'description category amount date' },
        { path: 'createdBy', select: 'name email' }
      ]);
      console.log('Invoice populated successfully');
    } catch (populateError) {
      console.error('Error populating invoice:', populateError);
      // Continue without population - the invoice is still valid
    }

    console.log('=== INVOICE GENERATION SUCCESS ===');
    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });

  } catch (error) {
    console.error('=== INVOICE GENERATION ERROR ===');
    console.error('Error:', error);
    console.error('Error stack:', error.stack);
    
    // Check if response was already sent
    if (res.headersSent) {
      console.error('Response already sent, cannot send error response');
      return;
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all invoices for a client
const getClientInvoices = async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check permissions
    if (userRole === 'employee' && client.assignedTo && client.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const invoices = await Invoice.find({ clientId })
      .populate('clientId', 'name company email phone')
      .populate('createdBy', 'name email')
      .sort({ issueDate: -1 });

    res.json({
      success: true,
      data: invoices
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single invoice
const getInvoice = async (req, res) => {
  try {
    console.log('=== GET INVOICE DEBUG ===');
    const { id } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    console.log('Invoice ID:', id);
    console.log('User ID:', userId);
    console.log('User Role:', userRole);

    const invoice = await Invoice.findById(id)
      .populate('clientId', 'name company email phone')
      .populate('createdBy', 'name email')
      .populate('expenses', 'description category amount date');

    console.log('Found invoice:', invoice ? 'Yes' : 'No');
    if (invoice) {
      console.log('Invoice details:', {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        expenses: invoice.expenses,
        totalAmount: invoice.totalAmount
      });
    }

    if (!invoice) {
      console.log('Invoice not found, returning 404');
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check permissions
    if (userRole === 'employee' && invoice.clientId.assignedTo && invoice.clientId.assignedTo.toString() !== userId) {
      console.log('Access denied for employee');
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('Returning invoice data');
    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update invoice status
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    if (!['draft', 'sent', 'paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const invoice = await Invoice.findById(id).populate('clientId');
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check permissions
    if (userRole === 'employee' && invoice.clientId.assignedTo && invoice.clientId.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    invoice.status = status;
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice status updated successfully',
      data: invoice
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete invoice
const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const invoice = await Invoice.findById(id).populate('clientId');
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check permissions
    if (userRole === 'employee' && invoice.clientId.assignedTo && invoice.clientId.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft invoices can be deleted'
      });
    }

    // Unmark expenses as invoiced
    await Expense.updateMany(
      { _id: { $in: invoice.expenses } },
      { $set: { isInvoiced: false, invoiceId: null } }
    );

    await Invoice.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Test endpoint to check expenses for a client
const testExpenses = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    console.log('=== TESTING EXPENSES FOR CLIENT ===');
    console.log('Client ID:', clientId);
    
    const allExpenses = await Expense.find({ clientId });
    const uninvoicedExpenses = await Expense.find({ clientId, isInvoiced: false });
    
    res.json({
      success: true,
      data: {
        clientId,
        totalExpenses: allExpenses.length,
        uninvoicedExpenses: uninvoicedExpenses.length,
        allExpenses: allExpenses.map(exp => ({
          id: exp._id,
          description: exp.description,
          amount: exp.amount,
          isInvoiced: exp.isInvoiced,
          invoiceId: exp.invoiceId,
          date: exp.date
        })),
        uninvoicedExpenses: uninvoicedExpenses.map(exp => ({
          id: exp._id,
          description: exp.description,
          amount: exp.amount,
          isInvoiced: exp.isInvoiced,
          date: exp.date
        }))
      }
    });
  } catch (error) {
    console.error('Test expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Download invoice as PDF
const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    const invoice = await Invoice.findById(id)
      .populate('clientId', 'name company email phone')
      .populate('createdBy', 'name email')
      .populate('expenses', 'description category amount date');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check permissions
    if (userRole === 'employee' && invoice.clientId.assignedTo && invoice.clientId.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(24).text('INVOICE', 50, 50);
    doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`, 400, 50);
    doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 400, 70);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 90);

    // Company info
    doc.fontSize(16).text('CRM System', 50, 120);
    doc.fontSize(12).text('123 Business Street', 50, 140);
    doc.text('Business City, BC 12345', 50, 155);
    doc.text('contact@crmsystem.com', 50, 170);

    // Client info
    doc.fontSize(14).text('Bill To:', 50, 220);
    doc.fontSize(12).text(invoice.clientId.name, 50, 240);
    if (invoice.clientId.company) {
      doc.text(invoice.clientId.company, 50, 255);
    }
    if (invoice.clientId.email) {
      doc.text(invoice.clientId.email, 50, 270);
    }
    if (invoice.clientId.phone) {
      doc.text(invoice.clientId.phone, 50, 285);
    }

    // Items table
    let yPosition = 350;
    doc.fontSize(12).text('Description', 50, yPosition);
    doc.text('Category', 250, yPosition);
    doc.text('Amount', 400, yPosition);
    doc.text('Date', 500, yPosition);
    
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    // Invoice items
    invoice.expenses.forEach((expense) => {
      yPosition += 20;
      doc.text(expense.description, 50, yPosition);
      doc.text(expense.category, 250, yPosition);
      doc.text(`Rs ${expense.amount.toFixed(2)}`, 400, yPosition);
      doc.text(new Date(expense.date).toLocaleDateString(), 500, yPosition);
    });

    // Total
    yPosition += 40;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 20;
    doc.fontSize(14).text(`Total: Rs ${invoice.totalAmount.toFixed(2)}`, 400, yPosition);

    // Notes
    if (invoice.notes) {
      yPosition += 40;
      doc.fontSize(12).text('Notes:', 50, yPosition);
      doc.text(invoice.notes, 50, yPosition + 20);
    }

    // Footer
    yPosition += 60;
    doc.fontSize(10).text('Thank you for your business!', 50, yPosition);

    doc.end();

  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Reset invoiced expenses for a client (for testing purposes)
const resetInvoicedExpenses = async (req, res) => {
  try {
    const { clientId } = req.params;
    const userId = req.session.user._id;
    const userRole = req.session.user.role;

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check user permissions
    if (userRole === 'employee' && client.assignedTo && client.assignedTo.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only reset expenses for your assigned clients.'
      });
    }

    // Find all invoiced expenses for this client
    const invoicedExpenses = await Expense.find({ 
      clientId, 
      isInvoiced: true 
    });

    if (invoicedExpenses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No invoiced expenses found for this client'
      });
    }

    // Reset expenses to uninvoiced
    await Expense.updateMany(
      { clientId, isInvoiced: true },
      { $set: { isInvoiced: false, invoiceId: null } }
    );

    // Delete associated invoices (optional - you might want to keep them for audit)
    const invoiceIds = [...new Set(invoicedExpenses.map(exp => exp.invoiceId).filter(id => id))];
    if (invoiceIds.length > 0) {
      await Invoice.deleteMany({ _id: { $in: invoiceIds } });
    }

    res.json({
      success: true,
      message: `Successfully reset ${invoicedExpenses.length} expenses to uninvoiced status`,
      data: {
        resetCount: invoicedExpenses.length,
        deletedInvoices: invoiceIds.length
      }
    });

  } catch (error) {
    console.error('Reset invoiced expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  generateInvoice,
  getClientInvoices,
  getInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  downloadInvoice,
  testExpenses,
  resetInvoicedExpenses
};