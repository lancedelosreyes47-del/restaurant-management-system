/**
 * ============================================================================
 * RESTAURANT MANAGEMENT SYSTEM (In-Memory School Project)
 * File: js/menu.js
 * Description: Handles Admin Menu Management (CRUD + Availability toggle).
 * 
 * Demonstrates:
 * - Array manipulation (push, find, findIndex, splice, filter)
 * - Strict input validation (prevent negative/zero prices, empty names)
 * - Dynamic HTML rendering of tables and badges
 * ============================================================================
 */

// Selected filters in Admin Menu tab
let adminMenuFilter = 'All';
let adminMenuAvailabilityFilter = 'all'; // 'all' | 'available' | 'unavailable'
let adminMenuSearchQuery = '';

/**
 * Renders the Admin Menu Management Table
 */
function renderAdminMenuTable() {
  const tableBody = document.getElementById('adminMenuTableBody');
  if (!tableBody) return;

  // Filter items by category, availability, and search keyword
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = (adminMenuFilter === 'All' || item.category === adminMenuFilter);
    const matchesAvailability = (adminMenuAvailabilityFilter === 'all') ||
      (adminMenuAvailabilityFilter === 'available' && item.available) ||
      (adminMenuAvailabilityFilter === 'unavailable' && !item.available);
    const matchesSearch = item.name.toLowerCase().includes(adminMenuSearchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(adminMenuSearchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(adminMenuSearchQuery.toLowerCase());
    return matchesCategory && matchesAvailability && matchesSearch;
  });

  if (filteredItems.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <p style="font-weight: 600;">No menu items found matching your filters.</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredItems.map(item => {
    const statusBadge = item.available
      ? `<span class="badge badge-available">In Stock</span>`
      : `<span class="badge badge-unavailable">Out of Stock</span>`;

    const toggleBtnText = item.available ? 'Set Out of Stock' : 'Set In Stock';
    const toggleBtnClass = item.available ? 'btn-secondary' : 'btn-success';
    const emoji = typeof getItemEmoji === 'function' ? getItemEmoji(item.name, item.category) : '🍽️';

    return `
      <tr>
        <td><strong>${item.id}</strong></td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.5rem;">${emoji}</span>
            <div>
              <div style="font-weight: 600; color: var(--secondary);">${item.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${item.description || ''}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-category">${item.category}</span></td>
        <td><strong>${formatCurrency(item.price)}</strong></td>
        <td>${statusBadge}</td>
        <td>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <button class="btn btn-sm ${toggleBtnClass}" onclick="toggleItemAvailability('${item.id}')" title="Toggle stock availability">
              ${toggleBtnText}
            </button>
            <button class="btn btn-sm btn-primary" onclick="openEditMenuModal('${item.id}')" title="Edit Item">
              ✏️ Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteMenuItem('${item.id}')" title="Delete Item">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Filter the menu table by availability status
 */
function setAdminAvailabilityFilter(status, btnElement) {
  adminMenuAvailabilityFilter = status;
  const buttons = document.querySelectorAll('#adminMenuAvailabilityFilters .filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  renderAdminMenuTable();
}

/**
 * Filter the menu table by category button
 */
function setAdminCategoryFilter(category, btnElement) {
  adminMenuFilter = category;
  
  // Update button active state
  const buttons = document.querySelectorAll('#adminMenuCategoryFilters .filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  renderAdminMenuTable();
}

/**
 * Filter the menu table by search input
 */
function handleAdminMenuSearch(e) {
  adminMenuSearchQuery = e.target.value.trim();
  renderAdminMenuTable();
}

/**
 * Opens modal to Add a new food item
 */
function openAddMenuModal() {
  const form = document.getElementById('menuItemForm');
  if (form) form.reset();

  document.getElementById('modalMenuTitle').textContent = 'Add New Menu Item';
  document.getElementById('menuItemEditId').value = ''; // Empty signifies creating new item
  document.getElementById('menuItemId').value = generateNextItemId();
  document.getElementById('menuItemId').removeAttribute('readonly');
  document.getElementById('menuItemAvailable').checked = true;

  openModal('menuModal');
}

/**
 * Opens modal to Edit an existing food item
 */
function openEditMenuModal(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) {
    showToast('Menu item not found!', 'error');
    return;
  }

  document.getElementById('modalMenuTitle').textContent = `Edit Menu Item (${item.id})`;
  document.getElementById('menuItemEditId').value = item.id;
  document.getElementById('menuItemId').value = item.id;
  document.getElementById('menuItemId').setAttribute('readonly', 'true');
  document.getElementById('menuItemName').value = item.name;
  document.getElementById('menuItemCategory').value = item.category;
  document.getElementById('menuItemPrice').value = item.price;
  document.getElementById('menuItemDesc').value = item.description || '';
  document.getElementById('menuItemAvailable').checked = item.available;

  openModal('menuModal');
}

/**
 * Handles Form Submission for both Add and Edit with strict validation
 */
function handleMenuFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById('menuItemEditId').value.trim();
  const id = document.getElementById('menuItemId').value.trim().toUpperCase();
  const name = document.getElementById('menuItemName').value.trim();
  const category = document.getElementById('menuItemCategory').value.trim();
  const priceRaw = document.getElementById('menuItemPrice').value;
  const description = document.getElementById('menuItemDesc').value.trim();
  const available = document.getElementById('menuItemAvailable').checked;

  // Validation 1: Required Fields
  if (!id || !name || !category) {
    showToast('Please fill in all required fields (ID, Name, Category)!', 'warning');
    return;
  }

  // Validation 2: Price must be a valid positive number
  const price = parseFloat(priceRaw);
  if (isNaN(price) || price <= 0) {
    showToast('Price must be a valid positive number greater than 0!', 'warning');
    return;
  }

  let savedItem = null;

  if (editId) {
    // --- EDIT EXISTING ITEM ---
    const index = menuItems.findIndex(i => i.id === editId);
    if (index !== -1) {
      // Check if the new ID conflicts with another item (excluding the current one)
      if (id !== editId) {
        const duplicate = menuItems.some((item, idx) => idx !== index && item.id.toUpperCase() === id);
        if (duplicate) {
          showToast(`Item ID ${id} already exists! Please use a unique ID.`, 'warning');
          return;
        }
      }
      menuItems[index].name = name;
      menuItems[index].category = category;
      menuItems[index].price = price;
      menuItems[index].description = description;
      menuItems[index].available = available;
      savedItem = menuItems[index];

      showToast(`Menu item ${id} updated successfully!`, 'success');
    } else {
      showToast('Error: Could not find item to update.', 'error');
    }
  } else {
    // --- CREATE NEW ITEM ---
    // Validation 3: Check for duplicate ID
    const exists = menuItems.some(i => i.id.toUpperCase() === id);
    if (exists) {
      showToast(`Item ID ${id} already exists! Please use a unique ID.`, 'warning');
      return;
    }

    const newItem = {
      id,
      name,
      category,
      price,
      description,
      available
    };
    menuItems.push(newItem);
    savedItem = newItem;

    showToast(`New item "${name}" added to menu!`, 'success');
  }

  // Sync to Supabase Cloud Database if connected
  if (savedItem && typeof dbSaveMenuItem === 'function') {
    dbSaveMenuItem(savedItem);
  }

  closeModal('menuModal');
  renderAdminMenuTable();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderPOSMenu === 'function') renderPOSMenu();
}

/**
 * Deletes a menu item from in-memory array with confirmation
 */
function deleteMenuItem(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  if (confirm(`Are you sure you want to delete "${item.name}" (${item.id}) from the menu?`)) {
    const index = menuItems.findIndex(i => i.id === id);
    if (index !== -1) {
      menuItems.splice(index, 1);
      showToast(`Item "${item.name}" deleted from menu.`, 'info');

      // Delete from Supabase Cloud Database
      if (typeof dbDeleteMenuItem === 'function') {
        dbDeleteMenuItem(id);
      }

      renderAdminMenuTable();
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderPOSMenu === 'function') renderPOSMenu();
    }
  }
}

/**
 * Toggles an item's availability (Available / Unavailable)
 */
function toggleItemAvailability(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;

  item.available = !item.available;
  const statusMsg = item.available ? 'Available' : 'Unavailable';
  showToast(`Item "${item.name}" is now ${statusMsg}.`, 'info');

  // Sync availability state to Supabase
  if (typeof dbSaveMenuItem === 'function') {
    dbSaveMenuItem(item);
  }

  renderAdminMenuTable();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderPOSMenu === 'function') renderPOSMenu();
}

