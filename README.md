# 💼 CRM-Manager : Your Complete Client Relationship Hub

Welcome to **CRM-Manager**, a powerful full-stack CRM system built to help teams manage **clients, activities, tasks, expenses, and invoices** — all in one seamless dashboard.  
With a **Node/Express + MongoDB** backend and a **React + Tailwind CSS** frontend, it’s designed for **performance, clarity, and productivity** 🚀.

---

## 🌟 Features You’ll Love

### 👥 Client Management  
Add, edit, and view client details with quick access to their activities, tasks, and invoices.

### 📅 Activities & Tasks  
Track client activities and manage daily tasks efficiently:
- Create and update tasks  
- Mark completion status  
- View task analytics and stats  

### 💰 Expenses & Invoices  
Simplify your billing process!  
- Record expenses linked to clients  
- Generate professional invoices automatically  
- Mark expenses as invoiced and view them in an interactive table  

### 📊 Reports & Dashboard  
Gain insights into overall business performance with a **Manager Dashboard** featuring key metrics and summaries.  

### 🔐 Authentication & Role-Based Access  
Secure access for different roles (Admin, Manager, Employee) using middleware like `requireAuth` and `checkRole`.

---

## 🛠️ Tech Stack: Built to Impress

### 🔧 Backend  
- **Framework:** Node.js + Express  
- **Database:** MongoDB (Mongoose ODM)  
- **Core Models:** `Client`, `Activity`, `Task`, `Expense`, `Invoice`  
- **Controllers:**  
  - `generateInvoice()` → Creates invoices from uninvoiced expenses  
  - `getClientActivities()` → Fetches client-specific logs  
  - `createTask()` and related task handlers  
- **Routes Examples:**  
  - `/api/invoices` → `invoices.js`  
  - `/api/activities` → `activities.js`  
  - `/api/tasks` → `tasks.js`  

### 💻 Frontend  
- **Framework:** React  
- **Styling:** Tailwind CSS  
- **API Client:** `activitiesAPI`, `invoicesAPI`, `tasksAPI` (in `frontend/src/utils/api.js`)  
- **Key Components:**  
  - `ClientDetails.js` → Tabs for client info, tasks & invoices  
  - `Expenses.js` → Manage expenses & trigger invoice generation  
  - `Tasks.js` → View and update task lists & stats  
  - `ManagerDashboard.js` → Business overview and KPIs  
  - `InvoiceTable.js` → List all invoices dynamically  

---

crm-manager/<br><br>
├── backend/<br>
│   ├── app.js<br>
│   ├── server.js<br>
│   ├── models/<br>
│   │   ├── Client.js<br>
│   │   ├── Activity.js<br>
│   │   ├── Task.js<br>
│   │   ├── Expense.js<br>
│   │   └── Invoice.js<br>
│   ├── controllers/<br>
│   ├── routes/<br>
│   │   ├── invoices.js<br>
│   │   ├── activities.js<br>
│   │   └── tasks.js<br>
│   └── README.md<br>
│<br>
├── frontend/<br>
│   ├── src/<br>
│   │   ├── components/<br>
│   │   ├── pages/<br>
│   │   │   ├── ClientDetails.js<br>
│   │   │   ├── Expenses.js<br>
│   │   │   ├── Tasks.js<br>
│   │   │   ├── ManagerDashboard.js<br>
│   │   │   └── InvoiceTable.js<br>
│   │   └── utils/api.js<br>
│   └── package.json<br>
│<br>
└── README.md<br>

