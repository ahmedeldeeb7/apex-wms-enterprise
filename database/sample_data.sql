/* =========================================
    SAMPLE ROLES
========================================= */

INSERT INTO Roles (RoleName)
VALUES
('Admin'),
('Inventory'),
('Inbound'),
('Outbound'),
('Network');

/* =========================================
    SAMPLE DEPARTMENTS
========================================= */

INSERT INTO Departments (DepartmentName)
VALUES
('Inbound'),
('Inventory'),
('Outbound'),
('Network'),
('Admin');

/* =========================================
    SAMPLE USERS
========================================= */

INSERT INTO Users
(
     Username,
     PasswordHash,
     RoleID,
     DepartmentID
)
VALUES
('admin', 'admin123', 1, 5),
('inventory_manager1', 'inventory123', 2, 2),
('receiver1', 'inbound123', 3, 1),
('picker1', 'outbound123', 4, 3),
('network_manager1', 'network123', 5, 4);

/* =========================================
    SAMPLE PRODUCTS
========================================= */

INSERT INTO Products
(
     SKU,
     ProductName,
     Category,
     Weight,
     Dimensions,
     CreatedAt
)
VALUES
('IPH15-BLK-128', 'iPhone 15 Black 128GB', 'Electronics', 0.17, '146.7x71.5x7.8mm', GETDATE()),
('SMG-S24-256', 'Samsung S24 256GB', 'Electronics', 0.17, '147.0x70.6x7.6mm', GETDATE()),
('LAP-DELL-15', 'Dell Latitude Laptop', 'Computers', 1.90, '357x235x18mm', GETDATE()),
('HEADSONY-01', 'Sony Headphones', 'Accessories', 0.25, '180x170x80mm', GETDATE());

/* =========================================
    SAMPLE WAREHOUSES
========================================= */

INSERT INTO Warehouses
(
     WarehouseName,
     Address
)
VALUES
('Cairo Main Warehouse', 'Cairo, Egypt'),
('Alex Distribution Center', 'Alexandria, Egypt');

/* =========================================
    SAMPLE LOCATIONS
========================================= */

INSERT INTO WarehouseLocations
(
     WarehouseID,
     Zone,
     Aisle,
     Rack,
     Shelf,
     Bin,
     Capacity,
     CurrentLoad
)
VALUES
(1, 'A', '01', '01', '01', '01', 500, 120),
(1, 'A', '01', '02', '01', '01', 500, 300),
(1, 'B', '02', '01', '01', '01', 400, 220),
(2, 'X', '01', '01', '01', '01', 350, 150);

/* =========================================
    SAMPLE CUSTOMERS
========================================= */

INSERT INTO Customers
(
     FullName,
     Phone,
     Address,
     City
)
VALUES
('Ahmed Mohamed', '01000000001', 'Nasr City, Cairo', 'Cairo'),
('Sara Ali', '01000000002', 'Dokki, Giza', 'Giza'),
('Omar Hassan', '01000000003', 'Smouha, Alexandria', 'Alexandria');

/* =========================================
    SAMPLE ORDERS
========================================= */

INSERT INTO Orders
(
     CustomerID,
     Status,
     OrderDate
)
VALUES
(1, 'Pending', GETDATE()),
(2, 'Picking', GETDATE()),
(3, 'Shipped', GETDATE());

/* =========================================
    SAMPLE ORDER ITEMS
========================================= */

INSERT INTO OrderItems
(
     OrderID,
     ProductID,
     Quantity
)
VALUES
(1, 1, 2),
(1, 4, 1),
(2, 2, 1),
(3, 3, 1);

/* =========================================
    SAMPLE PRODUCT UNITS
========================================= */

INSERT INTO ProductUnits
(
     UID,
     ProductID,
     SerialNumber,
     Status,
     LocationID,
     ReceivedDate
)
VALUES
(100000000001, 1, 'SN-100000000001', 'Stored', 1, GETDATE()),
(100000000002, 1, 'SN-100000000002', 'Stored', 1, GETDATE()),
(100000000003, 2, 'SN-100000000003', 'Picked', NULL, GETDATE()),
(100000000004, 3, 'SN-100000000004', 'Stored', 3, GETDATE());

/* =========================================
    SAMPLE INVENTORY MOVEMENTS
========================================= */

INSERT INTO InventoryMovements
(
     UID,
     FromLocation,
     ToLocation,
     MovementType,
     MovementDate
)
VALUES
(100000000001, 1, 2, 'Transfer', GETDATE()),
(100000000002, 1, 3, 'Transfer', GETDATE());
