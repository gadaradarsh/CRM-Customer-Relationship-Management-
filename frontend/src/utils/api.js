import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth headers if needed
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.get('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Clients API
export const clientsAPI = {
  getClients: (params) => api.get('/clients', { params }),
  getClient: (id) => api.get(`/clients/${id}`),
  createClient: (data) => api.post('/clients', data),
  updateClient: (id, data) => api.patch(`/clients/${id}`, data),
  deleteClient: (id) => api.delete(`/clients/${id}`),
  assignClient: (id, assignedTo) => api.patch(`/clients/${id}/assign`, { assignedTo }),
  updateStatus: (id, status) => api.patch(`/clients/${id}/status`, { status }),
};

// Activities API
export const activitiesAPI = {
  getClientActivities: (clientId, params) => api.get(`/activities/client/${clientId}`, { params }),
  getAllActivities: (params) => api.get('/activities/all', { params }),
  createActivity: (clientId, data) => api.post(`/activities/client/${clientId}`, data),
  updateActivity: (id, data) => api.patch(`/activities/${id}`, data),
  deleteActivity: (id) => api.delete(`/activities/${id}`),
};

// Reports API
export const reportsAPI = {
  getSummary: () => api.get('/reports/summary'),
  getEmployeePerformance: () => api.get('/reports/employees'),
  getRevenueReport: (period) => api.get('/reports/revenue', { params: { period } }),
  getActivityReport: (period) => api.get('/reports/activities', { params: { period } }),
  getEmployeeQuickStats: () => api.get('/reports/employee-quick-stats'),
};

// Feedback API
export const feedbackAPI = {
  submitFeedback: (data) => api.post('/feedback/submit', data),
  getClientFeedback: (clientId) => api.get(`/feedback/client/${clientId}`),
  getAllFeedback: (params) => api.get('/feedback', { params }),
  getFeedbackStats: () => api.get('/feedback/stats'),
  updateFeedbackStatus: (id, status) => api.patch(`/feedback/${id}/status`, { status }),
};

// Tasks API
export const tasksAPI = {
  createTask: (data) => api.post('/tasks', data),
  getMyTasks: (params) => api.get('/tasks/my-tasks', { params }),
  updateTaskStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
  getTaskStats: () => api.get('/tasks/stats'),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
};

// Users API (for getting employees)
export const usersAPI = {
  getEmployees: () => api.get('/auth/employees'),
};

// Expenses API
export const expensesAPI = {
  addExpense: (clientId, data) => api.post(`/clients/${clientId}/expenses`, data),
  getClientExpenses: (clientId, params) => api.get(`/clients/${clientId}/expenses`, { params }),
  getAllExpenses: (params) => api.get('/expenses/all', { params }),
  updateExpense: (id, data) => api.patch(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  getExpenseStats: () => api.get('/expenses/stats'),
};

// Invoices API
export const invoicesAPI = {
  generateInvoice: (clientId, data) => api.post(`/clients/${clientId}/invoices/generate`, data),
  getClientInvoices: (clientId, params) => api.get(`/clients/${clientId}/invoices`, { params }),
  getInvoice: (id) => api.get(`/invoices/${id}`),
  updateInvoiceStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
  downloadInvoice: (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  resetInvoicedExpenses: (clientId) => api.post(`/clients/${clientId}/expenses/reset`),
  testExpenses: (clientId) => api.get(`/clients/${clientId}/expenses/test`),
};

export default api;
