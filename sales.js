/**
 * ============================================================================
 * RESTAURANT MANAGEMENT SYSTEM (In-Memory & Supabase Cloud Project)
 * File: js/sales.js
 * Description: Analytics, Dashboard KPIs, Average Order Value (AOV),
 *              and Printable Sales Summary reporting.
 * ============================================================================
 */

/**
 * Calculates most ordered food items based on completed orders
 */
function getFoodPopularityStats() {
  const itemMap = {};

  orders
    .filter(order => order.status === 'Completed')
    .forEach(order => {
      order.items.forEach(item => {
        if (!itemMap[item.id]) {
          itemMap[item.id] = {
            id: item.id,
            name: item.name,
            category: item.category || 'Food',
            price: item.price,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        itemMap[item.id].totalQuantity += item.quantity;
        itemMap[item.id].totalRevenue += item.subtotal;
      });
    });

  // Convert map to sorted array (highest quantity sold first)
  return Object.values(itemMap).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

/**
 * Renders the KPI metrics on the Admin Dashboard
 */
function renderDashboard() {
  const totalMenuSpan = document.getElementById('dashTotalMenu');
  const availableItemsSpan = document.getElementById('dashAvailableItems');
  const pendingOrdersSpan = document.getElementById('dashPendingOrders');
  const completedOrdersSpan = document.getElementById('dashCompletedOrders');
  const totalSalesSpan = document.getElementById('dashTotalSales');
  const mostOrderedSpan = document.getElementById('dashMostOrdered');

  if (!totalMenuSpan) return;

  const totalMenuItems = menuItems.length;
  const availableItems = menuItems.filter(i => i.available).length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const completedOrders = orders.filter(o => o.status === 'Completed').length;

  const totalSalesAmount = orders
    .filter(o => o.status === 'Completed')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const popularityList = getFoodPopularityStats();
  const topFood = popularityList.length > 0 
    ? `${typeof getItemEmoji === 'function' ? getItemEmoji(popularityList[0].name, popularityList[0].category) : '🍽️'} ${popularityList[0].name} (${popularityList[0].totalQuantity} units sold)`
    : 'None yet';

  totalMenuSpan.textContent = totalMenuItems;
  availableItemsSpan.textContent = availableItems;
  pendingOrdersSpan.textContent = pendingOrders;
  completedOrdersSpan.textContent = completedOrders;
  totalSalesSpan.textContent = formatCurrency(totalSalesAmount);
  if (mostOrderedSpan) mostOrderedSpan.textContent = topFood;

  // Render recent orders in Dashboard
  renderDashboardRecentOrders();
}

/**
 * Renders recent 5 orders on the dashboard
 */
function renderDashboardRecentOrders() {
  const container = document.getElementById('dashRecentOrdersList');
  if (!container) return;

  const recent = orders.slice(0, 5);

  if (recent.length === 0) {
    container.innerHTML = `<p style="color: var(--text-muted); padding: 1rem;">No orders recorded yet.</p>`;
    return;
  }

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        ${recent.map(o => `
          <tr>
            <td><strong>${o.id}</strong></td>
            <td>${o.customerName}</td>
            <td><strong>${formatCurrency(o.total)}</strong></td>
            <td>${getOrderStatusBadge(o.status)}</td>
            <td style="font-size: 0.8rem; color: var(--text-muted);">${o.timestamp}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Renders the Sales Summary View
 */
function renderSalesSummary() {
  const totalOrdersElem = document.getElementById('salesTotalOrders');
  const completedElem = document.getElementById('salesCompletedOrders');
  const cancelledElem = document.getElementById('salesCancelledOrders');
  const totalRevenueElem = document.getElementById('salesTotalRevenue');
  const avgOrderElem = document.getElementById('salesAvgOrderValue');
  const topSellerTable = document.getElementById('salesTopSellersBody');

  if (!totalOrdersElem) return;

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'Completed').length;
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
  const totalRevenue = orders
    .filter(o => o.status === 'Completed')
    .reduce((sum, o) => sum + o.total, 0);

  const avgOrderValue = completedOrders > 0 ? (totalRevenue / completedOrders) : 0;

  totalOrdersElem.textContent = totalOrders;
  completedElem.textContent = completedOrders;
  cancelledElem.textContent = cancelledOrders;
  totalRevenueElem.textContent = formatCurrency(totalRevenue);
  if (avgOrderElem) avgOrderElem.textContent = formatCurrency(avgOrderValue);

  // Render top-selling items breakdown
  const popularity = getFoodPopularityStats();
  if (topSellerTable) {
    if (popularity.length === 0) {
      topSellerTable.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No completed sales recorded yet.
          </td>
        </tr>
      `;
    } else {
      topSellerTable.innerHTML = popularity.map((item, index) => {
        const medal = index === 0 ? '🥇 ' : (index === 1 ? '🥈 ' : (index === 2 ? '🥉 ' : ''));
        const emoji = typeof getItemEmoji === 'function' ? getItemEmoji(item.name, item.category) : '🍽️';
        return `
          <tr>
            <td><strong>${medal}#${index + 1}</strong></td>
            <td>
              <span style="font-size: 1.2rem; margin-right: 4px;">${emoji}</span>
              <strong>${item.name}</strong> <span style="font-size: 0.8rem; color: var(--text-muted);">(${item.id})</span>
            </td>
            <td><span class="badge badge-category">${item.category}</span></td>
            <td><strong>${item.totalQuantity} units</strong></td>
            <td><strong>${formatCurrency(item.totalRevenue)}</strong></td>
          </tr>
        `;
      }).join('');
    }
  }
}

/**
 * Triggers native print dialog for Sales Summary Report
 */
function printSalesReport() {
  window.print();
}
