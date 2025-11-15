// Debug script to check expenses
const mongoose = require('mongoose');

// Connect to MongoDB (adjust connection string as needed)
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/crm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function debugExpenses() {
  try {
    await connectDB();
    
    // Import models
    const Expense = require('./backend/models/Expense');
    const Client = require('./backend/models/Client');
    
    console.log('=== EXPENSES DEBUG ===');
    
    // Get all expenses
    const allExpenses = await Expense.find({}).populate('clientId', 'name');
    console.log('Total expenses:', allExpenses.length);
    
    // Get uninvoiced expenses
    const uninvoicedExpenses = await Expense.find({ isInvoiced: false }).populate('clientId', 'name');
    console.log('Uninvoiced expenses:', uninvoicedExpenses.length);
    
    // Show details
    console.log('\n=== ALL EXPENSES ===');
    allExpenses.forEach((expense, index) => {
      console.log(`${index + 1}. ${expense.description} - $${expense.amount} - Client: ${expense.clientId?.name} - Invoiced: ${expense.isInvoiced}`);
    });
    
    console.log('\n=== UNINVOICED EXPENSES ===');
    uninvoicedExpenses.forEach((expense, index) => {
      console.log(`${index + 1}. ${expense.description} - $${expense.amount} - Client: ${expense.clientId?.name}`);
    });
    
    // Get clients
    const clients = await Client.find({});
    console.log('\n=== CLIENTS ===');
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.name} - ID: ${client._id}`);
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugExpenses();
