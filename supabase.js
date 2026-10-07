/**
 * ============================================================================
 * RESTAURANT MANAGEMENT SYSTEM
 * File: js/supabase.js
 * Description: Supabase Cloud Database Client, Diagnostics, and Real-Time Sync.
 * 
 * Includes:
 * - Dynamic configuration via LocalStorage (editable in UI)
 * - Automatic detection of paused projects / DNS lookup failures
 * - Seamless silent fallback to in-memory mode (prevents disruptive errors)
 * - 1-Click project unpause and SQL table setup helpers
 * ============================================================================
 */

const DEFAULT_SUPABASE_URL = 'https://ogykjerczbeywowarcwj.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9neWtqZXJjemJleXdvd2FyY3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTEzNjUsImV4cCI6MjEwNDA4NzM2NX0.Y1kNJPjpOZzXK_9Jd7QsRAE__MjzjodIoy_HYNDTivg';

let sbClient = null;
let isSupabaseActive = false;
let isSupabaseTableReady = false;
let supabaseDiagnosticStatus = 'initializing'; // 'connected' | 'paused' | 'tables_pending' | 'auth_error' | 'in_memory'
let supabaseDiagnosticDetails = '';

/**
 * Retrieves the active Supabase configuration (localStorage or defaults)
 */
function getSupabaseConfig() {
  const url = localStorage.getItem('rms_supabase_url') || DEFAULT_SUPABASE_URL;
  const key = localStorage.getItem('rms_supabase_key') || DEFAULT_SUPABASE_KEY;
  const inMemoryOnly = localStorage.getItem('rms_in_memory_only') === 'true';
  return { url: url.trim(), key: key.trim(), inMemoryOnly };
}

/**
 * Extracts the project reference ID from a Supabase URL
 */
function getSupabaseProjectRef(url) {
  try {
    const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : '';
  } catch (e) {
    return '';
  }
}

/**
 * Initializes the Supabase client with smart error detection and diagnostics
 */
async function initSupabase() {
  const { url, key, inMemoryOnly } = getSupabaseConfig();

  // If user selected pure in-memory mode
  if (inMemoryOnly) {
    isSupabaseActive = false;
    isSupabaseTableReady = false;
    supabaseDiagnosticStatus = 'in_memory';
    supabaseDiagnosticDetails = 'Operating in Pure In-Memory Mode (Cloud Sync Disabled by User).';
    updateSupabaseStatusBadge('in_memory', '💾 In-Memory Mode');
    updateDiagnosticModalUI();
    return;
  }

  updateSupabaseStatusBadge('connecting', 'Connecting to Supabase...');

  if (!window.supabase) {
    console.warn('[Supabase] SDK not loaded. Operating in In-Memory fallback mode.');
    supabaseDiagnosticStatus = 'sdk_missing';
    supabaseDiagnosticDetails = 'Supabase JS SDK could not be loaded from CDN (check internet connection).';
    updateSupabaseStatusBadge('offline', 'In-Memory Mode (SDK Missing)');
    updateDiagnosticModalUI();
    return;
  }

  try {
    sbClient = window.supabase.createClient(url, key, {
      auth: { persistSession: false }
    });
    console.log('[Supabase] Client initialized for:', url);

    // Test table access with a short timeout
    const testPromise = sbClient.from('menu_items').select('id').limit(1);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000)
    );

    const { data, error } = await Promise.race([testPromise, timeoutPromise]);

    if (error) {
      handleSupabaseError(error, url);
    } else {
      // Table exists and query succeeded!
      isSupabaseActive = true;
      isSupabaseTableReady = true;
      supabaseDiagnosticStatus = 'connected';
      supabaseDiagnosticDetails = 'Successfully connected to cloud database! Real-time synchronization is active.';
      console.log('[Supabase] Tables verified and accessible!');
      updateSupabaseStatusBadge('connected', '🟢 Supabase Cloud Live');

      // Fetch remote data into in-memory state
      await syncDataFromSupabase();

      // Subscribe to real-time changes
      setupRealtimeSubscriptions();
    }
  } catch (err) {
    handleSupabaseError(err, url);
  }

  updateDiagnosticModalUI();
}

/**
 * Categorizes and handles various Supabase connection failure scenarios
 */
function handleSupabaseError(err, url) {
  isSupabaseActive = false;
  isSupabaseTableReady = false;

  const errMsg = (err.message || err.toString() || '').toLowerCase();
  const ref = getSupabaseProjectRef(url);

  console.warn('[Supabase] Connection assessment:', err);

  if (errMsg.includes('failed to fetch') || errMsg.includes('getaddrinfo') || errMsg.includes('timeout') || errMsg.includes('networkerror')) {
    // Project is paused on Supabase free tier or domain not resolving
    supabaseDiagnosticStatus = 'paused';
    supabaseDiagnosticDetails = `The Supabase project (<strong>${ref || 'project'}</strong>) appears to be <strong>PAUSED</strong> or unreachable. Supabase automatically pauses inactive free tier projects after 7 days.<br><br>👉 <strong>Fix:</strong> Open your Supabase Dashboard and click <strong>"Restore / Unpause project"</strong>, or update your URL & API key below.`;
    updateSupabaseStatusBadge('paused', '⏸️ Supabase Paused (Click to Fix)');
  } else if (err.code === 'PGRST205' || errMsg.includes('schema cache') || errMsg.includes('not find')) {
    // Project is active, but tables are missing
    supabaseDiagnosticStatus = 'tables_pending';
    supabaseDiagnosticDetails = `Connected to project <strong>${ref}</strong>, but the database tables (<code>menu_items</code>, <code>orders</code>) have not been created yet in the SQL Editor.`;
    updateSupabaseStatusBadge('pending', '🟡 Tables Pending (Click to Setup)');
  } else if (err.code === '401' || err.code === 'PGRST301' || errMsg.includes('jwt') || errMsg.includes('invalid api key')) {
    // API key problem
    supabaseDiagnosticStatus = 'auth_error';
    supabaseDiagnosticDetails = `Invalid API Key or expired token. Please verify the anon public key in your Supabase project settings.`;
    updateSupabaseStatusBadge('error', '🔴 Invalid API Key (Click to Fix)');
  } else {
    // Generic error
    supabaseDiagnosticStatus = 'error';
    supabaseDiagnosticDetails = `Supabase responded with an issue: <em>${err.message || 'Unknown error'}</em>. Operating safely in in-memory mode.`;
    updateSupabaseStatusBadge('error', '⚠️ Supabase Offline (Click to Fix)');
  }
}

/**
 * Updates the connection indicator badge on the UI
 */
function updateSupabaseStatusBadge(status, text) {
  const badge = document.getElementById('supabaseStatusBadge');
  const loginBadge = document.getElementById('loginSupabaseBadge');

  const updateElement = (el) => {
    if (!el) return;
    el.textContent = text;
    el.className = 'badge';
    el.style.cursor = 'pointer';

    if (status === 'connected') {
      el.style.background = '#dcfce7';
      el.style.color = '#15803d';
      el.title = 'Connected to Supabase Cloud Database. Click for details.';
    } else if (status === 'paused') {
      el.style.background = '#fef3c7';
      el.style.color = '#b45309';
      el.title = 'Project paused or unreachable. Click to unpause or update settings.';
    } else if (status === 'pending') {
      el.style.background = '#fef3c7';
      el.style.color = '#b45309';
      el.title = 'Supabase connected! Click to view SQL script to create tables.';
    } else if (status === 'in_memory') {
      el.style.background = '#e2e8f0';
      el.style.color = '#475569';
      el.title = 'Operating in Pure In-Memory Mode. Click to connect to Supabase.';
    } else if (status === 'connecting') {
      el.style.background = '#e0f2fe';
      el.style.color = '#0369a1';
    } else {
      el.style.background = '#fee2e2';
      el.style.color = '#b91c1c';
      el.title = 'Supabase connection issue. Click to diagnose.';
    }
  };

  updateElement(badge);
  updateElement(loginBadge);
}

/**
 * Updates diagnostic modal content with live status and current configuration
 */
function updateDiagnosticModalUI() {
  const alertBox = document.getElementById('supabaseDiagnosticAlert');
  const unpauseBtn = document.getElementById('supabaseUnpauseBtn');
  const urlInput = document.getElementById('cfgSupabaseUrl');
  const keyInput = document.getElementById('cfgSupabaseKey');
  const inMemoryCheckbox = document.getElementById('cfgInMemoryOnly');

  const { url, key, inMemoryOnly } = getSupabaseConfig();
  const ref = getSupabaseProjectRef(url);

  if (urlInput) urlInput.value = url;
  if (keyInput) keyInput.value = key;
  if (inMemoryCheckbox) inMemoryCheckbox.checked = inMemoryOnly;

  if (alertBox) {
    if (supabaseDiagnosticStatus === 'connected') {
      alertBox.className = 'diagnostic-box-success';
      alertBox.innerHTML = `<strong>🟢 Cloud Database Live:</strong> ${supabaseDiagnosticDetails}`;
      if (unpauseBtn) unpauseBtn.style.display = 'none';
    } else if (supabaseDiagnosticStatus === 'paused') {
      alertBox.className = 'diagnostic-box-warning';
      alertBox.innerHTML = `<strong>⚠️ Project Paused or Unreachable:</strong><br>${supabaseDiagnosticDetails}`;
      if (unpauseBtn) {
        unpauseBtn.style.display = 'inline-flex';
        unpauseBtn.href = ref ? `https://supabase.com/dashboard/project/${ref}` : 'https://supabase.com/dashboard';
      }
    } else if (supabaseDiagnosticStatus === 'in_memory') {
      alertBox.className = 'diagnostic-box-info';
      alertBox.innerHTML = `<strong>💾 Pure In-Memory Mode Active:</strong> All changes are held in browser memory and reset on reload. Cloud sync is disabled.`;
      if (unpauseBtn) unpauseBtn.style.display = 'none';
    } else if (supabaseDiagnosticStatus === 'tables_pending') {
      alertBox.className = 'diagnostic-box-warning';
      alertBox.innerHTML = `<strong>🟡 Database Tables Missing:</strong> ${supabaseDiagnosticDetails}<br>Run the SQL script below in your Supabase SQL Editor.`;
      if (unpauseBtn) unpauseBtn.style.display = 'none';
    } else {
      alertBox.className = 'diagnostic-box-danger';
      alertBox.innerHTML = `<strong>🔴 Connection Notice:</strong> ${supabaseDiagnosticDetails}`;
      if (unpauseBtn) unpauseBtn.style.display = 'none';
    }
  }
}

/**
 * Saves updated Supabase connection configuration from UI modal
 */
function saveSupabaseConnectionSettings() {
  const urlInput = document.getElementById('cfgSupabaseUrl');
  const keyInput = document.getElementById('cfgSupabaseKey');
  const inMemoryCheckbox = document.getElementById('cfgInMemoryOnly');

  const newUrl = urlInput ? urlInput.value.trim() : '';
  const newKey = keyInput ? keyInput.value.trim() : '';
  const inMemoryOnly = inMemoryCheckbox ? inMemoryCheckbox.checked : false;

  if (!inMemoryOnly && (!newUrl || !newKey)) {
    showToast('Please provide both Supabase URL and Anon Key, or enable In-Memory Mode!', 'warning');
    return;
  }

  localStorage.setItem('rms_supabase_url', newUrl);
  localStorage.setItem('rms_supabase_key', newKey);
  localStorage.setItem('rms_in_memory_only', inMemoryOnly ? 'true' : 'false');

  showToast('Settings saved! Re-testing Supabase connection...', 'info');
  closeModal('supabaseSetupModal');

  // Re-run initialization with new credentials
  initSupabase();
}

/**
 * Resets configuration to default credentials
 */
function resetSupabaseSettingsToDefault() {
  localStorage.removeItem('rms_supabase_url');
  localStorage.removeItem('rms_supabase_key');
  localStorage.removeItem('rms_in_memory_only');

  const urlInput = document.getElementById('cfgSupabaseUrl');
  const keyInput = document.getElementById('cfgSupabaseKey');
  const inMemoryCheckbox = document.getElementById('cfgInMemoryOnly');

  if (urlInput) urlInput.value = DEFAULT_SUPABASE_URL;
  if (keyInput) keyInput.value = DEFAULT_SUPABASE_KEY;
  if (inMemoryCheckbox) inMemoryCheckbox.checked = false;

  showToast('Reset to default configuration. Connecting...', 'info');
  closeModal('supabaseSetupModal');
  initSupabase();
}

/**
 * Toggles Pure In-Memory mode directly
 */
function togglePureInMemoryMode() {
  const current = localStorage.getItem('rms_in_memory_only') === 'true';
  const next = !current;
  localStorage.setItem('rms_in_memory_only', next ? 'true' : 'false');

  const msg = next ? 'Pure In-Memory Mode enabled (Cloud Sync paused).' : 'In-Memory Mode disabled. Connecting to Supabase...';
  showToast(msg, 'info');
  closeModal('supabaseSetupModal');
  initSupabase();
}

/**
 * Syncs menu items and orders from Supabase into memory
 */
async function syncDataFromSupabase() {
  if (!sbClient || !isSupabaseTableReady) return;

  try {
    // 1. Fetch Menu Items
    const { data: remoteMenu, error: menuErr } = await sbClient
      .from('menu_items')
      .select('*')
      .order('id', { ascending: true });

    if (!menuErr && remoteMenu && remoteMenu.length > 0) {
      menuItems = remoteMenu.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        price: parseFloat(m.price),
        available: m.available,
        description: m.description || ''
      }));
      console.log(`[Supabase] Loaded ${menuItems.length} menu items from database.`);
    }

    // 2. Fetch Orders
    const { data: remoteOrders, error: orderErr } = await sbClient
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!orderErr && remoteOrders && remoteOrders.length > 0) {
      orders = remoteOrders.map(o => ({
        id: o.id,
        customerName: o.customer_name,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
        subtotal: parseFloat(o.subtotal),
        total: parseFloat(o.total),
        payment: parseFloat(o.payment || 0),
        change: parseFloat(o.change || 0),
        status: o.status,
        timestamp: o.timestamp,
        orderType: o.order_type || 'Dine-In',
        processedBy: o.processed_by || 'Staff'
      }));
      console.log(`[Supabase] Loaded ${orders.length} orders from database.`);
    }

    // Refresh whichever UI view is currently active
    refreshActiveView();
  } catch (err) {
    console.warn('[Supabase] Sync error (silent fallback):', err);
  }
}

/**
 * Subscribes to real-time table events
 */
function setupRealtimeSubscriptions() {
  if (!sbClient || !isSupabaseTableReady) return;

  try {
    sbClient
      .channel('rms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        console.log('[Supabase Realtime] Menu items changed remotely. Re-syncing...');
        syncDataFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        console.log('[Supabase Realtime] Orders changed remotely. Re-syncing...');
        syncDataFromSupabase();
      })
      .subscribe();
  } catch (e) {
    console.warn('[Supabase Realtime] Subscription warning:', e);
  }
}

/**
 * Saves or updates a menu item in Supabase (silent on network error)
 */
async function dbSaveMenuItem(item) {
  if (!sbClient || !isSupabaseTableReady) return;

  try {
    const { error } = await sbClient
      .from('menu_items')
      .upsert({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        available: item.available,
        description: item.description
      });

    if (error) {
      console.warn('[Supabase] Non-blocking error saving menu item:', error);
    } else {
      console.log('[Supabase] Menu item synced:', item.id);
    }
  } catch (err) {
    console.warn('[Supabase] Non-blocking exception saving menu item:', err);
  }
}

/**
 * Deletes a menu item from Supabase (silent on network error)
 */
async function dbDeleteMenuItem(id) {
  if (!sbClient || !isSupabaseTableReady) return;

  try {
    const { error } = await sbClient
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[Supabase] Non-blocking error deleting menu item:', error);
    } else {
      console.log('[Supabase] Menu item deleted:', id);
    }
  } catch (err) {
    console.warn('[Supabase] Non-blocking exception deleting menu item:', err);
  }
}

/**
 * Saves a new order into Supabase (silent on network error)
 */
async function dbSaveOrder(order) {
  if (!sbClient || !isSupabaseTableReady) return;

  try {
    const { error } = await sbClient
      .from('orders')
      .insert({
        id: order.id,
        customer_name: order.customerName,
        items: order.items,
        subtotal: order.subtotal,
        total: order.total,
        payment: order.payment,
        change: order.change,
        status: order.status,
        timestamp: order.timestamp,
        order_type: order.orderType,
        processed_by: order.processedBy
      });

    if (error) {
      console.warn('[Supabase] Non-blocking error saving order:', error);
    } else {
      console.log('[Supabase] Order synced to cloud:', order.id);
    }
  } catch (err) {
    console.warn('[Supabase] Non-blocking exception saving order:', err);
  }
}

/**
 * Updates an order status in Supabase (silent on network error)
 */
async function dbUpdateOrderStatus(orderId, newStatus, payment = null, change = null) {
  if (!sbClient || !isSupabaseTableReady) return;

  try {
    const updatePayload = { status: newStatus };
    if (payment !== null) updatePayload.payment = payment;
    if (change !== null) updatePayload.change = change;

    const { error } = await sbClient
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      console.warn('[Supabase] Non-blocking error updating order status:', error);
    } else {
      console.log('[Supabase] Order status updated:', orderId, newStatus);
    }
  } catch (err) {
    console.warn('[Supabase] Non-blocking exception updating order:', err);
  }
}

/**
 * Helper to refresh active view
 */
function refreshActiveView() {
  const activeSection = document.querySelector('.view-section.active');
  if (!activeSection) return;

  const viewId = activeSection.id;
  if (viewId === 'dashboardView' && typeof renderDashboard === 'function') renderDashboard();
  if (viewId === 'adminMenuView' && typeof renderAdminMenuTable === 'function') renderAdminMenuTable();
  if (viewId === 'ordersView' && typeof renderOrdersTable === 'function') renderOrdersTable();
  if (viewId === 'salesView' && typeof renderSalesSummary === 'function') renderSalesSummary();
  if (viewId === 'posView' && typeof renderPOSMenu === 'function') {
    renderPOSMenu('posFoodGrid');
    updateCartDisplay();
  }
  if (viewId === 'customerPortalView' && typeof renderPOSMenu === 'function') {
    renderPOSMenu('customerFoodGrid');
    updateCartDisplay();
  }
}

/**
 * Opens the Supabase Setup & Diagnostics Modal
 */
function openSupabaseSetupModal() {
  updateDiagnosticModalUI();
  openModal('supabaseSetupModal');
}

/**
 * Copies SQL schema script to clipboard
 */
function copySupabaseSQL() {
  const sqlText = document.getElementById('supabaseSqlCodeBlock')?.innerText;
  if (sqlText) {
    navigator.clipboard.writeText(sqlText).then(() => {
      showToast('SQL schema copied to clipboard! Paste it into Supabase SQL Editor.', 'success');
    }).catch(() => {
      showToast('Could not copy automatically. Please select and copy the SQL code.', 'info');
    });
  }
}
