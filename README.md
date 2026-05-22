# APEX WMS - Enterprise Smart Warehouse Management System

APEX WMS is a full-stack enterprise warehouse management platform inspired by Amazon fulfillment center systems.
The system manages real-time warehouse operations including inbound receiving, inventory tracking, outbound order fulfillment, logistics coordination, and live operational monitoring.

---


# Quick Start

## 1. Clone Repository

```bash
git clone https://github.com/AhmedEldeeb7/APEX-WMS.git
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Create:

```text
.env
```

Copy contents from:

```text
.env.example
```

Then run:

```bash
npm run dev
```

---

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 4. Database Setup

Open SQL Server Management Studio.

Create database:

```sql
CREATE DATABASE SmartWarehouseDB;
```

Run:

```text
database/SmartWarehouseDB_Schema.sql
```

Optional sample data:

```text
database/sample_data.sql
```

---

## 5. Default Login Accounts

| Username           | Password     | Department |
| ------------------ | ------------ | ---------- |
| admin              | admin123     | Admin      |
| inventory_manager1 | inventory123 | Inventory  |
| receiver1          | inbound123   | Inbound    |
| picker1            | outbound123  | Outbound   |
| network_manager1   | network123   | Network    |

---

## 6. Application URLs

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```


# 🚀 Technologies Used

## Frontend

* React.js + Vite
* TailwindCSS
* Framer Motion
* Recharts
* Socket.IO Client

## Backend

* Node.js
* Express.js
* JWT Authentication
* Socket.IO
* MSSQL Driver

## Database

* Microsoft SQL Server

---

# 🏭 System Departments

## Inbound Department

Handles:

* Supplier shipments
* Receiving products
* SKU generation
* UID generation
* Shipment validation

## Inventory Department

Handles:

* Product storage
* Warehouse locations
* Inventory transfers
* Capacity management
* Inventory tracking

## Outbound Department

Handles:

* Order picking
* Packing
* Shipping
* Fulfillment workflow

## Network Department

Handles:

* Delivery grouping
* Logistics planning
* Route optimization

## Admin Department

Handles:

* Dashboard analytics
* Reports
* Audit logs
* User management
* System monitoring

---

# 🔥 Core Features

* Real-time warehouse operations
* Live dashboard synchronization
* Role-Based Access Control (RBAC)
* JWT Authentication
* Audit logging system
* Warehouse heatmaps
* Inventory movement tracking
* Enterprise SQL optimization
* Stored Procedures & Functions
* Index optimization
* Real-time Socket.IO updates

---

# 🗄️ Database Features

* SQL Server relational database
* ERD-based architecture
* Indexed queries
* Stored procedures
* Triggers
* Views
* Functions
* Audit tables
* Capacity validation
* Transaction-safe operations

---

# 📊 System Modules

* Products Management
* Orders Management
* Inventory Tracking
* Warehouse Locations
* Shipment Receiving
* Order Fulfillment
* Audit Logging
* Reporting System
* Dashboard Analytics

---

# 🔐 Security Features

* JWT authentication
* Protected API routes
* Role permissions
* Secure middleware
* Audit tracking
* DDL protection triggers

---

# ⚡ Real-Time Features

Using Socket.IO:

* Live inventory updates
* Real-time order updates
* Dashboard synchronization
* Warehouse activity feed
* Operational notifications

---

# 📂 Project Structure

```bash
APEX-WMS/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── socket/
│   │   └── config/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   └── services/
│
├── database/
│   ├── SmartWarehouseDB_Schema.sql
│   ├── sample_data.sql
│   └── ERD.png
│
│
├── docs/
│   ├── Documentation.pdf
│   └── Presentation.pdf
│
└── README.md
```

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/APEX-WMS.git
```

---

## 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on:

```bash
http://localhost:5000
```

---

## 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# 🗃️ Database Setup

1. Open SQL Server Management Studio
2. Create database:

```sql
CREATE DATABASE SmartWarehouseDB;
```

3. Run:

```bash
database/SmartWarehouseDB_Schema.sql
```

---

# 👥 Default System Roles

| Role             | Permissions          |
| ---------------- | -------------------- |
| Admin            | Full system access   |
| InventoryManager | Inventory operations |
| Receiver         | Shipment receiving   |
| Picker           | Outbound picking     |
| NetworkManager   | Logistics operations |

---

# 📈 Performance Optimization

The system includes:

* Indexed queries
* Query optimization
* Execution plan analysis
* Performance benchmarking
* Optimized reporting queries

---

# 🎯 Project Goal

The goal of this project is to simulate a real enterprise warehouse management platform capable of handling large-scale inventory operations, order fulfillment workflows, and logistics management using scalable database and real-time technologies.

---

# 👨‍💻 Authors

Database Systems Project Team

---

# 📄 License

Educational Project - Faculty Database Systems Course
