# APEX WMS - Smart Warehouse Management System

An enterprise-grade, modern, and highly interactive Smart Warehouse Management System (WMS) inspired by Amazon fulfillment center platforms. Features a dark-themed glassmorphism dashboard, real-time Socket.IO synchronizations, JWT role-based access control, and direct Microsoft SQL Server connection pool integration.

## 🚀 Technology Stack
* **Frontend**: React (Vite) + TailwindCSS + Framer Motion + Recharts + Lucide Icons + Socket.IO Client
* **Backend**: Node.js + Express + Socket.IO + JWT Authentication + `mssql` pool driver
* **Database**: Microsoft SQL Server (`SmartWarehouseDB`)

---

## 📂 Project Structure
```
d:\DataBase Project\DB WebSite/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # SQL Server pool connection config
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verify & Role authorization (RBAC)
│   │   │   └── logging.js       # Action & Login Audits
│   │   ├── routes/
│   │   │   ├── auth.js          # Credentials verify & Password migration
│   │   │   ├── admin.js         # KPI stats & analytical trends
│   │   │   ├── inbound.js       # Transactional item receiving & SKUs
│   │   │   ├── inventory.js     # Move stock, heatmaps & paginated items
│   │   │   ├── outbound.js      # Picking checklists, packing, dispatch
│   │   │   ├── network.js       # Group city delivery batches
│   │   │   └── reports.js       # Exportable aggregates using SQL views
│   │   ├── socket/
│   │   │   └── socketHandler.js # Socket.IO namespace presence routing
│   │   └── server.js            # Server entry
│   ├── .env
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/          # Sidebar, Header, ProtectedRoute
    │   ├── context/             # AuthContext & SocketContext
    │   ├── pages/               # Login, Dash, Inbound, Inventory, Outbound, Network, Reports
    │   ├── App.jsx              # Role-guarded paths mapping
    │   └── index.css            # Tailwind directives & glassmorphic tokens
    ├── tailwind.config.js
    └── package.json
```

---

## ⚡ Setup & Launch Instructions

### 1. Database Setup
The system is pre-configured to connect to Microsoft SQL Server `SmartWarehouseDB` on `localhost`. 
* By default, it uses **Windows Integrated Authentication** (no username/password required).
* If SQL Server authentication is active, configure your credentials in `backend/.env`.

### 2. Launch Backend
```bash
cd backend
npm run dev
```
Runs the backend API server on [http://localhost:5000](http://localhost:5000) and starts the Socket.IO service.

### 3. Launch Frontend
```bash
cd frontend
npm run dev
```
Runs the Vite development server on [http://localhost:5173](http://localhost:5173).

---

## 🔑 Default Roles & Accounts Matrix
Authentication uses secure JSON Web Tokens. Access is guarded by Role-Based Access Control (RBAC):

| Role | Access Permissions | Primary Tasks |
| :--- | :--- | :--- |
| **Admin** | Full system-wide access | Statistics dashboards, audits tracking, reports compilation. |
| **Inbound** | Inbound docked workspace | Log incoming suppliers, define product SKU metadata, transactionally receive shipments. |
| **Inventory** | Inventory layouts workspace | Monitor rack heatmaps, view capacity load percentages, perform physical slot transfers. |
| **Outbound** | Sorting & Dispatch workspace | Compile picking checklists, scan pack validations, dispatch route vehicles. |
| **Network** | Logistics routing workspace | Group city shipments, schedule travel batches, analyze mileage saved. |
