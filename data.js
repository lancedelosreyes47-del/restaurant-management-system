/**
 * ============================================================================
 * RESTAURANT MANAGEMENT SYSTEM (In-Memory School Project)
 * File: js/data.js
 * Description: Holds all in-memory data structures, seed data, and utility functions.
 * 
 * NOTE FOR STUDENTS:
 * All data in this application is stored strictly in memory (RAM) using standard
 * JavaScript arrays and objects. No SQL, MongoDB, or Firebase databases are used.
 * When the browser page is reloaded, the data resets back to this initial state.
 * ============================================================================
 */

// 1. Predefined System Users & Credentials
const USERS = {
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator'
  },
  staff: {
    username: 'staff',
    password: 'staff123',
    role: 'staff',
    name: 'Staff Cashier'
  }
};

// 2. Food Categories
const CATEGORIES = [
  'Main Course',
  'Fast Food',
  'Side Dish',
  'Beverage',
  'Dessert'
];

// 3. Predefined In-Memory Menu Items
// Each item contains: id, name, category, price, available (boolean)
let menuItems = [
  {
    id: 'M001',
    name: 'Chicken Adobo',
    category: 'Main Course',
    price: 120,
    available: true,
    description: 'Savory stewed chicken marinated in soy sauce, vinegar, and garlic.'
  },
  {
    id: 'M002',
    name: 'Burger',
    category: 'Fast Food',
    price: 100,
    available: true,
    description: 'Juicy beef patty served with fresh lettuce, tomatoes, and house sauce.'
  },
  {
    id: 'M003',
    name: 'Fries',
    category: 'Side Dish',
    price: 60,
    available: true,
    description: 'Golden crispy french fries lightly seasoned with salt.'
  },
  {
    id: 'M004',
    name: 'Soft Drink',
    category: 'Beverage',
    price: 40,
    available: true,
    description: 'Refreshing ice-cold carbonated soda in can.'
  },
  {
    id: 'M005',
    name: 'Pork Sisig w/ Egg',
    category: 'Main Course',
    price: 150,
    available: true,
    description: 'Sizzling minced pork seasoned with calamansi, onions, and topped with egg.'
  },
  {
    id: 'M006',
    name: 'Halo-Halo Special',
    category: 'Dessert',
    price: 85,
    available: true,
    description: 'Classic shaved ice dessert with mixed sweetened fruits, leche flan, and ube.'
  },
  {
    id: 'M007',
    name: 'Fried Chicken w/ Rice',
    category: 'Main Course',
    price: 130,
    available: true,
    description: 'Crispy deep-fried chicken served with hot steamed rice and gravy.'
  },
  {
    id: 'M008',
    name: 'Iced Lemon Tea',
    category: 'Beverage',
    price: 35,
    available: false, // Sample unavailable item to demonstrate restriction
    description: 'Freshly brewed black tea infused with natural lemon slices.'
  },
  {
    id: 'M009',
    name: 'Garlic Butter Rice',
    category: 'Side Dish',
    price: 25,
    available: true,
    description: 'Fragrant steamed rice sautéed with toasted garlic and butter.'
  },
  {
    id: 'M010',
    name: 'Leche Flan',
    category: 'Dessert',
    price: 70,
    available: true,
    description: 'Rich and creamy Filipino caramel custard dessert.'
  }
];

// 4. Predefined In-Memory Orders
// Used to provide immediate statistics for the Dashboard and Sales Summary
let orders = [
  {
    id: 'ORD-1001',
    customerName: 'Juan Dela Cruz (Table 1)',
    items: [
      { id: 'M001', name: 'Chicken Adobo', price: 120, quantity: 2, subtotal: 240 },
      { id: 'M003', name: 'Fries', price: 60, quantity: 1, subtotal: 60 },
      { id: 'M004', name: 'Soft Drink', price: 40, quantity: 2, subtotal: 80 }
    ],
    subtotal: 380,
    total: 380,
    payment: 500,
    change: 120,
    status: 'Completed',
    timestamp: '2026-09-04 11:30 AM',
    orderType: 'Dine-In'
  },
  {
    id: 'ORD-1002',
    customerName: 'Maria Santos (Takeout)',
    items: [
      { id: 'M002', name: 'Burger', price: 100, quantity: 2, subtotal: 200 },
      { id: 'M003', name: 'Fries', price: 60, quantity: 2, subtotal: 120 }
    ],
    subtotal: 320,
    total: 320,
    payment: 350,
    change: 30,
    status: 'Completed',
    timestamp: '2026-09-04 12:15 PM',
    orderType: 'Takeout'
  },
  {
    id: 'ORD-1003',
    customerName: 'Pedro Penduko (Table 4)',
    items: [
      { id: 'M005', name: 'Pork Sisig w/ Egg', price: 150, quantity: 2, subtotal: 300 },
      { id: 'M009', name: 'Garlic Butter Rice', price: 25, quantity: 2, subtotal: 50 },
      { id: 'M004', name: 'Soft Drink', price: 40, quantity: 2, subtotal: 80 }
    ],
    subtotal: 430,
    total: 430,
    payment: 500,
    change: 70,
    status: 'Preparing',
    timestamp: '2026-09-04 01:05 PM',
    orderType: 'Dine-In'
  },
  {
    id: 'ORD-1004',
    customerName: 'Customer #8 (Self-Service)',
    items: [
      { id: 'M007', name: 'Fried Chicken w/ Rice', price: 130, quantity: 1, subtotal: 130 },
      { id: 'M006', name: 'Halo-Halo Special', price: 85, quantity: 1, subtotal: 85 }
    ],
    subtotal: 215,
    total: 215,
    payment: 0,
    change: 0,
    status: 'Pending',
    timestamp: '2026-09-04 01:20 PM',
    orderType: 'Dine-In'
  }
];

// 5. Active In-Memory Cart for current Ordering Session
let activeCart = [];

// 6. Current Logged-in Session State
let currentUser = null; // null | { username, role, name }

// ============================================================================
// HELPER UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats a number into Philippine Peso currency string: e.g. ₱380.00 or ₱380
 */
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₱' + num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Returns a formatted date-time string: YYYY-MM-DD hh:mm AM/PM
 */
function getCurrentDateTimeString() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return `${dateStr} ${timeStr}`;
}

/**
 * Generates the next sequential Menu Item ID (e.g. M011, M012)
 */
function generateNextItemId() {
  let maxIdNum = 0;
  menuItems.forEach(item => {
    const numPart = parseInt(item.id.replace('M', ''), 10);
    if (!isNaN(numPart) && numPart > maxIdNum) {
      maxIdNum = numPart;
    }
  });
  const nextNum = maxIdNum + 1;
  return 'M' + String(nextNum).padStart(3, '0');
}

/**
 * Generates the next sequential Order ID (e.g. ORD-1005)
 */
function generateNextOrderId() {
  let maxIdNum = 1000;
  orders.forEach(order => {
    const numPart = parseInt(order.id.replace('ORD-', ''), 10);
    if (!isNaN(numPart) && numPart > maxIdNum) {
      maxIdNum = numPart;
    }
  });
  const nextNum = maxIdNum + 1;
  return `ORD-${nextNum}`;
}

/**
 * Returns a contextual food emoji based on item name and category
 */
function getItemEmoji(name, category) {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();
  if (n.includes('adobo') || n.includes('chicken') || n.includes('manok')) return '🍗';
  if (n.includes('burger')) return '🍔';
  if (n.includes('fries')) return '🍟';
  if (n.includes('sisig') || n.includes('pork') || n.includes('egg')) return '🍳';
  if (n.includes('halo') || n.includes('ice cream')) return '🍧';
  if (n.includes('rice')) return '🍚';
  if (n.includes('tea') || n.includes('lemon') || n.includes('coffee')) return '🧋';
  if (n.includes('flan') || n.includes('cake') || c.includes('dessert')) return '🍮';
  if (n.includes('drink') || n.includes('soda') || n.includes('coke') || c.includes('beverage')) return '🥤';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('soup') || n.includes('noodle') || n.includes('ramen')) return '🍜';
  if (n.includes('fish') || n.includes('seafood')) return '🐟';
  if (c.includes('fast food')) return '🥪';
  return '🍽️';
}

