```sql id="v34t5o"
```sql id="f54kk1"
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
```



/* =========================================
   SAMPLE PRODUCTS
========================================= */

INSERT INTO Products
(
    SKU,
    ProductName,
    Category,
    Price
)

VALUES

('IPH15-BLK-128', 'iPhone 15 Black 128GB', 'Electronics', 1200),

('SMG-S24-256', 'Samsung S24 256GB', 'Electronics', 1100),

('LAP-DELL-15', 'Dell Latitude Laptop', 'Computers', 1500),

('HEADSONY-01', 'Sony Headphones', 'Accessories', 250);


/* =========================================
   SAMPLE WAREHOUSES
========================================= */

INSERT INTO Warehouses
(
    WarehouseName,
    City
)

VALUES

('Cairo Main Warehouse', 'Cairo'),

('Alex Distribution Center', 'Alexandria');


/* =========================================
   SAMPLE LOCATIONS
========================================= */

INSERT INTO WarehouseLocations
(
    WarehouseID,
    LocationCode,
    Capacity,
    CurrentLoad
)

VALUES

(1, 'A-01-01', 500, 120),

(1, 'A-01-02', 500, 300),

(1, 'B-02-01', 400, 220),

(2, 'X-01-01', 350, 150);


/* =========================================
   SAMPLE CUSTOMERS
========================================= */

INSERT INTO Customers
(
    FullName,
    Phone,
    Address
)

VALUES

('Ahmed Mohamed', '01000000001', 'Cairo'),

('Sara Ali', '01000000002', 'Giza'),

('Omar Hassan', '01000000003', 'Alexandria');


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

(1, 'PENDING', GETDATE()),

(2, 'PICKING', GETDATE()),

(3, 'SHIPPED', GETDATE());


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
    ProductID,
    UID,
    Status,
    LocationID
)

VALUES

(1, 'UID100001', 'Available', 1),

(1, 'UID100002', 'Available', 1),

(2, 'UID100003', 'Picked', 2),

(3, 'UID100004', 'Available', 3);


/* =========================================
   SAMPLE INVENTORY MOVEMENTS
========================================= */

INSERT INTO InventoryMovements
(
    ProductUnitID,
    FromLocationID,
    ToLocationID,
    MovementType,
    MovementDate
)

VALUES

(1, 1, 2, 'Transfer', GETDATE()),

(2, 1, 3, 'Transfer', GETDATE());

```
