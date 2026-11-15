import React, { useState } from 'react'
import {
  ArrowRight,
  FileText,
  MoreHorizontal,
  Package,
  Plus,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react'

import peekingCat from '../../../assets/admin-peeking-cat.jpg'

export default function DashboardOverview({
  dashboardStats,
  recentOrders = [],
  recentPatients = [],
  setActiveTab,
  setActiveModal,
  showToast,
}) {
  const [salesHoverIndex, setSalesHoverIndex] = useState(null)

  const kpis = dashboardStats?.kpis || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    lowStockCount: 0,
  }
  const salesChart = Array.isArray(dashboardStats?.salesChart) ? dashboardStats.salesChart : []
  const topProducts = Array.isArray(dashboardStats?.topProducts) ? dashboardStats.topProducts : []
  const lowStockItems = Array.isArray(dashboardStats?.lowStockAlerts) ? dashboardStats.lowStockAlerts : []

  const maxRevenue = Math.max(100000, ...salesChart.map((pt) => Number(pt.revenue) || 0))
  const maxOrders = Math.max(10, ...salesChart.map((pt) => Number(pt.orders) || 0))

  const getSalesSvgPath = () => {
    if (salesChart.length < 2) return ''
    return salesChart
      .map((pt, i) => {
        const x = 40 + i * ((500 - 80) / (salesChart.length - 1))
        const y = 190 - ((Number(pt.revenue) || 0) / maxRevenue) * 150
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  return (
    <>
      {/* Top Greeting Banner with Peeking Cat */}
      <div className="admin-welcome-stage">
        <div className="welcome-texts-col">
          <span className="welcome-eyebrow">ADMIN DASHBOARD</span>
          <h1 className="welcome-main-title">Good to see you, Dr. Sugandhika!</h1>
          <p className="welcome-sub-desc">
            Here's what's happening at City Pet today (live database records).
          </p>
        </div>

        {/* Right Decorative Script Badge & Peeking Cat */}
        <div className="welcome-decor-visual">
          <div className="caring-script-bubble">
            <span>Caring</span>
            <span>for a brighter</span>
            <span>
              tomorrow <span className="bubble-heart">♡</span>
            </span>
          </div>
          <div className="peeking-cat-frame">
            <img
              src={peekingCat}
              alt="Curious friendly cat"
              className="peeking-cat-img"
            />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          4 KPI SUMMARY CARDS (LIVE DATABASE VALUES)
         ---------------------------------------------------- */}
      <div className="admin-kpi-cards-grid">
        {/* 1. Total Orders */}
        <div className="admin-kpi-card mint-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-bubble mint-bubble">
              <ShoppingCart size={19} />
            </div>
            <button type="button" className="kpi-more-btn" onClick={() => setActiveTab('orders')}>
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="kpi-data-body">
            <span className="kpi-metric-label">Total Orders</span>
            <div className="kpi-metric-val-row">
              <strong className="kpi-big-value">{Number(kpis.totalOrders || 0).toLocaleString()}</strong>
            </div>
            <small className="kpi-sub-text">Live database total</small>
          </div>
        </div>

        {/* 2. Revenue */}
        <div className="admin-kpi-card cyan-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-bubble cyan-bubble">
              <Wallet size={19} />
            </div>
            <button type="button" className="kpi-more-btn" onClick={() => setActiveTab('payments')}>
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="kpi-data-body">
            <span className="kpi-metric-label">Revenue</span>
            <div className="kpi-metric-val-row">
              <strong className="kpi-big-value">LKR {Number(kpis.totalRevenue || 0).toLocaleString()}</strong>
            </div>
            <small className="kpi-sub-text">Active orders revenue</small>
          </div>
        </div>

        {/* 3. Customers */}
        <div className="admin-kpi-card blue-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-bubble blue-bubble">
              <Users size={19} />
            </div>
            <button type="button" className="kpi-more-btn" onClick={() => setActiveTab('users')}>
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="kpi-data-body">
            <span className="kpi-metric-label">Customers</span>
            <div className="kpi-metric-val-row">
              <strong className="kpi-big-value">{Number(kpis.totalCustomers || 0).toLocaleString()}</strong>
            </div>
            <small className="kpi-sub-text">Registered customer accounts</small>
          </div>
        </div>

        {/* 4. Low Stock Alerts */}
        <div className="admin-kpi-card salmon-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-bubble salmon-bubble">
              <Package size={19} />
            </div>
            <button type="button" className="kpi-more-btn" onClick={() => setActiveTab('products')}>
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="kpi-data-body">
            <span className="kpi-metric-label">Low Stock Alerts</span>
            <div className="kpi-metric-val-row">
              <strong className="kpi-big-value">{Number(kpis.lowStockCount ?? lowStockItems.length).toLocaleString()}</strong>
            </div>
            <small className="kpi-sub-text">Products needing restock</small>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          QUICK ACTION BUTTONS
         ---------------------------------------------------- */}
      <div className="admin-quick-actions-bar">
        <button
          type="button"
          className="quick-action-btn primary-teal"
          onClick={() => setActiveModal('addProduct')}
        >
          <Plus size={16} />
          <span>Add Product</span>
        </button>

        <button
          type="button"
          className="quick-action-btn secondary-mint"
          onClick={() => setActiveModal('createOrder')}
        >
          <ShoppingCart size={16} />
          <span>Create Order</span>
        </button>

        <button
          type="button"
          className="quick-action-btn secondary-mint"
          onClick={() => setActiveModal('generateReport')}
        >
          <FileText size={16} />
          <span>Generate Report</span>
        </button>
      </div>

      {/* ----------------------------------------------------
          SALES & REVENUE CHART (LIVE DATA)
         ---------------------------------------------------- */}
      {salesChart.length > 0 && (
        <div className="admin-charts-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="admin-chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Sales &amp; Revenue (Live Orders)</h3>
              <div className="chart-legend-row">
                <span className="legend-chip">
                  <span className="legend-dot teal-line" /> Revenue (LKR)
                </span>
                <span className="legend-chip">
                  <span className="legend-dot mint-bar" /> Orders
                </span>
              </div>
            </div>

            <div className="svg-chart-container">
              {salesHoverIndex !== null && salesChart[salesHoverIndex] && (
                <div
                  className="interactive-chart-tooltip"
                  style={{
                    left: `${
                      40 +
                      salesHoverIndex *
                        ((500 - 80) / Math.max(1, salesChart.length - 1))
                    }px`,
                    top: '40px',
                  }}
                >
                  <div className="tooltip-date">
                    {salesChart[salesHoverIndex].date}
                  </div>
                  <div className="tooltip-stat">
                    <span className="dot teal" /> Revenue: <strong>LKR {Number(salesChart[salesHoverIndex].revenue).toLocaleString()}</strong>
                  </div>
                  <div className="tooltip-stat">
                    <span className="dot mint" /> Orders: <strong>{salesChart[salesHoverIndex].orders}</strong>
                  </div>
                </div>
              )}

              <svg
                viewBox="0 0 500 230"
                className="admin-svg-element"
                preserveAspectRatio="none"
              >
                <line x1="40" y1="40" x2="480" y2="40" stroke="#f0f5f4" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="90" x2="480" y2="90" stroke="#f0f5f4" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="140" x2="480" y2="140" stroke="#f0f5f4" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="190" x2="480" y2="190" stroke="#e1eeeb" strokeWidth="1" />

                {salesChart.map((pt, i) => {
                  const x = 40 + i * ((500 - 80) / Math.max(1, salesChart.length - 1))
                  const barHeight = ((Number(pt.orders) || 0) / maxOrders) * 130
                  return (
                    <rect
                      key={`bar-${i}`}
                      x={x - 8}
                      y={190 - barHeight}
                      width="16"
                      height={barHeight}
                      rx="3"
                      fill="#bce9e3"
                      className="chart-bar-rect"
                      onMouseEnter={() => setSalesHoverIndex(i)}
                    />
                  )
                })}

                {salesChart.length > 1 && (
                  <path
                    d={getSalesSvgPath()}
                    fill="none"
                    stroke="#0d5c5a"
                    strokeWidth="2.5"
                  />
                )}

                {salesChart.map((pt, i) => {
                  const x = 40 + i * ((500 - 80) / Math.max(1, salesChart.length - 1))
                  return (
                    <text
                      key={`lbl-${i}`}
                      x={x}
                      y="212"
                      textAnchor="middle"
                      className="svg-axis-lbl"
                    >
                      {pt.date}
                    </text>
                  )
                })}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MIDDLE SECTION: Recent Orders & Top Selling Products
         ---------------------------------------------------- */}
      <div className="admin-data-split-grid">
        {/* Left Card: Recent Orders */}
        <div className="admin-card-surface">
          <div className="surface-header-row">
            <h3 className="surface-title">Recent Orders</h3>
            <button
              type="button"
              className="surface-link-btn"
              onClick={() => setActiveTab('orders')}
            >
              <span>View all orders</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: '#7aa39e' }}>
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="td-order-id">
                        <strong>{order.id}</strong>
                      </td>
                      <td className="td-date">{order.date}</td>
                      <td className="td-customer">{order.customer}</td>
                      <td className="td-items">{order.items}</td>
                      <td className="td-total">
                        <strong>{order.total}</strong>
                      </td>
                      <td>
                        <span className={`status-pill ${order.statusType}`}>
                          <span className="status-dot" />
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Top Selling Products */}
        <div className="admin-card-surface">
          <div className="surface-header-row">
            <h3 className="surface-title">Store Products</h3>
            <button
              type="button"
              className="surface-link-btn"
              onClick={() => setActiveTab('products')}
            >
              <span>View all products</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="top-selling-products-list">
            {topProducts.length === 0 ? (
              <p style={{ padding: '24px', textAlign: 'center', color: '#7aa39e', margin: 0 }}>
                No products in catalog yet. Click "Add Product" to create one.
              </p>
            ) : (
              topProducts.map((prod) => (
                <div key={prod.id || prod.rank} className="top-product-row-item">
                  <div className="product-rank-badge">{prod.rank}</div>
                  {prod.img && (
                    <div className="product-thumb-box">
                      <img src={prod.img} alt={prod.name} />
                    </div>
                  )}
                  <div className="product-info-cell">
                    <strong className="prod-title">{prod.name}</strong>
                    <span className="prod-sold-stat">{prod.sold}</span>
                  </div>
                  <div className="product-price-cell">
                    <strong>{prod.price}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          BOTTOM SECTION: Low Stock Inventory & Registered Pets
         ---------------------------------------------------- */}
      <div className="admin-data-split-grid">
        {/* Left Card: Low Stock Inventory */}
        <div className="admin-card-surface">
          <div className="surface-header-row">
            <h3 className="surface-title">Low Stock Inventory</h3>
            <button
              type="button"
              className="surface-link-btn"
              onClick={() => setActiveTab('products')}
            >
              <span>View all inventory</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '28px', color: '#7aa39e' }}>
                      No low-stock alerts.
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="td-product-combo">
                        {item.img && (
                          <div className="combo-thumb">
                            <img src={item.img} alt={item.product} />
                          </div>
                        )}
                        <span className="combo-name">{item.product}</span>
                      </td>
                      <td className="td-sku">{item.sku}</td>
                      <td className="td-stock-num">
                        <strong className="danger-stock">{item.stock}</strong>
                      </td>
                      <td>
                        <span className="status-pill danger-pill">
                          ⚠️ Low Stock
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
