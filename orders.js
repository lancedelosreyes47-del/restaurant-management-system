/**
 * ============================================================================
 * RESTAURANT MANAGEMENT SYSTEM (In-Memory & Supabase Cloud Project)
 * File: js/orders.js
 * Description: Order status management, transitions, customer order tracking,
 *              and CSV data export.
 * ============================================================================
 */

let activeOrderStatusFilter = 'All';
let ordersSearchQuery = '';

/**
 * Returns appropriate CSS class badge for each order status
 */
function getOrderStatusBadge(status) {
  switch (status) {
    case 'Pending':
      return `<span class="badge badge-pending">⏳ Pending</span>`;
    case 'Preparing':
      return `<span class="badge badge-preparing">🍳 Preparing</span>`;
    case 'Ready':
      return `<span class="badge badge-ready">🔔 Ready</span>`;
    case 'Completed':
      return `<span class="badge badge-completed">✅ Completed</span>`;
    case 'Cancelled':
      return `<span class="badge badge-cancelled">❌ Cancelled</span>`;
    default:
      return `<span class="badge">${status}</span>`;
  }
}

/**
 * Renders the Orders List for Staff and Admin
 */
function renderOrdersTable() {
  const tableBody = document.getElementById('ordersTableBody');
  if (!tableBody) return;

  const query = ordersSearchQuery.toLowerCase();

  const filteredOrders = orders.filter(order => {
    const matchesStatus = (activeOrderStatusFilter === 'All' || order.status === activeOrderStatusFilter);
    const matchesSearch = !query ||
      order.id.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.items.some(i => i.name.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  if (filteredOrders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <p style="font-weight: 600;">No orders found matching criteria.</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filteredOrders.map(order => {
    // Format ordered items as readable list
    const itemsSummary = order.items.map(i => {
      const emoji = typeof getItemEmoji === 'function' ? getItemEmoji(i.name, i.category) : '🍽️';
      return `${emoji} ${i.name} (×${i.quantity})`;
    }).join(', ');

    const isPaid = (order.payment && order.payment >= order.total);
    const paymentPill = isPaid
      ? `<span style="font-size: 0.75rem; color: var(--success); font-weight: 600;">● Paid (${order.paymentMethod || 'Cash'})</span>`
      : `<span style="font-size: 0.75rem; color: var(--warning); font-weight: 600;">○ Unpaid (Pending at Counter)</span>`;

    // Generate status transition controls
    let statusActionButtons = '';
    if (order.status === 'Pending') {
      statusActionButtons = `
        <button class="btn btn-sm btn-success" onclick="openPaymentModalForOrder('${order.id}')" title="Accept Cash/GCash at counter">💵 Pay & Complete</button>
        <button class="btn btn-sm btn-primary" onclick="updateOrderStatus('${order.id}', 'Preparing')">Start Kitchen</button>
        <button class="btn btn-sm btn-danger" onclick="cancelOrder('${order.id}')">Cancel</button>
      `;
    } else if (order.status === 'Preparing') {
      statusActionButtons = `
        <button class="btn btn-sm btn-success" onclick="updateOrderStatus('${order.id}', 'Ready')">Mark Ready</button>
        ${!isPaid ? `<button class="btn btn-sm btn-warning" onclick="openPaymentModalForOrder('${order.id}')">💵 Pay</button>` : ''}
        <button class="btn btn-sm btn-danger" onclick="cancelOrder('${order.id}')">Cancel</button>
      `;
    } else if (order.status === 'Ready') {
      statusActionButtons = `
        ${!isPaid 
          ? `<button class="btn btn-sm btn-success" onclick="openPaymentModalForOrder('${order.id}')">💵 Pay & Complete</button>`
          : `<button class="btn btn-sm btn-success" onclick="updateOrderStatus('${order.id}', 'Completed')">Complete Order</button>`
        }
      `;
    } else {
      // Completed or Cancelled
      statusActionButtons = `<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">No actions</span>`;
    }

    return `
      <tr>
        <td>
          <strong>${order.id}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${order.orderType || 'Dine-In'}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--secondary);">${order.customerName}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${order.timestamp}</div>
        </td>
        <td style="max-width: 280px;">
          <div style="font-size: 0.85rem; line-height: 1.4;">${itemsSummary}</div>
          <div style="margin-top: 3px;">${paymentPill}</div>
        </td>
        <td>
          <div style="font-size: 1.05rem; font-weight: 700; color: var(--primary);">${formatCurrency(order.total)}</div>
          ${order.discountAmount ? `<div style="font-size: 0.75rem; color: var(--success); font-weight: 600;">Saved: ${formatCurrency(order.discountAmount)}</div>` : ''}
        </td>
        <td>${getOrderStatusBadge(order.status)}</td>
        <td>
          <div style="display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap;">
            ${statusActionButtons}
            <button class="btn btn-sm btn-secondary" onclick="viewOrderReceipt('${order.id}')" title="View / Print Receipt">
              🧾 Receipt
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Filter orders list by status tab
 */
function setOrderStatusFilter(status, btnElement) {
  activeOrderStatusFilter = status;

  const buttons = document.querySelectorAll('#orderStatusFilters .filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

  renderOrdersTable();
}

/**
 * Search orders by input
 */
function handleOrdersSearch(e) {
  ordersSearchQuery = e.target.value.trim();
  renderOrdersTable();
}

/**
 * Updates an order's status in memory and syncs to Supabase
 */
function updateOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    showToast('Order not found!', 'error');
    return;
  }

  // If completing an unpaid order, redirect to payment modal
  if (newStatus === 'Completed' && (!order.payment || order.payment < order.total)) {
    if (typeof openPaymentModalForOrder === 'function') {
      openPaymentModalForOrder(orderId);
      return;
    } else {
      // If payment modal is not available, still complete the order
      // (for in-memory/fallback operation)
      order.status = newStatus;
      showToast(`Order ${orderId} completed without payment (In-Memory Mode)`, 'info');
      // Continue with sync and re-renders
    }
  }

  order.status = newStatus;
  showToast(`Order ${orderId} updated to: ${newStatus}`, 'success');

  // Sync status update to Supabase Cloud Database
  if (typeof dbUpdateOrderStatus === 'function') {
    dbUpdateOrderStatus(orderId, newStatus, order.payment, order.change);
  }

  renderOrdersTable();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderSalesSummary === 'function') renderSalesSummary();
}

/**
 * Cancels an order with confirmation
 */
function cancelOrder(orderId) {
  if (confirm(`Are you sure you want to cancel order ${orderId}?`)) {
    updateOrderStatus(orderId, 'Cancelled');
  }
}

/**
 * Opens receipt for an existing order by ID
 */
function viewOrderReceipt(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    showToast('Order not found!', 'error');
    return;
  }
  displayReceipt(order);
}

// ============================================================================
// CUSTOMER ORDER TRACKER (Self-Service)
// ============================================================================

/**
 * Looks up an order by ID and displays status progress
 */
function trackCustomerOrder() {
  const input = document.getElementById('customerTrackOrderId');
  const resultDiv = document.getElementById('customerTrackResult');
  if (!input || !resultDiv) return;

  const queryId = input.value.trim().toUpperCase();
  if (!queryId) {
    showToast('Please enter an Order ID to track!', 'warning');
    return;
  }

  const order = orders.find(o => o.id.toUpperCase() === queryId);

  if (!order) {
    resultDiv.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--danger); background: var(--danger-light); border-radius: var(--radius-md);">
        <h3>⚠️ Order Not Found</h3>
        <p style="margin-top: 0.5rem; font-size: 0.9rem;">
          No order was found with ID <strong>${queryId}</strong>.<br>
          Please double check the Order ID on your ticket or ask the cashier.
        </p>
      </div>
    `;
    return;
  }

  const statuses = ['Pending', 'Preparing', 'Ready', 'Completed'];
  const currentIndex = statuses.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  let stepsHtml = '';
  if (isCancelled) {
    stepsHtml = `
      <div style="background: var(--danger-light); color: var(--danger); padding: 1rem; border-radius: var(--radius-sm); font-weight: 700; text-align: center;">
        ❌ This order has been CANCELLED.
      </div>
    `;
  } else {
    stepsHtml = `
      <div style="display: flex; justify-content: space-between; margin: 1.5rem 0; position: relative;">
        ${statuses.map((s, idx) => {
          const isDoneOrCurrent = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const circleColor = isCurrent ? 'var(--primary)' : (isDoneOrCurrent ? 'var(--success)' : '#cbd5e1');
          const textColor = isCurrent ? 'var(--primary)' : (isDoneOrCurrent ? 'var(--secondary)' : '#94a3b8');
          const weight = isCurrent ? '700' : '500';

          return `
            <div style="text-align: center; flex: 1; z-index: 2;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background: ${circleColor}; color: #fff; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.4rem; font-weight: bold; font-size: 0.9rem;">
                ${idx + 1}
              </div>
              <div style="font-size: 0.8rem; color: ${textColor}; font-weight: ${weight};">${s}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  const itemsList = order.items.map(i => {
    const emoji = typeof getItemEmoji === 'function' ? getItemEmoji(i.name, i.category) : '🍽️';
    return `
      <li style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #e2e8f0; font-size: 0.85rem;">
        <span>${emoji} ${i.name} × ${i.quantity}</span>
        <strong>${formatCurrency(i.subtotal)}</strong>
      </li>
    `;
  }).join('');

  resultDiv.innerHTML = `
    <div style="background: #fff; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.5rem; box-shadow: var(--shadow-sm);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
        <div>
          <h3 style="font-size: 1.2rem; color: var(--secondary);">${order.id}</h3>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${order.timestamp}</span>
        </div>
        <div>
          ${getOrderStatusBadge(order.status)}
        </div>
      </div>

      ${stepsHtml}

      <div style="background: #f8fafc; padding: 1rem; border-radius: var(--radius-sm); margin-top: 1rem;">
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">Order Breakdown</h4>
        <ul style="list-style: none; padding: 0;">
          ${itemsList}
        </ul>
        <div style="display: flex; justify-content: space-between; margin-top: 0.75rem; font-size: 1.1rem; font-weight: 700; color: var(--secondary);">
          <span>Total Amount:</span>
          <span style="color: var(--primary);">${formatCurrency(order.total)}</span>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-muted);">
          Payment Status: <strong>${order.payment >= order.total ? 'Paid (' + (order.paymentMethod || 'Cash') + ')' : 'Pending Payment at Counter'}</strong>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// EXPORT DATA (CSV Format for School Demonstrations)
// ============================================================================

function exportOrdersToCSV() {
  if (orders.length === 0) {
    showToast('No orders available to export!', 'warning');
    return;
  }

  let csv = 'Order ID,Customer,Date Time,Order Type,Status,Subtotal,Discount,Total,Payment Method,Cashier\n';
  orders.forEach(o => {
    const cust = `"${(o.customerName || '').replace(/"/g, '""')}"`;
    const sub = o.subtotal || o.total;
    const disc = o.discountAmount || 0;
    const tot = o.total;
    const method = `"${(o.paymentMethod || 'Cash').replace(/"/g, '""')}"`;
    const cashier = `"${(o.processedBy || 'Staff').replace(/"/g, '""')}"`;

    csv += `${o.id},${cust},${o.timestamp},${o.orderType || 'Dine-In'},${o.status},${sub},${disc},${tot},${method},${cashier}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `restaurant_orders_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Orders successfully exported to CSV!', 'success');
}
