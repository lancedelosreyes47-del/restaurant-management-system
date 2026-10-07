/**
 * ============================================================================
 * RESTAURANT MANAGEMENT SYSTEM (In-Memory & Supabase Cloud Project)
 * File: js/pos.js
 * Description: Ordering System, Cart Management, Payment (Cash, GCash/Maya,
 *              Discounts, Quick Cash), and Authentic Thermal Receipt Generation.
 * ============================================================================
 */

let posActiveCategory = 'All';
let posSearchQuery = '';

// Active checkout context (null = current cart, or order object = pending order payment)
let activePaymentOrder = null;
let currentDiscountType = 'none'; // 'none' | 'senior_pwd' (20%) | 'student' (10%)

/**
 * Renders the Menu Grid for POS / Customer Ordering
 */
function renderPOSMenu(targetGridId = 'posFoodGrid') {
  const grid = document.getElementById(targetGridId);
  if (!grid) return;

  // Filter items based on active category and search
  const filtered = menuItems.filter(item => {
    const matchesCategory = (posActiveCategory === 'All' || item.category === posActiveCategory);
    const matchesSearch = item.name.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
                          item.id.toLowerCase().includes(posSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🍽️</div>
        <p style="font-size: 1.1rem; font-weight: 600;">No food items found.</p>
        <p style="font-size: 0.85rem; margin-top: 4px;">Try selecting a different category or clearing your search.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const isAvailable = item.available;
    const cardClass = isAvailable ? 'food-card' : 'food-card unavailable';
    const statusLabel = isAvailable 
      ? `<span class="food-badge" style="color: var(--success); background: var(--success-light); font-weight: 600;">In Stock</span>`
      : `<span class="food-badge" style="color: var(--danger); background: var(--danger-light); font-weight: 600;">Out of Stock</span>`;

    const emoji = typeof getItemEmoji === 'function' ? getItemEmoji(item.name, item.category) : '🍽️';

    // Quantity selector before adding
    const qtySelectorHtml = isAvailable
      ? `
        <div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 0.6rem;">
          <div style="display: flex; align-items: center; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; background: #f8fafc;">
            <button type="button" class="qty-btn" style="width: 28px; height: 28px; border: none; background: transparent;" onclick="changeCardQty('${targetGridId}-${item.id}', -1)" title="Decrease quantity">−</button>
            <input type="number" id="cardQty-${targetGridId}-${item.id}" value="1" min="1" max="99" style="width: 34px; border: none; background: transparent; text-align: center; font-weight: bold; font-size: 0.85rem;" onchange="validateCardQtyInput(this)">
            <button type="button" class="qty-btn" style="width: 28px; height: 28px; border: none; background: transparent;" onclick="changeCardQty('${targetGridId}-${item.id}', 1)" title="Increase quantity">+</button>
          </div>
          <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="addCardItemToCart('${item.id}', '${targetGridId}')" title="Add to Cart">
            ➕ Add
          </button>
        </div>
      `
      : `
        <div style="margin-top: 0.6rem;">
          <button class="btn btn-secondary btn-sm btn-block" disabled>
            Out of Stock
          </button>
        </div>
      `;

    return `
      <div class="${cardClass}">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem;">
            <span class="food-badge">${item.category}</span>
            ${statusLabel}
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="font-size: 1.6rem;">${emoji}</span>
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${item.id}</div>
              <h4 class="food-card-title" style="margin-bottom: 0;">${item.name}</h4>
            </div>
          </div>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; line-height: 1.35;">
            ${item.description || 'Delicious freshly prepared dish.'}
          </p>
        </div>
        <div>
          <div class="food-card-price">${formatCurrency(item.price)}</div>
          ${qtySelectorHtml}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Changes card quantity input value before adding
 */
function changeCardQty(elemKey, change) {
  const input = document.getElementById(`cardQty-${elemKey}`);
  if (!input) return;
  let val = parseInt(input.value, 10) || 1;
  val = Math.max(1, Math.min(99, val + change));
  input.value = val;
}

/**
 * Validates card quantity input
 */
function validateCardQtyInput(input) {
  let val = parseInt(input.value, 10);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 99) val = 99;
  input.value = val;
}

/**
 * Adds an item with specified quantity from card to cart
 */
function addCardItemToCart(itemId, targetGridId) {
  const input = document.getElementById(`cardQty-${targetGridId}-${itemId}`);
  const qty = input ? (parseInt(input.value, 10) || 1) : 1;
  addToCart(itemId, qty);
  if (input) input.value = 1; // Reset card qty back to 1
}

/**
 * Filter POS menu by category
 */
function setPOSCategoryFilter(category, btnElement, targetFilterContainerId = 'posCategoryFilters') {
  posActiveCategory = category;

  const container = document.getElementById(targetFilterContainerId);
  if (container) {
    const buttons = container.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
  }

  renderPOSMenu('posFoodGrid');
  renderPOSMenu('customerFoodGrid');
}

/**
 * Filter POS menu by search
 */
function handlePOSSearch(e) {
  posSearchQuery = e.target.value.trim();
  renderPOSMenu('posFoodGrid');
  renderPOSMenu('customerFoodGrid');
}

// ============================================================================
// CART MANAGEMENT (In-Memory Array Operations)
// ============================================================================

/**
 * Adds an item to the active cart with availability check and custom quantity
 */
function addToCart(itemId, quantity = 1) {
  const menuItem = menuItems.find(i => i.id === itemId);
  if (!menuItem) {
    showToast('Item not found!', 'error');
    return;
  }

  // Requirement: Prevent ordering unavailable food
  if (!menuItem.available) {
    showToast(`Sorry, "${menuItem.name}" is currently unavailable/out of stock!`, 'warning');
    return;
  }

  const addQty = Math.max(1, parseInt(quantity, 10) || 1);

  // Check if item is already in cart
  const cartItem = activeCart.find(i => i.id === itemId);
  if (cartItem) {
    cartItem.quantity += addQty;
    cartItem.subtotal = cartItem.quantity * cartItem.price;
  } else {
    activeCart.push({
      id: menuItem.id,
      name: menuItem.name,
      category: menuItem.category,
      price: menuItem.price,
      quantity: addQty,
      subtotal: menuItem.price * addQty
    });
  }

  showToast(`Added ${addQty > 1 ? addQty + '× ' : ''}"${menuItem.name}" to tray.`, 'success');
  updateCartDisplay();
}

/**
 * Modifies quantity of an item in the cart (+1 or -1)
 */
function updateCartQuantity(itemId, change) {
  const itemIndex = activeCart.findIndex(i => i.id === itemId);
  if (itemIndex === -1) return;

  const item = activeCart[itemIndex];
  const newQty = item.quantity + change;

  if (newQty <= 0) {
    removeFromCart(itemId);
  } else {
    item.quantity = newQty;
    item.subtotal = item.quantity * item.price;
    updateCartDisplay();
  }
}

/**
 * Sets explicit quantity for item in cart
 */
function setCartItemQuantity(itemId, qtyInput) {
  const item = activeCart.find(i => i.id === itemId);
  if (!item) return;

  let val = parseInt(qtyInput.value, 10);
  if (isNaN(val) || val <= 0) {
    removeFromCart(itemId);
  } else {
    item.quantity = Math.min(99, val);
    item.subtotal = item.quantity * item.price;
    updateCartDisplay();
  }
}

/**
 * Removes an item completely from the cart
 */
function removeFromCart(itemId) {
  const itemIndex = activeCart.findIndex(i => i.id === itemId);
  if (itemIndex !== -1) {
    const removedName = activeCart[itemIndex].name;
    activeCart.splice(itemIndex, 1);
    showToast(`Removed "${removedName}" from cart.`, 'info');
    updateCartDisplay();
  }
}

/**
 * Clears all items from the current active cart
 */
function clearCart(silent = false) {
  if (activeCart.length === 0) return;
  
  if (silent || confirm('Are you sure you want to clear all items in the cart?')) {
    activeCart = [];
    updateCartDisplay();
    if (!silent) showToast('Cart cleared.', 'info');
  }
}

/**
 * Calculates current cart subtotal and total
 */
function calculateCartTotals() {
  const subtotal = activeCart.reduce((acc, item) => acc + item.subtotal, 0);
  const itemCount = activeCart.reduce((acc, item) => acc + item.quantity, 0);
  return {
    subtotal,
    total: subtotal,
    itemCount
  };
}

/**
 * Updates cart HTML representation in both Cashier POS and Customer Portal
 */
function updateCartDisplay() {
  const { subtotal, total, itemCount } = calculateCartTotals();

  // Update Cashier POS subtotal and total displays
  const posSubtotalSpan = document.getElementById('posCartSubtotalAmount');
  if (posSubtotalSpan) posSubtotalSpan.textContent = formatCurrency(subtotal);

  // Render for Cashier POS
  renderCartToContainer('posCartItemsContainer', 'posCartTotalAmount', 'posCartCount', 'btnCheckoutPOS');

  // Render for Customer Kiosk
  renderCartToContainer('customerCartItemsContainer', 'customerCartTotalAmount', 'customerCartCount', 'btnCustomerPlaceOrder');
}

/**
 * Reusable helper to render cart items into DOM
 */
function renderCartToContainer(containerId, totalSpanId, countBadgeId, checkoutBtnId) {
  const container = document.getElementById(containerId);
  const totalSpan = document.getElementById(totalSpanId);
  const countBadge = document.getElementById(countBadgeId);
  const checkoutBtn = document.getElementById(checkoutBtnId);

  const { total, itemCount } = calculateCartTotals();

  if (countBadge) countBadge.textContent = `${itemCount} items`;
  if (totalSpan) totalSpan.textContent = formatCurrency(total);
  if (checkoutBtn) checkoutBtn.disabled = (activeCart.length === 0);

  if (!container) return;

  if (activeCart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <span>🛒</span>
        <p style="font-weight: 600; color: var(--secondary);">Your tray is empty.</p>
        <p style="font-size: 0.8rem; margin-top: 4px; color: var(--text-muted);">Select delicious items from the menu to build an order.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = activeCart.map(item => {
    const emoji = typeof getItemEmoji === 'function' ? getItemEmoji(item.name, item.category) : '🍽️';
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${emoji} ${item.name}</div>
          <div class="cart-item-price">${formatCurrency(item.price)} each</div>
        </div>
        <div class="cart-qty-controls">
          <button class="qty-btn" onclick="updateCartQuantity('${item.id}', -1)" title="Decrease quantity">−</button>
          <input type="number" class="cart-qty-display" value="${item.quantity}" min="1" max="99" onchange="setCartItemQuantity('${item.id}', this)" style="border: 1px solid var(--border); border-radius: 4px; height: 28px; text-align: center;">
          <button class="qty-btn" onclick="updateCartQuantity('${item.id}', 1)" title="Increase quantity">+</button>
        </div>
        <div class="cart-item-subtotal">${formatCurrency(item.subtotal)}</div>
        <button class="cart-remove-btn" onclick="removeFromCart('${item.id}')" title="Remove item">✕</button>
      </div>
    `;
  }).join('');
}

// ============================================================================
// PAYMENT & CHECKOUT PROCESSING (With Discounts, E-Wallets & Quick Cash)
// ============================================================================

/**
 * Opens Cashier Payment Modal for current active cart
 */
function openPaymentModal() {
  if (activeCart.length === 0) {
    showToast('Cart is empty! Please add items before checking out.', 'warning');
    return;
  }
  activePaymentOrder = null; // checkout current cart
  setupPaymentModalUI(calculateCartTotals().total, 'Walk-in Customer', 'Dine-In');
}

/**
 * Opens Cashier Payment Modal to pay for a pending order
 */
function openPaymentModalForOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    showToast('Order not found!', 'error');
    return;
  }
  activePaymentOrder = order;
  setupPaymentModalUI(order.total, order.customerName, order.orderType || 'Dine-In');
}

/**
 * Configures the Payment Modal fields and displays it
 */
function setupPaymentModalUI(baseAmount, defaultCustomerName, defaultOrderType) {
  currentDiscountType = 'none';

  document.getElementById('paymentDiscountSelect').value = 'none';
  document.getElementById('paymentMethodSelect').value = 'Cash';
  document.getElementById('paymentGcashRefGroup').style.display = 'none';
  document.getElementById('paymentGcashRef').value = '';
  document.getElementById('quickCashButtonsContainer').style.display = 'flex';

  document.getElementById('paymentCustomerName').value = defaultCustomerName || 'Walk-in Customer';
  document.getElementById('paymentOrderType').value = defaultOrderType || 'Dine-In';

  updatePaymentCalculations();

  document.getElementById('paymentCustomerCash').value = '';
  document.getElementById('paymentChangeRow').style.display = 'none';
  document.getElementById('paymentErrorMessage').style.display = 'none';

  openModal('paymentModal');
  setTimeout(() => document.getElementById('paymentCustomerCash').focus(), 150);
}

/**
 * Calculates discount and net total amount due in modal
 */
function getPaymentAmounts() {
  const rawSubtotal = activePaymentOrder ? activePaymentOrder.subtotal : calculateCartTotals().total;
  let discountRate = 0;
  let discountLabel = 'None (0%)';

  const discountVal = document.getElementById('paymentDiscountSelect')?.value || 'none';
  if (discountVal === 'senior_pwd') {
    discountRate = 0.20; // 20% Senior/PWD discount
    discountLabel = 'Senior/PWD (20%)';
  } else if (discountVal === 'student') {
    discountRate = 0.10; // 10% Student discount
    discountLabel = 'Student (10%)';
  }

  const discountAmount = rawSubtotal * discountRate;
  const netTotal = Math.max(0, rawSubtotal - discountAmount);

  return {
    rawSubtotal,
    discountRate,
    discountLabel,
    discountAmount,
    netTotal
  };
}

/**
 * Re-calculates and updates payment modal display
 */
function updatePaymentCalculations() {
  const { rawSubtotal, discountAmount, netTotal } = getPaymentAmounts();

  const subtotalRow = document.getElementById('paymentSubtotalRow');
  const discountRow = document.getElementById('paymentDiscountRow');
  const discountDisplay = document.getElementById('paymentDiscountDisplay');
  const totalDisplay = document.getElementById('paymentTotalDisplay');

  if (discountAmount > 0) {
    if (subtotalRow) subtotalRow.style.display = 'flex';
    if (discountRow) discountRow.style.display = 'flex';
    document.getElementById('paymentSubtotalDisplay').textContent = formatCurrency(rawSubtotal);
    if (discountDisplay) discountDisplay.textContent = `-${formatCurrency(discountAmount)}`;
  } else {
    if (subtotalRow) subtotalRow.style.display = 'none';
    if (discountRow) discountRow.style.display = 'none';
  }

  if (totalDisplay) totalDisplay.textContent = formatCurrency(netTotal);

  // Re-check cash input if filled
  const cashInput = document.getElementById('paymentCustomerCash');
  if (cashInput && cashInput.value) {
    handlePaymentCashInput({ target: cashInput });
  }
}

/**
 * Changes discount selection in payment modal
 */
function handleDiscountChange() {
  updatePaymentCalculations();
}

/**
 * Switches payment method (Cash vs GCash/Maya)
 */
function handlePaymentMethodChange() {
  const method = document.getElementById('paymentMethodSelect').value;
  const gcashGroup = document.getElementById('paymentGcashRefGroup');
  const quickCash = document.getElementById('quickCashButtonsContainer');
  const cashInput = document.getElementById('paymentCustomerCash');
  const { netTotal } = getPaymentAmounts();

  if (method === 'GCash' || method === 'Maya') {
    gcashGroup.style.display = 'block';
    quickCash.style.display = 'none';
    cashInput.value = netTotal.toFixed(2);
    cashInput.setAttribute('readonly', 'true');
    handlePaymentCashInput({ target: cashInput });
  } else {
    gcashGroup.style.display = 'none';
    quickCash.style.display = 'flex';
    cashInput.removeAttribute('readonly');
    cashInput.value = '';
    document.getElementById('paymentChangeRow').style.display = 'none';
    document.getElementById('paymentErrorMessage').style.display = 'none';
  }
}

/**
 * Quick Cash Button handler (Exact, ₱100, ₱200, ₱500, ₱1000)
 */
function setQuickCash(amountType) {
  const { netTotal } = getPaymentAmounts();
  const cashInput = document.getElementById('paymentCustomerCash');
  if (!cashInput) return;

  if (amountType === 'exact') {
    cashInput.value = netTotal.toFixed(2);
  } else {
    cashInput.value = amountType;
  }
  handlePaymentCashInput({ target: cashInput });
}

/**
 * Computes change in real-time as cashier types payment cash
 */
function handlePaymentCashInput(e) {
  const cashAmount = parseFloat(e.target.value);
  const { netTotal } = getPaymentAmounts();
  const changeDisplay = document.getElementById('paymentChangeDisplay');
  const changeRow = document.getElementById('paymentChangeRow');
  const errorMsg = document.getElementById('paymentErrorMessage');

  if (isNaN(cashAmount) || cashAmount <= 0) {
    changeRow.style.display = 'none';
    errorMsg.style.display = 'none';
    return;
  }

  if (cashAmount < netTotal) {
    const shortage = netTotal - cashAmount;
    errorMsg.textContent = `Insufficient payment: Need ₱${shortage.toFixed(2)} more!`;
    errorMsg.style.display = 'block';
    changeRow.style.display = 'none';
  } else {
    const change = cashAmount - netTotal;
    errorMsg.style.display = 'none';
    changeRow.style.display = 'flex';
    changeDisplay.textContent = formatCurrency(change);
  }
}

/**
 * Processes Cashier Order and Validates Payment
 */
function processCashierOrder() {
  const { rawSubtotal, discountLabel, discountAmount, netTotal } = getPaymentAmounts();
  const cashInput = document.getElementById('paymentCustomerCash');
  const cashAmount = parseFloat(cashInput.value);
  const customerName = document.getElementById('paymentCustomerName').value.trim() || 'Walk-in Customer';
  const orderType = document.getElementById('paymentOrderType').value || 'Dine-In';
  const paymentMethod = document.getElementById('paymentMethodSelect').value || 'Cash';
  const gcashRef = document.getElementById('paymentGcashRef')?.value.trim();

  if (paymentMethod !== 'Cash' && !gcashRef) {
    showToast(`Please enter the ${paymentMethod} reference number!`, 'warning');
    document.getElementById('paymentGcashRef').focus();
    return;
  }

  // Strict Validation: Prevent payment lower than the net total
  if (isNaN(cashAmount) || cashAmount < netTotal) {
    showToast(`Payment cannot be less than total amount due of ${formatCurrency(netTotal)}!`, 'error');
    cashInput.focus();
    return;
  }

  const change = Math.max(0, cashAmount - netTotal);
  const timestamp = getCurrentDateTimeString();

  let targetOrder = null;

  if (activePaymentOrder) {
    // --- PAYING FOR AN EXISTING PENDING ORDER ---
    targetOrder = activePaymentOrder;
    targetOrder.subtotal = rawSubtotal;
    targetOrder.discountLabel = discountAmount > 0 ? discountLabel : null;
    targetOrder.discountAmount = discountAmount;
    targetOrder.total = netTotal;
    targetOrder.payment = cashAmount;
    targetOrder.change = change;
    targetOrder.paymentMethod = paymentMethod + (gcashRef ? ` (Ref: ${gcashRef})` : '');
    targetOrder.status = 'Completed';
    targetOrder.processedBy = currentUser ? currentUser.name : 'Cashier';

    // Update in Supabase
    if (typeof dbUpdateOrderStatus === 'function') {
      dbUpdateOrderStatus(targetOrder.id, 'Completed', cashAmount, change);
    }

    showToast(`Order ${targetOrder.id} successfully completed and paid!`, 'success');
  } else {
    // --- NEW ORDER CHECKOUT FROM ACTIVE CART ---
    const newOrderId = generateNextOrderId();

    targetOrder = {
      id: newOrderId,
      customerName: `${customerName} (${orderType})`,
      items: JSON.parse(JSON.stringify(activeCart)),
      subtotal: rawSubtotal,
      discountLabel: discountAmount > 0 ? discountLabel : null,
      discountAmount: discountAmount,
      total: netTotal,
      payment: cashAmount,
      change: change,
      paymentMethod: paymentMethod + (gcashRef ? ` (Ref: ${gcashRef})` : ''),
      status: 'Completed',
      timestamp: timestamp,
      orderType: orderType,
      processedBy: currentUser ? currentUser.name : 'Cashier'
    };

    orders.unshift(targetOrder);

    // Sync to Supabase Cloud Database if connected
    if (typeof dbSaveOrder === 'function') {
      dbSaveOrder(targetOrder);
    }

    // Clear the active cart after successful payment processing
    clearCart(true);
    showToast(`Order ${newOrderId} successfully processed!`, 'success');
  }

  // Close payment modal
  closeModal('paymentModal');
  activePaymentOrder = null;

  // Update views
  if (typeof renderOrdersTable === 'function') renderOrdersTable();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderSalesSummary === 'function') renderSalesSummary();

  // Automatically show printable receipt
  displayReceipt(targetOrder);
}

/**
 * Customer Self-Service Order Submission (Kiosk Mode)
 */
function processCustomerOrder() {
  if (activeCart.length === 0) {
    showToast('Cart is empty! Please select items first.', 'warning');
    return;
  }

  const customerName = prompt('Please enter your Name or Table Number:', 'Table 5');
  if (!customerName || customerName.trim() === '') {
    showToast('Order cancelled: Name/Table required.', 'info');
    return;
  }

  const { total } = calculateCartTotals();
  const newOrderId = generateNextOrderId();
  const timestamp = getCurrentDateTimeString();

  const newOrder = {
    id: newOrderId,
    customerName: customerName.trim(),
    items: JSON.parse(JSON.stringify(activeCart)),
    subtotal: total,
    total: total,
    payment: 0,
    change: 0,
    paymentMethod: 'Unpaid (Pending at Counter)',
    status: 'Pending',
    timestamp: timestamp,
    orderType: 'Dine-In',
    processedBy: 'Self-Service Kiosk'
  };

  orders.unshift(newOrder);

  // Sync to Supabase Cloud Database
  if (typeof dbSaveOrder === 'function') {
    dbSaveOrder(newOrder);
  }

  clearCart(true);

  // Set the order ID in the tracking field for instant status check
  const trackInput = document.getElementById('customerTrackOrderId');
  if (trackInput) {
    trackInput.value = newOrderId;
    if (typeof trackCustomerOrder === 'function') trackCustomerOrder();
  }

  showToast(`🎉 Order ${newOrderId} placed! Proceed to counter for payment.`, 'success');

  if (typeof renderOrdersTable === 'function') renderOrdersTable();
  if (typeof renderDashboard === 'function') renderDashboard();
}

// ============================================================================
// RECEIPT GENERATION & PRINTING
// ============================================================================

/**
 * Generates and opens the Thermal-style Receipt Modal
 */
function displayReceipt(order) {
  const receiptContainer = document.getElementById('receiptContent');
  if (!receiptContainer) return;

  const itemRows = order.items.map(item => `
    <tr>
      <td class="col-item">
        <strong>${item.name}</strong><br>
        <span style="font-size: 0.7rem; color: #475569;">${formatCurrency(item.price)} × ${item.quantity}</span>
      </td>
      <td class="col-qty">${item.quantity}</td>
      <td class="col-subtotal">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('');

  // Discount row if applicable
  const discountRowHtml = (order.discountAmount && order.discountAmount > 0)
    ? `
      <div class="receipt-totals-row" style="color: #166534;">
        <span>Discount (${order.discountLabel || 'Applied'}):</span>
        <span>-${formatCurrency(order.discountAmount)}</span>
      </div>
    `
    : '';

  receiptContainer.innerHTML = `
    <div class="receipt-wrapper">
      <div class="receipt-header">
        <div class="receipt-title">SAVORY BITES RESTAURANT</div>
        <div class="receipt-tagline">Authentic Flavors & Fresh Cooking</div>
        <div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">University Campus Food Strip, Block 4</div>
        <div class="receipt-meta">
          <div class="receipt-meta-row">
            <span>Order #: <strong>${order.id}</strong></span>
            <span>Status: <strong>${order.status}</strong></span>
          </div>
          <div class="receipt-meta-row">
            <span>Date: ${order.timestamp}</span>
          </div>
          <div class="receipt-meta-row">
            <span>Customer: ${order.customerName}</span>
          </div>
          <div class="receipt-meta-row">
            <span>Server: ${order.processedBy || 'Staff'}</span>
          </div>
        </div>
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th class="col-item">ITEM</th>
            <th class="col-qty">QTY</th>
            <th class="col-subtotal">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="receipt-totals">
        <div class="receipt-totals-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>
        ${discountRowHtml}
        <div class="receipt-totals-row grand-total">
          <span>TOTAL AMOUNT:</span>
          <span>${formatCurrency(order.total)}</span>
        </div>
        <div class="receipt-totals-row">
          <span>Method:</span>
          <span>${order.paymentMethod || 'Cash'}</span>
        </div>
        <div class="receipt-totals-row">
          <span>Payment Tendered:</span>
          <span>${formatCurrency(order.payment)}</span>
        </div>
        <div class="receipt-totals-row">
          <span>Change:</span>
          <span>${formatCurrency(order.change)}</span>
        </div>
      </div>

      <div class="receipt-footer">
        <div>*** THANK YOU FOR DINING WITH US! ***</div>
        <div style="margin-top: 3px;">Please come again soon!</div>
        <div style="font-size: 0.65rem; margin-top: 6px; color: #94a3b8;">
          System: In-Memory & Supabase RMS v2.0
        </div>
      </div>
    </div>
  `;

  openModal('receiptModal');
}

/**
 * Triggers native browser print dialog for the receipt
 */
function printReceipt() {
  window.print();
}
