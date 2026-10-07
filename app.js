/**
 * ============================================================================
 * RESTAURANT MANAGEMENT SYSTEM (In-Memory School Project)
 * File: js/app.js
 * Description: Main Application Controller, Authentication, Navigation Router,
 *              Modal Management, and Toast Notifications.
 * ============================================================================
 */

// Selected role tab on the Login Screen ('admin' | 'staff' | 'customer')
let selectedLoginRole = 'admin';

/**
 * Initializes Application upon page load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Setup event listeners for forms and inputs
  setupEventListeners();

  // Populate Categories in the Add/Edit Menu Item modal dropdown
  populateCategoryDropdown();

  // Initialize Supabase Cloud Database Client
  if (typeof initSupabase === 'function') {
    initSupabase();
  }

  // Default to Login view
  showView('loginView');
});

/**
 * Attaches event listeners to DOM elements
 */
function setupEventListeners() {
  // Login Form Submit
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  // Admin Menu Item Form Submit
  const menuItemForm = document.getElementById('menuItemForm');
  if (menuItemForm) {
    menuItemForm.addEventListener('submit', handleMenuFormSubmit);
  }

  // Admin Menu Search Input
  const adminSearchInput = document.getElementById('adminMenuSearchInput');
  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', handleAdminMenuSearch);
  }

  // POS Menu Search Input
  const posSearchInput = document.getElementById('posSearchInput');
  if (posSearchInput) {
    posSearchInput.addEventListener('input', handlePOSSearch);
  }

  // Customer Menu Search Input
  const customerSearchInput = document.getElementById('customerSearchInput');
  if (customerSearchInput) {
    customerSearchInput.addEventListener('input', handlePOSSearch);
  }

  // Payment Cash Input (Real-time change calculation)
  const cashInput = document.getElementById('paymentCustomerCash');
  if (cashInput) {
    cashInput.addEventListener('input', handlePaymentCashInput);
  }

  // Close modals when clicking on background backdrop
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('active');
    }
  });
}

/**
 * Populates categories dynamically into select dropdown
 */
function populateCategoryDropdown() {
  const select = document.getElementById('menuItemCategory');
  if (!select) return;

  select.innerHTML = CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// ============================================================================
// AUTHENTICATION & ROLE SWITCHING (In-Memory Predefined Credentials)
// ============================================================================

/**
 * Switches role tab on the login card
 */
function switchLoginRoleTab(role) {
  selectedLoginRole = role;

  const tabButtons = document.querySelectorAll('.role-tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));

  const activeBtn = document.getElementById(`tabRole-${role}`);
  if (activeBtn) activeBtn.classList.add('active');

  const loginFormFields = document.getElementById('loginCredentialsFields');
  const loginBtnText = document.getElementById('loginBtnText');
  const demoHelp = document.getElementById('demoCredentialsHelp');

  if (role === 'customer') {
    // Customer kiosk does not need password
    loginFormFields.style.display = 'none';
    loginBtnText.textContent = 'Enter Customer Kiosk';
    demoHelp.innerHTML = `<strong>Customer Access:</strong> No password required. Direct self-service ordering.`;
  } else if (role === 'admin') {
    loginFormFields.style.display = 'block';
    loginBtnText.textContent = 'Login as Admin';
    demoHelp.innerHTML = `<strong>Admin Demo Credentials:</strong> Username: <code>admin</code> | Password: <code>admin123</code>`;
    document.getElementById('loginUsername').value = 'admin';
    document.getElementById('loginPassword').value = 'admin123';
  } else if (role === 'staff') {
    loginFormFields.style.display = 'block';
    loginBtnText.textContent = 'Login as Staff / Cashier';
    demoHelp.innerHTML = `<strong>Staff Demo Credentials:</strong> Username: <code>staff</code> | Password: <code>staff123</code>`;
    document.getElementById('loginUsername').value = 'staff';
    document.getElementById('loginPassword').value = 'staff123';
  }
}

/**
 * Handles user login verification
 */
function handleLoginSubmit(e) {
  e.preventDefault();

  if (selectedLoginRole === 'customer') {
    // Enter customer mode directly
    currentUser = {
      username: 'customer',
      role: 'customer',
      name: 'Valued Customer'
    };
    showToast('Welcome to Customer Self-Service!', 'info');
    setupUserInterface();
    showView('customerPortalView');
    return;
  }

  const usernameInput = document.getElementById('loginUsername').value.trim();
  const passwordInput = document.getElementById('loginPassword').value.trim();

  // Validate credentials against in-memory USERS object
  const user = USERS[usernameInput.toLowerCase()];

  if (user && user.password === passwordInput && user.role === selectedLoginRole) {
    currentUser = { ...user };
    showToast(`Welcome back, ${user.name}!`, 'success');
    setupUserInterface();

    // Direct to initial landing view based on role
    if (user.role === 'admin') {
      showView('dashboardView');
    } else {
      showView('posView');
    }
  } else {
    showToast('Invalid username or password! Please check demo credentials.', 'error');
  }
}

/**
 * Logs out current user and returns to Login screen
 */
function logout() {
  if (confirm('Are you sure you want to log out?')) {
    currentUser = null;
    activeCart = [];
    showToast('You have been logged out.', 'info');
    setupUserInterface();
    showView('loginView');
  }
}

/**
 * Configures Navigation Bar and UI based on active user role
 */
function setupUserInterface() {
  const navContainer = document.getElementById('mainNavbar');
  const userDisplay = document.getElementById('navUserDisplay');
  const roleBadge = document.getElementById('navRoleBadge');
  const userNameText = document.getElementById('navUserName');

  const navAdminItems = document.querySelectorAll('.nav-admin-only');
  const navStaffItems = document.querySelectorAll('.nav-staff-access');
  const navCustomerItems = document.querySelectorAll('.nav-customer-only');

  if (!currentUser) {
    if (navContainer) navContainer.style.display = 'none';
    return;
  }

  if (navContainer) navContainer.style.display = 'flex';

  if (roleBadge) {
    roleBadge.textContent = currentUser.role;
    roleBadge.className = `role-badge ${currentUser.role}`;
  }
  if (userNameText) userNameText.textContent = currentUser.name;

  if (currentUser.role === 'admin') {
    navAdminItems.forEach(el => el.style.display = 'inline-flex');
    navStaffItems.forEach(el => el.style.display = 'inline-flex');
    navCustomerItems.forEach(el => el.style.display = 'none');
  } else if (currentUser.role === 'staff') {
    navAdminItems.forEach(el => el.style.display = 'none');
    navStaffItems.forEach(el => el.style.display = 'inline-flex');
    navCustomerItems.forEach(el => el.style.display = 'none');
  } else if (currentUser.role === 'customer') {
    navAdminItems.forEach(el => el.style.display = 'none');
    navStaffItems.forEach(el => el.style.display = 'none');
    navCustomerItems.forEach(el => el.style.display = 'inline-flex');
  }
}

/**
 * Quick Login helper for effortless school demonstration
 */
function quickLogin(role) {
  switchLoginRoleTab(role);
  if (role === 'admin') {
    document.getElementById('loginUsername').value = 'admin';
    document.getElementById('loginPassword').value = 'admin123';
  } else if (role === 'staff') {
    document.getElementById('loginUsername').value = 'staff';
    document.getElementById('loginPassword').value = 'staff123';
  }
  const dummyEvent = { preventDefault: () => {} };
  handleLoginSubmit(dummyEvent);
}

/**
 * Toggles password visibility between text and password
 */
function togglePasswordVisibility() {
  const pwd = document.getElementById('loginPassword');
  const btn = document.getElementById('togglePasswordBtn');
  if (!pwd) return;
  if (pwd.type === 'password') {
    pwd.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    pwd.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
}

// ============================================================================
// VIEW SWITCHER / ROUTER WITH STRICT ROLE PROTECTION
// ============================================================================

/**
 * Switches the active visible view section with authorization checks
 */
function showView(viewId) {
  // 1. Role Guards
  if (!currentUser && viewId !== 'loginView') {
    viewId = 'loginView';
  } else if (currentUser) {
    if (currentUser.role === 'customer' && viewId !== 'customerPortalView') {
      showToast('Customer mode: Access restricted to customer catalog.', 'info');
      viewId = 'customerPortalView';
    } else if (currentUser.role === 'staff' && (viewId === 'dashboardView' || viewId === 'salesView')) {
      showToast('Access Denied: Administrator role required for Management Analytics.', 'warning');
      viewId = 'posView';
    }
  }

  // Hide all sections
  const views = document.querySelectorAll('.view-section');
  views.forEach(v => v.classList.remove('active'));

  // Show target section
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
  }

  // Update navbar active link
  const navButtons = document.querySelectorAll('.nav-links button');
  navButtons.forEach(btn => btn.classList.remove('active'));

  const matchingBtn = document.querySelector(`[data-target="${viewId}"]`);
  if (matchingBtn) matchingBtn.classList.add('active');

  // Trigger view-specific re-renders
  switch (viewId) {
    case 'dashboardView':
      renderDashboard();
      break;
    case 'adminMenuView':
      renderAdminMenuTable();
      break;
    case 'ordersView':
      renderOrdersTable();
      break;
    case 'salesView':
      renderSalesSummary();
      break;
    case 'posView':
      renderPOSMenu('posFoodGrid');
      updateCartDisplay();
      break;
    case 'customerPortalView':
      renderPOSMenu('customerFoodGrid');
      updateCartDisplay();
      break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// MODAL CONTROLLER
// ============================================================================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

