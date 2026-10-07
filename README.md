# 🍽️ Savory Bites — Restaurant Management System (RMS)
### Hybrid In-Memory & Supabase Cloud Database System for Students

A complete, user-friendly, and interactive **Restaurant Management System** supporting both **100% In-Memory operation** and **Supabase Cloud Database integration**. Connected to Supabase project `https://ogykjerczbeywowarcwj.supabase.co` with real-time sync, cloud persistence, and seamless offline fallback.

---

## ⚡ Supabase Cloud Setup (1-Minute Quick Start)

The application is pre-configured with your Supabase credentials. To create the tables in your cloud database:

1. Log into your Supabase Dashboard: [https://supabase.com/dashboard/project/ogykjerczbeywowarcwj](https://supabase.com/dashboard/project/ogykjerczbeywowarcwj)
2. In the left navigation, click **SQL Editor**.
3. Click **+ New Query**, open [`supabase_schema.sql`](file:///c:/My%20Project%20System/supabase_schema.sql), paste its content, and click **RUN**.
4. That's it! When you refresh `index.html`, the status badge will glow **🟢 Supabase Cloud Live** and all menu items, orders, and sales will sync to the cloud in real time.
*(If you run the app without executing the SQL script, it automatically functions in local in-memory mode without any errors!)*

---

## 🚀 Quick Start (How to Run)

You do **not** need to install or configure any databases!

### Option 1: Direct Browser Launch (Recommended)
Simply **double-click** the `index.html` file on Windows/Mac/Linux. It will immediately open and run smoothly in any modern web browser (Google Chrome, Edge, Firefox, Safari).

### Option 2: Local Python Server
If you prefer running via a local server:
```bash
python run.py
```
This starts a lightweight server on port `8080` and opens your default browser.

---

## 👥 User Roles & Predefined Credentials

| Role | Access Level | Username | Password | Key Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Full Management | `admin` | `admin123` | Dashboard KPIs, Menu CRUD, Availability Toggle, All Orders, Sales Summary & Top Sellers |
| **Cashier / Staff** | Operations & POS | `staff` | `staff123` | Cashier POS, Cart Calculation, Cash Payment & Change, Thermal Receipts, Order Status Tracking |
| **Customer** | Self-Service Kiosk | *No login needed* | *Direct Access* | Browse menu, Add items to tray, Place order ticket, Live order progress tracker |

> **Presentation Tip**: The login screen features a role tab switcher and a demo credentials reminder box for quick demonstration during grading.

---

## 🔄 Complete Restaurant Workflow

```
[Login Screen] ──> Select Role (Admin / Cashier / Customer)
       │
       ├──> [Admin] ──────> View Dashboard KPIs ──> Add/Edit/Delete Menu Items ──> View Sales Summary
       │
       ├──> [Cashier] ────> POS Catalog ──> Add to Cart ──> Auto Total ──> Cash Payment ──> Print Receipt ──> Update Status
       │
       └──> [Customer] ───> Browse Menu ──> Add to Tray ──> Place Order Ticket ──> Track Live Status (Pending → Ready)
```

---

## 🌟 Key Features

### 1. 📊 Centralized Dashboard (Admin)
- Real-time KPI summary cards:
  - **Total Menu Items**
  - **Available Items (In Stock)**
  - **Pending Orders**
  - **Completed Orders**
  - **Today's In-Memory Sales (₱)**
- **🏆 Most Ordered Food Item**: Automatically calculates and displays the highest-selling food item and quantity sold.
- **Recent Orders Table**: Live snapshot of recent orders.

### 2. 📋 Menu Management (Admin)
- **Item Fields**: Item ID (e.g. `M001`), Food Name, Category, Price (₱), Availability Status, Description.
- **Add New Food Items**: Auto-generates sequential IDs (e.g. `M011`) with duplicate ID detection.
- **Edit & Delete**: Edit prices, categories, names, or remove items.
- **Availability Toggle**: One-click toggle between `Available` (In Stock) and `Unavailable` (Out of Stock).
- **Category Filter & Search**: Instant real-time filtering by category and keyword.
- **Input Validation**: Rejects negative or zero prices, empty fields, and duplicate IDs.

### 3. 🛒 Point of Sale & Cart System (Cashier & Staff)
- Interactive food grid with category tabs (`Main Course`, `Fast Food`, `Side Dish`, `Beverage`, `Dessert`).
- **Unavailable Protection**: Prevents adding out-of-stock items to the order.
- **Real-Time Cart**: Add items, increase/decrease quantities (`+` / `-`), or remove single items.
- **Auto-Calculations**: Computes item subtotals and grand total automatically in Philippine Peso (₱).

### 4. 💵 Payment & Checkout
- **Cash Tendered Input**: Enter cash received from the customer.
- **Strict Validation**: Rejects payment if cash is less than the total amount due.
- **Real-Time Change Calculation**: Immediately computes and displays exact change (e.g., Total: ₱380, Payment: ₱500 $\rightarrow$ Change: ₱120).

### 5. 🧾 Authentic Thermal Receipt Generation & Printing
- Generates realistic receipt formatted like a restaurant POS thermal slip.
- Includes:
  - Restaurant Name & Header
  - Sequential Order ID (`ORD-1005`)
  - Date & Timestamp
  - Itemized table (Item, Quantity, Unit Price, Subtotal)
  - Subtotal & Grand Total
  - Cash Tendered & Change
  - Server / Cashier Name
- **🖨️ Native Print Support**: Click "Print Receipt" to trigger the browser's print dialog, optimized via `@media print` CSS rules.

### 6. 📦 Order Status Lifecycle
Orders transition through 5 distinct statuses:
1. `⏳ Pending` — Order placed, waiting for kitchen.
2. `🍳 Preparing` — Kitchen is cooking/preparing.
3. `🔔 Ready` — Ready for customer pickup or table service.
4. `✅ Completed` — Served and paid.
5. `❌ Cancelled` — Order cancelled.

### 7. 🔍 Customer Self-Service Kiosk & Live Order Tracker
- Customers can place self-service orders.
- Customers can type their Order ID (e.g. `ORD-1004`) to view a visual 4-step progress tracker.

### 8. 📈 Sales Summary & Analytics (Admin)
- Total Orders, Completed Orders, and Cancelled Orders metrics.
- Total Revenue accrued from completed orders.
- **Top-Selling Food Ranking**: Medal rankings (🥇 1st, 🥈 2nd, 🥉 3rd) showing total units sold and total revenue generated per dish.

---

## 📁 Project File Structure

```
c:/My Project System/
├── index.html            # Main Single-Page Application container
├── run.py                # Optional 1-click Python HTTP server
├── README.md             # Project documentation & presentation guide
├── css/
│   ├── style.css         # Modern, responsive layout, cards, buttons, badges, modals
│   └── receipt.css       # Thermal POS receipt formatting and @media print rules
└── js/
    ├── data.js           # In-memory arrays (menuItems, orders, activeCart), seed data, helpers
    ├── menu.js           # Menu CRUD and availability toggle functions
    ├── pos.js            # Cart calculations, payment processing, receipt generation
    ├── orders.js         # Order status transition pipeline and customer order tracking
    ├── sales.js          # Dashboard KPIs, sales analytics, top-seller calculations
    └── app.js            # Router, authentication, modal controllers, toast notifications
```

---

## 🧠 In-Memory Storage Architecture (For Students)

Instead of sending SQL queries to a database server, the entire state is held in JavaScript runtime memory:

```javascript
// Sample in js/data.js
let menuItems = [
  { id: 'M001', name: 'Chicken Adobo', category: 'Main Course', price: 120, available: true },
  { id: 'M002', name: 'Burger', category: 'Fast Food', price: 100, available: true }
];

let orders = [
  {
    id: 'ORD-1001',
    customerName: 'Table 1',
    items: [...],
    total: 380,
    payment: 500,
    change: 120,
    status: 'Completed'
  }
];

let activeCart = [];
```

### Why this is great for school presentations:
1. **Zero Configuration**: Works on any school computer, flash drive, or laptop without needing XAMPP, WAMP, MySQL Workbench, or Node.js.
2. **Instant Performance**: No network lag or database connection errors during a live presentation.
3. **Clean Code Separation**: Functions are modular and easy to explain to professors and panel evaluators.
4. **Data Reset**: Refreshing the browser (`F5`) safely resets all temporary transactions back to initial state.

---

## 🛠️ How to Customize or Extend

- **Add More Sample Dishes**: Open `js/data.js` and add new objects to the `menuItems` array.
- **Change Currency**: In `js/data.js`, modify `formatCurrency()` to use `$` or other symbols instead of `₱`.
- **Add New Roles or Users**: In `js/data.js`, edit the `USERS` object.
- **Change Restaurant Name**: In `index.html` and `js/pos.js`, change `Savory Bites` to your school or restaurant name.

