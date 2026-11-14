import React, { useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  MoreHorizontal,
  Package,
  Plus,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react'

import peekingCat from '../../../assets/admin-peeking-cat.jpg'
import {
  lowStockItems,
  ordersTrendData,
  salesData,
  topProducts,
} from '../data/adminMockData'

export default function DashboardOverview({
  recentOrders,
  recentPatients,
  setActiveTab,
  setActiveModal,
  showToast,
}) {
  // Chart Hover Tooltip States
  const [salesHoverIndex, setSalesHoverIndex] = useState(3) // Default to Apr 15
  const [ordersHoverIndex, setOrdersHoverIndex] = useState(5) // Default to Apr 22

  // SVG Helper Constants & Functions
  const maxRevenue = 400000
  const maxOrders = 120

  const getSalesSvgPath = () => {
    return salesData
      .map((pt, i) => {
        const x = 40 + i * ((500 - 80) / (salesData.length - 1))
        const y = 190 - (pt.revenue / maxRevenue) * 150
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  const getOrdersTrendPath = (key) => {
    return ordersTrendData
      .map((pt, i) => {
        const x = 40 + i * ((500 - 80) / (ordersTrendData.length - 1))
        const y = 190 - (pt[key] / maxOrders) * 150
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
      })
      .join(' ')
  }

  const getOrdersTrendArea = (key) => {
    const linePath = getOrdersTrendPath(key)
    const lastX = 40 + (ordersTrendData.length - 1) * ((500 - 80) / (ordersTrendData.length - 1))
    return `${linePath} L ${lastX} 190 L 40 190 Z`
  }

  return (
    <>
      {/* Top Greeting Banner with Peeking Cat */}
      <div className="admin-welcome-stage">
        <div className="welcome-texts-col">
          <span className="welcome-eyebrow">ADMIN DASHBOARD</span>
          <h1 className="welcome-main-title">Good to see you, Dr. Anjali!</h1>
          <p className="welcome-sub-desc">
            Here's what's happening at City Pet today.
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
          4 KPI SUMMARY CARDS
         ---------------------------------------------------- */}
      <div className="admin-kpi-cards-grid">
        {/* 1. Total Orders */}
        <div className="admin-kpi-card mint-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-bubble mint-bubble">
              <ShoppingCart size={19} />
            </div>
            <button type="button" className="kpi-more-btn">
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="kpi-data-body">
            <span className="kpi-metric-label">Total Orders</span>
            <div className="kpi-metric-val-row">
              <strong className="kpi-big-value">248</strong>
              <span className="kpi-trend-pill up">
                <ArrowUpRight size={13} /> 12%
              </span>
            </div>
            <small className="kpi-sub-text">vs. last month</small>
          </div>
        </div>

        {/* 2. Revenue */}
        <div className="admin-kpi-card cyan-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-bubble cyan-bubble">
              <Wallet size={19} />
            </div>
            <button type="button" className="kpi-more-btn">
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="kpi-data-body">
            <span className="kpi-metric-label">Revenue</span>
            <div className="kpi-metric-val-row">
              <strong className="kpi-big-value">LKR 892,450</strong>
            </div>
            <small className="kpi-sub-text">vs. last month</small>
          </div>
        </div>

        {/* 3. Customers */}
        <div className="admin-kpi-card blue-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-bubble blue-bubble">
              <Users size={19} />
            </div>
            <button type="button" className="kpi-more-btn">
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="kpi-data-body">
            <span className="kpi-metric-label">Customers</span>
            <div className="kpi-metric-val-row">
              <strong className="kpi-big-value">612</strong>
              <span className="kpi-trend-pill up">
                <ArrowUpRight size={13} /> 14%
              </span>
            </div>
            <small className="kpi-sub-text">vs. last month</small>
          </div>
        </div>

        {/* 4. Low Stock Alerts */}
        <div className="admin-kpi-card salmon-card">
          <div className="kpi-card-top">
            <div className="kpi-icon-bubble salmon-bubble">
              <Package size={19} />
            </div>
            <button type="button" className="kpi-more-btn">
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="kpi-data-body">
            <span className="kpi-metric-label">Low Stock Alerts</span>
            <div className="kpi-metric-val-row">
              <strong className="kpi-big-value">7</strong>
              <span className="kpi-trend-pill red-up">
                <ArrowUpRight size={13} /> 75%
              </span>
            </div>
            <small className="kpi-sub-text">vs. last month</small>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          4 QUICK ACTION BUTTONS
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
          2 INTERACTIVE SVG CHARTS (Sales & Revenue, Orders Trend)
         ---------------------------------------------------- */}
      <div className="admin-charts-grid">
        {/* Left Chart: Sales & Revenue */}
        <div className="admin-chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Sales & Revenue</h3>
            <div className="chart-legend-row">
              <span className="legend-chip">
                <span className="legend-dot teal-line" /> Revenue (LKR)
              </span>
              <span className="legend-chip">
                <span className="legend-dot mint-bar" /> Orders
              </span>
            </div>
          </div>

          {/* SVG Chart Container */}
          <div className="svg-chart-container">
            {/* Tooltip Overlay */}
            {salesHoverIndex !== null && salesData[salesHoverIndex] && (
              <div
                className="interactive-chart-tooltip"
                style={{
                  left: `${
                    40 +
                    salesHoverIndex *
                      ((500 - 80) / (salesData.length - 1))
                  }px`,
                  top: `${
                    190 -
                    (salesData[salesHoverIndex].revenue / maxRevenue) *
                      150 -
                    45
                  }px`,
                }}
              >
                <div className="tooltip-date">
                  {salesData[salesHoverIndex].date}, 2024
                </div>
                <div className="tooltip-stat">
                  <span className="dot teal" /> Revenue: <strong>LKR {salesData[salesHoverIndex].revenue.toLocaleString()}</strong>
                </div>
                <div className="tooltip-stat">
                  <span className="dot mint" /> Orders: <strong>{salesData[salesHoverIndex].orders}</strong>
                </div>
              </div>
            )}

            <svg
              viewBox="0 0 500 230"
              className="admin-svg-element"
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <line x1="40" y1="40" x2="480" y2="40" stroke="#f0f5f4" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="90" x2="480" y2="90" stroke="#f0f5f4" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#f0f5f4" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="190" x2="480" y2="190" stroke="#e1eeeb" strokeWidth="1" />

              {/* Y-Axis Labels */}
              <text x="32" y="44" textAnchor="end" className="svg-axis-lbl">400K</text>
              <text x="32" y="94" textAnchor="end" className="svg-axis-lbl">300K</text>
              <text x="32" y="144" textAnchor="end" className="svg-axis-lbl">200K</text>
              <text x="32" y="194" textAnchor="end" className="svg-axis-lbl">0</text>

              {/* Bars for Orders */}
              {salesData.map((pt, i) => {
                const x = 40 + i * ((500 - 80) / (salesData.length - 1))
                const barHeight = (pt.orders / maxOrders) * 130
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

              {/* Revenue Line */}
              <path
                d={getSalesSvgPath()}
                fill="none"
                stroke="#0d5c5a"
                strokeWidth="2.5"
              />

              {/* Line Points */}
              {salesData.map((pt, i) => {
                const x = 40 + i * ((500 - 80) / (salesData.length - 1))
                const y = 190 - (pt.revenue / maxRevenue) * 150
                const isHovered = salesHoverIndex === i
                return (
                  <circle
                    key={`pt-${i}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill="#ffffff"
                    stroke="#0d5c5a"
                    strokeWidth={isHovered ? 3 : 2}
                    className="chart-interactive-dot"
                    onMouseEnter={() => setSalesHoverIndex(i)}
                  />
                )
              })}

              {/* X-Axis Labels */}
              {salesData.map((pt, i) => {
                const x = 40 + i * ((500 - 80) / (salesData.length - 1))
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

        {/* Right Chart: Orders Trend */}
        <div className="admin-chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Orders Trend</h3>
            <div className="chart-legend-row">
              <span className="legend-chip">
                <span className="legend-dot dark-teal" /> This month
              </span>
              <span className="legend-chip">
                <span className="legend-dot light-mint" /> Last month
              </span>
            </div>
          </div>

          {/* SVG Chart Container */}
          <div className="svg-chart-container">
            {ordersHoverIndex !== null && ordersTrendData[ordersHoverIndex] && (
              <div
                className="interactive-chart-tooltip"
                style={{
                  left: `${
                    40 +
                    ordersHoverIndex *
                      ((500 - 80) / (ordersTrendData.length - 1))
                  }px`,
                  top: `${
                    190 -
                    (ordersTrendData[ordersHoverIndex].thisMonth / maxOrders) *
                      150 -
                    35
                  }px`,
                }}
              >
                <div className="tooltip-date">
                  {ordersTrendData[ordersHoverIndex].date}, 2024
                </div>
                <div className="tooltip-stat">
                  <span className="dot dark-teal" /> Orders: <strong>{ordersTrendData[ordersHoverIndex].thisMonth}</strong>
                </div>
              </div>
            )}

            <svg
              viewBox="0 0 500 230"
              className="admin-svg-element"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#04959d" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#04959d" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="40" x2="480" y2="40" stroke="#f0f5f4" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="90" x2="480" y2="90" stroke="#f0f5f4" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#f0f5f4" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="40" y1="190" x2="480" y2="190" stroke="#e1eeeb" strokeWidth="1" />

              {/* Y-Axis Labels */}
              <text x="32" y="44" textAnchor="end" className="svg-axis-lbl">120</text>
              <text x="32" y="94" textAnchor="end" className="svg-axis-lbl">90</text>
              <text x="32" y="144" textAnchor="end" className="svg-axis-lbl">60</text>
              <text x="32" y="194" textAnchor="end" className="svg-axis-lbl">0</text>

              {/* Last Month Area & Line */}
              <path
                d={getOrdersTrendArea('lastMonth')}
                fill="#f0faf8"
              />
              <path
                d={getOrdersTrendPath('lastMonth')}
                fill="none"
                stroke="#81cdc5"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* This Month Area & Line */}
              <path
                d={getOrdersTrendArea('thisMonth')}
                fill="url(#areaGradient)"
              />
              <path
                d={getOrdersTrendPath('thisMonth')}
                fill="none"
                stroke="#0d5c5a"
                strokeWidth="2.5"
              />

              {/* Points */}
              {ordersTrendData.map((pt, i) => {
                const x = 40 + i * ((500 - 80) / (ordersTrendData.length - 1))
                const y = 190 - (pt.thisMonth / maxOrders) * 150
                const isHovered = ordersHoverIndex === i
                return (
                  <circle
                    key={`ord-pt-${i}`}
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill="#ffffff"
                    stroke="#0d5c5a"
                    strokeWidth={isHovered ? 3 : 2}
                    className="chart-interactive-dot"
                    onMouseEnter={() => setOrdersHoverIndex(i)}
                  />
                )
              })}

              {/* X-Axis Labels */}
              {ordersTrendData.map((pt, i) => {
                const x = 40 + i * ((500 - 80) / (ordersTrendData.length - 1))
                return (
                  <text
                    key={`lbl-ord-${i}`}
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
                  <th className="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
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
                    <td className="td-actions">
                      <button
                        type="button"
                        className="row-action-dots-btn"
                        onClick={() => showToast(`Selected actions for ${order.id}`)}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Top Selling Products */}
        <div className="admin-card-surface">
          <div className="surface-header-row">
            <h3 className="surface-title">Top Selling Products</h3>
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
            {topProducts.map((prod) => (
              <div key={prod.rank} className="top-product-row-item">
                <div className="product-rank-badge">{prod.rank}</div>
                <div className="product-thumb-box">
                  <img src={prod.img} alt={prod.name} />
                </div>
                <div className="product-info-cell">
                  <strong className="prod-title">{prod.name}</strong>
                  <span className="prod-sold-stat">{prod.sold}</span>
                </div>
                <div className="product-price-cell">
                  <strong>{prod.price}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          BOTTOM SECTION: Low Stock Inventory & Recent In-Patients
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
                {lowStockItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="td-product-combo">
                      <div className="combo-thumb">
                        <img src={item.img} alt={item.product} />
                      </div>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: Recent Clinical In-Patients */}
        <div className="admin-card-surface">
          <div className="surface-header-row">
            <h3 className="surface-title">Recent Clinical In-Patients</h3>
            <button
              type="button"
              className="surface-link-btn"
              onClick={() => setActiveTab('pets')}
            >
              <span>View all patient logs</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Pet / Owner</th>
                  <th>Treatment / Service</th>
                  <th>Status</th>
                  <th className="th-actions"></th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((pat) => (
                  <tr key={pat.id}>
                    <td className="td-datetime">
                      <strong>{pat.date}</strong>
                    </td>
                    <td className="td-pet-owner">
                      <div className="pet-owner-combo">
                        <img
                          src={pat.avatar}
                          alt={pat.petName}
                          className="pet-mini-avatar"
                        />
                        <div className="pet-owner-texts">
                          <strong>{pat.petName}</strong>
                          <small>{pat.ownerName}</small>
                        </div>
                      </div>
                    </td>
                    <td className="td-service">{pat.service}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          pat.status === 'Completed'
                            ? 'success'
                            : pat.status === 'In Recovery'
                            ? 'info'
                            : 'warning-amber'
                        }`}
                      >
                        <span className="status-dot" />
                        {pat.status}
                      </span>
                    </td>
                    <td className="td-actions">
                      <button
                        type="button"
                        className="row-action-dots-btn"
                        onClick={() => showToast(`Actions for patient record: ${pat.petName}`)}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
