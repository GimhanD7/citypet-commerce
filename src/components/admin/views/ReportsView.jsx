import { downloadCsv } from '../downloadCsv'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileBarChart2,
  Filter,
  Layers,
  Package,
  Percent,
  RefreshCw,
  Search,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react'
import { apiFetch } from '../../../config/api'
import './reports.css'

const todayLocal = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const sevenDaysAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const monthStart = () => `${todayLocal().slice(0, 7)}-01`

const emptyReport = {
  summary: {},
  sales: [],
  payments: [],
  orders: [],
  inventory: [],
  lowStockAlerts: [],
  categoryStock: [],
  categoryRevenue: [],
  topProducts: [],
  topCustomers: [],
  pets: [],
}

const money = (amount) =>
  `LKR ${Number(amount || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`

const dateLabel = (value) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-LK', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—'


export default function ReportsView() {
  const [period, setPeriod] = useState('month')
  const [start, setStart] = useState(monthStart)
  const [end, setEnd] = useState(todayLocal)
  const [activeReport, setActiveReport] = useState('overview') // 'overview' | 'inventory' | 'payments' | 'products' | 'customers'
  const [report, setReport] = useState(emptyReport)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  // Specific Sub-Filters
  const [stockFilter, setStockFilter] = useState('all') // 'all' | 'low' | 'healthy' | 'out'
  const [paymentFilter, setPaymentFilter] = useState('all') // 'all' | 'paid' | 'pending' | 'slip'

  const loadReport = useCallback(async () => {
    if (!start || !end || start > end) {
      setError('Choose a valid start and end date.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await apiFetch(
        `admin/reports.php?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      )
      setReport(result)
    } catch (err) {
      setError(err.message || 'Could not load reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [start, end])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const setPreset = (next) => {
    const today = todayLocal()
    setPeriod(next)
    if (next === 'today') {
      setStart(today)
      setEnd(today)
    } else if (next === 'week') {
      setStart(sevenDaysAgo())
      setEnd(today)
    } else if (next === 'month') {
      setStart(`${today.slice(0, 7)}-01`)
      setEnd(today)
    } else if (next === 'year') {
      setStart(`${today.slice(0, 4)}-01-01`)
      setEnd(today)
    }
  }

  // Memoized filterings
  const filteredInventory = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (report.inventory || []).filter((row) => {
      const matchesQuery =
        !q ||
        `${row.name} ${row.brand} ${row.category} ${row.stockLocation} ${row.id}`
          .toLowerCase()
          .includes(q)

      const qty = Number(row.stockCount || 0)
      const reorder = Number(row.reorderLevel || 5)
      const isOut = qty === 0 || !row.inStock
      const isLow = !isOut && qty <= reorder
      const isHealthy = !isOut && qty > reorder

      if (stockFilter === 'out') return matchesQuery && isOut
      if (stockFilter === 'low') return matchesQuery && isLow
      if (stockFilter === 'healthy') return matchesQuery && isHealthy
      return matchesQuery
    })
  }, [report.inventory, query, stockFilter])

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (report.orders || []).filter((row) => {
      const matchesQuery =
        !q ||
        `${row.order_number} ${row.customer_name} ${row.email} ${row.phone} ${row.payment_method} ${row.payment_status} ${row.status}`
          .toLowerCase()
          .includes(q)

      if (paymentFilter === 'paid') return matchesQuery && row.payment_status === 'paid'
      if (paymentFilter === 'pending') return matchesQuery && row.payment_status !== 'paid'
      if (paymentFilter === 'slip') return matchesQuery && Boolean(row.payment_slip)
      return matchesQuery
    })
  }, [report.orders, query, paymentFilter])

  const filteredTopProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (report.topProducts || []).filter(
      (p) => !q || `${p.name} ${p.product_id}`.toLowerCase().includes(q)
    )
  }, [report.topProducts, query])

  const filteredTopCustomers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (report.topCustomers || []).filter(
      (c) => !q || `${c.customer_name} ${c.email} ${c.phone}`.toLowerCase().includes(q)
    )
  }, [report.topCustomers, query])

  const summary = report.summary || {}
  const maxRevenue = Math.max(1, ...(report.sales || []).map((row) => Number(row.revenue)))

  // Export current active view to CSV
  const exportCurrent = () => {
    const prefix = `citypet-${activeReport}-${start}-to-${end}`
    if (activeReport === 'inventory') {
      downloadCsv(
        `${prefix}.csv`,
        filteredInventory.map((row) => ({
          SKU: row.id,
          'Product Name': row.name,
          Brand: row.brand,
          Category: row.category,
          'Pet Type': row.petType,
          'Stock Units': row.stockCount,
          'Reorder Level': row.reorderLevel,
          'Selling Price (LKR)': row.price,
          'Retail Valuation (LKR)': Number(row.price) * Number(row.stockCount),
          Location: row.stockLocation,
          Status:
            Number(row.stockCount) === 0
              ? 'Out of Stock'
              : Number(row.stockCount) <= Number(row.reorderLevel)
              ? 'Low Stock Alert'
              : 'Healthy',
        }))
      )
    } else if (activeReport === 'payments') {
      downloadCsv(
        `${prefix}.csv`,
        filteredOrders.map((row) => ({
          'Order Date': row.created_at,
          'Order #': row.order_number,
          'Customer Name': row.customer_name,
          Email: row.email,
          Phone: row.phone,
          'Payment Method': row.payment_method,
          'Payment Status': row.payment_status,
          'Fulfillment Status': row.status,
          'Subtotal (LKR)': row.subtotal,
          'Discount (LKR)': row.discount_amount,
          'Delivery Fee (LKR)': row.delivery_fee,
          'Total Amount (LKR)': row.total_amount,
          'Bank Slip Uploaded': row.payment_slip ? 'Yes' : 'No',
        }))
      )
    } else if (activeReport === 'products') {
      downloadCsv(
        `${prefix}.csv`,
        filteredTopProducts.map((p, idx) => ({
          Rank: idx + 1,
          'Product SKU': p.product_id,
          'Product Name': p.name,
          'Units Sold': p.units_sold,
          'Average Selling Price (LKR)': Math.round(Number(p.avg_price)),
          'Total Sales Revenue (LKR)': p.total_revenue,
          'Order Count': p.order_count,
        }))
      )
    } else if (activeReport === 'customers') {
      downloadCsv(
        `${prefix}.csv`,
        filteredTopCustomers.map((c, idx) => ({
          Rank: idx + 1,
          Customer: c.customer_name,
          Email: c.email,
          Phone: c.phone || '—',
          'Completed Orders': c.total_orders,
          'Total Spent (LKR)': c.total_spent,
          'Last Order Date': c.last_order_date,
        }))
      )
    } else {
      // Revenue & Financials
      downloadCsv(
        `${prefix}.csv`,
        (report.sales || []).map((row) => ({
          Period: row.period,
          'Completed Orders': row.order_count,
          'Paid Revenue (LKR)': row.revenue,
          'Unpaid / Pending (LKR)': row.unpaid_amount,
          'Discounts Granted (LKR)': row.total_discount,
          'Delivery Collected (LKR)': row.total_delivery,
        }))
      )
    }
  }

  const reportTabs = [
    { id: 'overview', label: 'Revenue & Sales', icon: TrendingUp },
    { id: 'inventory', label: 'Stock & Inventory', icon: Package },
    { id: 'payments', label: 'Payments & Ledger', icon: CreditCard },
    { id: 'products', label: 'Top Products', icon: ShoppingBag },
    { id: 'customers', label: 'Customer Spenders', icon: Users },
  ]

  // Calculate stock health percentages
  const totalProds = Number(summary.productCount || 0)
  const healthyPct = totalProds > 0 ? (Number(summary.healthyStockCount || 0) / totalProds) * 100 : 100
  const lowPct = totalProds > 0 ? (Number(summary.lowStockCount || 0) / totalProds) * 100 : 0
  const outPct = totalProds > 0 ? (Number(summary.outOfStockCount || 0) / totalProds) * 100 : 0

  return (
    <section className="reports-page">
      {/* Header */}
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">CITY PET HOSPITAL INTELLIGENCE</span>
          <h1>System Reports &amp; Analytics</h1>
          <p>Real-time analytics across hospital revenue, inventory health, payment gateways, and client trends.</p>
        </div>
        <button className="reports-export" onClick={exportCurrent} type="button">
          <Download size={16} /> Export {activeReport.toUpperCase()} CSV
        </button>
      </header>

      {/* Date Range Selector Toolbar */}
      <div className="reports-controls">
        <div className="reports-periods" role="group" aria-label="Report date range presets">
          {[
            ['today', 'Today'],
            ['week', '7 Days'],
            ['month', 'This Month'],
            ['year', 'This Year'],
            ['custom', 'Custom'],
          ].map(([id, label]) => (
            <button
              key={id}
              className={period === id ? 'selected' : ''}
              onClick={() => (id === 'custom' ? setPeriod('custom') : setPreset(id))}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <label>
          From
          <input
            type="date"
            value={start}
            max={end || undefined}
            onChange={(event) => {
              setPeriod('custom')
              setStart(event.target.value)
            }}
          />
        </label>

        <label>
          To
          <input
            type="date"
            value={end}
            min={start || undefined}
            max={todayLocal()}
            onChange={(event) => {
              setPeriod('custom')
              setEnd(event.target.value)
            }}
          />
        </label>

        <button
          className="reports-refresh"
          type="button"
          onClick={loadReport}
          disabled={loading}
          title="Refresh current report"
        >
          <RefreshCw size={15} className={loading ? 'reports-spinning' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <div className="reports-error" role="alert">{error}</div>}

      {loading && !report.range ? (
        <div className="reports-loading">Loading system reports from database…</div>
      ) : (
        <>
          {/* Universal 5-Column High-Impact KPI Metric Strip */}
          <div className="reports-kpis five-cols">
            <article>
              <span className="reports-kpi-icon teal"><TrendingUp size={18} /></span>
              <small>Paid Revenue</small>
              <strong>{money(summary.revenue)}</strong>
              <span>{Number(summary.paidOrderCount || 0).toLocaleString()} completed orders</span>
            </article>

            <article>
              <span className="reports-kpi-icon mint"><DollarSign size={18} /></span>
              <small>Average Order Value</small>
              <strong>{money(summary.averageOrderValue)}</strong>
              <span>Across paid transactions</span>
            </article>

            <article>
              <span className="reports-kpi-icon amber"><Package size={18} /></span>
              <small>Stock On Hand</small>
              <strong>{Number(summary.stockUnits || 0).toLocaleString()} units</strong>
              <span>Valued at {money(summary.estimatedRetailStockValue)}</span>
            </article>

            <article>
              <span className="reports-kpi-icon violet"><AlertTriangle size={18} /></span>
              <small>Stock Alerts</small>
              <strong>{Number(summary.lowStockCount || 0) + Number(summary.outOfStockCount || 0)} items</strong>
              <span>{summary.outOfStockCount || 0} out of stock · {summary.lowStockCount || 0} low</span>
            </article>

            <article>
              <span className="reports-kpi-icon mint"><CreditCard size={18} /></span>
              <small>Pending Slips</small>
              <strong>{summary.pendingSlipsCount || 0} slips</strong>
              <span>{money(summary.unpaidAmount)} pending verification</span>
            </article>
          </div>

          {/* Navigation Tabs */}
          <nav className="reports-tabs" aria-label="Report modules">
            {reportTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={activeReport === id ? 'active' : ''}
                onClick={() => {
                  setActiveReport(id)
                  setQuery('')
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* ══════════════════════════════════════════════════════════
              TAB 1: REVENUE & SALES REPORT
              ══════════════════════════════════════════════════════════ */}
          {activeReport === 'overview' && (
            <div className="reports-grid">
              {/* Revenue Timeline Trend Bars */}
              <article className="reports-card reports-sales-card">
                <div className="reports-card-heading">
                  <div>
                    <h2>Revenue Trend ({report.range?.bucket === 'day' ? 'Daily' : report.range?.bucket === 'month' ? 'Monthly' : 'Yearly'})</h2>
                    <p>Collections breakdown · {dateLabel(start)} – {dateLabel(end)}</p>
                  </div>
                  <FileBarChart2 size={19} />
                </div>
                {report.sales && report.sales.length ? (
                  <div className="reports-bars">
                    {report.sales.map((row) => (
                      <div
                        className="reports-bar-column"
                        key={row.period}
                        title={`${row.period}: ${money(row.revenue)} paid, ${row.order_count} orders`}
                      >
                        <span>{money(row.revenue)}</span>
                        <div className="reports-bar-track">
                          <i
                            style={{
                              height: `${Math.max(4, (Number(row.revenue) / maxRevenue) * 100)}%`,
                            }}
                          />
                        </div>
                        <small>{row.period}</small>
                        <b>{row.order_count} ord</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="reports-empty">No order revenue recorded in this date range.</p>
                )}
              </article>

              {/* Category Revenue Distribution */}
              <article className="reports-card">
                <div className="reports-card-heading">
                  <div>
                    <h2>Revenue by Category</h2>
                    <p>Product category contribution</p>
                  </div>
                  <Layers size={19} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {report.categoryRevenue && report.categoryRevenue.length ? (
                    report.categoryRevenue.map((cat) => {
                      const pct = summary.revenue > 0 ? (Number(cat.revenue) / summary.revenue) * 100 : 0
                      return (
                        <div className="reports-cat-row" key={cat.category}>
                          <div className="reports-cat-info">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '13px', textTransform: 'capitalize', color: '#173d3b' }}>
                                {cat.category}
                              </strong>
                              <b style={{ fontSize: '12.5px', color: '#0d7773' }}>{money(cat.revenue)}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#688d88' }}>
                              <span>{cat.units_sold} units sold</span>
                              <span>{Math.round(pct)}% of sales</span>
                            </div>
                            <div className="reports-cat-track">
                              <div className="reports-cat-fill" style={{ width: `${Math.min(100, Math.max(4, pct))}%` }} />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="reports-empty">No category sales recorded yet.</p>
                  )}
                </div>
              </article>

              {/* Financial Deductions Summary Card */}
              <article className="reports-card reports-full-width">
                <div className="reports-card-heading">
                  <div>
                    <h2>Gross Sales to Net Revenue Reconciliation</h2>
                    <p>Transparent summary of items subtotal, discounts granted, and delivery fees</p>
                  </div>
                  <DollarSign size={19} />
                </div>
                <div className="reports-subgrid-3">
                  <div style={{ padding: '16px', background: '#f8faf9', borderRadius: '12px', border: '1px solid #e5efeb' }}>
                    <small style={{ display: 'block', fontSize: '11.5px', color: '#557874', fontWeight: 700 }}>1. Gross Subtotal</small>
                    <strong style={{ fontSize: '20px', color: '#123835', fontWeight: 800 }}>{money(summary.grossSales)}</strong>
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#799b95' }}>Pre-discount item prices</span>
                  </div>

                  <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                    <small style={{ display: 'block', fontSize: '11.5px', color: '#92400e', fontWeight: 700 }}>2. Promotional Discounts</small>
                    <strong style={{ fontSize: '20px', color: '#b45309', fontWeight: 800 }}>- {money(summary.discountTotal)}</strong>
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#b45309' }}>Vouchers &amp; promo deductions</span>
                  </div>

                  <div style={{ padding: '16px', background: '#eef8f6', borderRadius: '12px', border: '1px solid #d4ece7' }}>
                    <small style={{ display: 'block', fontSize: '11.5px', color: '#0e5d59', fontWeight: 700 }}>3. Islandwide Courier Delivery</small>
                    <strong style={{ fontSize: '20px', color: '#04959d', fontWeight: 800 }}>+ {money(summary.deliveryFeeTotal)}</strong>
                    <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#0e5d59' }}>Courier dispatch collections</span>
                  </div>
                </div>
              </article>

              {/* Recent Orders in Range */}
              <article className="reports-card reports-full-width">
                <div className="reports-card-heading">
                  <div>
                    <h2>Recent Completed Orders</h2>
                    <p>Showing latest customer transactions in range</p>
                  </div>
                  <button
                    type="button"
                    className="reports-text-button"
                    onClick={() => setActiveReport('payments')}
                  >
                    View Full Payment Ledger &rarr;
                  </button>
                </div>
                <OrdersTable rows={report.orders ? report.orders.slice(0, 10) : []} />
              </article>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: STOCK & INVENTORY VALUATION
              ══════════════════════════════════════════════════════════ */}
          {activeReport === 'inventory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Stock Health Strip Card */}
              <article className="reports-card">
                <div className="reports-card-heading">
                  <div>
                    <h2>Hospital Inventory Health &amp; Valuation</h2>
                    <p>Total {summary.productCount || 0} catalog items · {summary.stockUnits || 0} units physically in stock</p>
                  </div>
                  <b style={{ fontSize: '18px', color: '#0d7773' }}>
                    {money(summary.estimatedRetailStockValue)} Retail Value
                  </b>
                </div>

                <div className="reports-health-strip">
                  <div className="reports-health-segment healthy" style={{ width: `${healthyPct}%` }} title={`Healthy Stock: ${summary.healthyStockCount || 0} products (${Math.round(healthyPct)}%)`} />
                  <div className="reports-health-segment low" style={{ width: `${lowPct}%` }} title={`Low Stock Alert: ${summary.lowStockCount || 0} products (${Math.round(lowPct)}%)`} />
                  <div className="reports-health-segment out" style={{ width: `${outPct}%` }} title={`Out of Stock: ${summary.outOfStockCount || 0} products (${Math.round(outPct)}%)`} />
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                    <span>Healthy Stock: <strong>{summary.healthyStockCount || 0}</strong> ({Math.round(healthyPct)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span>Low Stock Alert: <strong>{summary.lowStockCount || 0}</strong> ({Math.round(lowPct)}%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                    <span>Out of Stock: <strong>{summary.outOfStockCount || 0}</strong> ({Math.round(outPct)}%)</span>
                  </div>
                </div>
              </article>

              {/* Category Stock Summary Cards */}
              {report.categoryStock && report.categoryStock.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
                  {report.categoryStock.map((cs) => (
                    <div
                      key={cs.category}
                      style={{
                        padding: '16px',
                        background: '#ffffff',
                        border: '1px solid #e1eee9',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(18, 56, 53, 0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'capitalize', color: '#173d3b' }}>
                          {cs.category}
                        </span>
                        {cs.lowStockCount > 0 ? (
                          <span className="reports-stock-pill low">{cs.lowStockCount} alert{cs.lowStockCount > 1 ? 's' : ''}</span>
                        ) : (
                          <span className="reports-stock-pill ok">Normal</span>
                        )}
                      </div>
                      <strong style={{ display: 'block', fontSize: '16px', color: '#0d7773', marginBottom: '4px' }}>
                        {money(cs.retailValue)}
                      </strong>
                      <small style={{ color: '#688d88', fontSize: '11.5px' }}>
                        {cs.productCount} products · {cs.totalUnits} total units
                      </small>
                    </div>
                  ))}
                </div>
              )}

              {/* Low Stock Alerts Action Queue */}
              {report.lowStockAlerts && report.lowStockAlerts.length > 0 && (
                <article className="reports-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="reports-card-heading">
                    <div>
                      <h2 style={{ color: '#b45309' }}>Immediate Restock Recommendations</h2>
                      <p>Products with current balance at or below reorder threshold</p>
                    </div>
                    <AlertTriangle size={20} color="#b45309" />
                  </div>
                  <div className="reports-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Product SKU</th>
                          <th>Product Name</th>
                          <th>Category</th>
                          <th>Location</th>
                          <th>Units Left</th>
                          <th>Reorder Level</th>
                          <th>Action Suggested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.lowStockAlerts.map((row) => (
                          <tr key={row.id}>
                            <td><code>{row.id}</code></td>
                            <td><strong>{row.name}</strong><small>{row.brand}</small></td>
                            <td style={{ textTransform: 'capitalize' }}>{row.category}</td>
                            <td>{row.stockLocation}</td>
                            <td>
                              <span className={`reports-stock-pill ${row.status === 'out_of_stock' ? 'danger' : 'low'}`}>
                                {row.stockCount} units {row.status === 'out_of_stock' ? '(OUT)' : ''}
                              </span>
                            </td>
                            <td>{row.reorderLevel} units</td>
                            <td>
                              <span style={{ color: '#0d7773', fontSize: '11.5px', fontWeight: 700 }}>
                                Restock +{Math.max(20, Number(row.reorderLevel) * 3)} units
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              )}

              {/* Full Stock Directory Table */}
              <article className="reports-card reports-table-card">
                <div className="reports-card-heading">
                  <div>
                    <h2>Complete Hospital Inventory Ledger</h2>
                    <p>Showing {filteredInventory.length} products matching criteria</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div className="reports-filter-pills">
                      {[
                        ['all', 'All Products'],
                        ['low', 'Low Stock'],
                        ['healthy', 'Healthy'],
                        ['out', 'Out of Stock'],
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          className={`reports-filter-pill-btn ${stockFilter === val ? 'active' : ''}`}
                          onClick={() => setStockFilter(val)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <input
                      className="reports-search"
                      type="search"
                      placeholder="Search by name, brand, SKU…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="reports-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Product &amp; SKU</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Stock Units</th>
                        <th>Reorder Level</th>
                        <th>Listed Price</th>
                        <th>Stock Valuation</th>
                        <th>Inventory Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((row) => {
                        const qty = Number(row.stockCount || 0)
                        const reorder = Number(row.reorderLevel || 5)
                        const isOut = qty === 0 || !row.inStock
                        const isLow = !isOut && qty <= reorder
                        return (
                          <tr key={row.id}>
                            <td>
                              <strong>{row.name}</strong>
                              <small>{row.brand} &bull; {row.id}</small>
                            </td>
                            <td style={{ textTransform: 'capitalize' }}>{row.category}</td>
                            <td>{row.stockLocation}</td>
                            <td><strong>{qty.toLocaleString()}</strong></td>
                            <td>{reorder.toLocaleString()}</td>
                            <td>{money(row.price)}</td>
                            <td><strong>{money(Number(row.price) * qty)}</strong></td>
                            <td>
                              <span className={`reports-stock-pill ${isOut ? 'danger' : isLow ? 'low' : 'ok'}`}>
                                {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {!filteredInventory.length && (
                    <p className="reports-empty">No products match your search or stock filter.</p>
                  )}
                </div>
              </article>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: PAYMENTS & VERIFICATION LEDGER
              ══════════════════════════════════════════════════════════ */}
          {activeReport === 'payments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Payment Gateways Breakdown */}
              <div className="reports-subgrid-3">
                <article className="reports-card">
                  <div className="reports-card-heading">
                    <div>
                      <h2>Payment Methods Distribution</h2>
                      <p>Grouped by payment channel</p>
                    </div>
                    <CreditCard size={19} />
                  </div>
                  <div className="reports-payment-list">
                    {report.payments && report.payments.length ? (
                      report.payments.map((row, idx) => (
                        <div key={`${row.method}-${row.status}-${idx}`}>
                          <span className={`reports-payment-dot ${String(row.method).toLowerCase().includes('bank') ? 'bank' : 'card'}`} />
                          <div>
                            <strong>{row.method || 'Credit/Debit Card'}</strong>
                            <small>{row.status} &bull; {row.transactions} orders</small>
                          </div>
                          <b>{money(row.amount)}</b>
                        </div>
                      ))
                    ) : (
                      <p className="reports-empty">No payment data in this period.</p>
                    )}
                  </div>
                </article>

                <article className="reports-card">
                  <div className="reports-card-heading">
                    <div>
                      <h2>Bank Slip Verification Backlog</h2>
                      <p>Customer bank deposit receipts</p>
                    </div>
                    <Clock size={19} color="#b45309" />
                  </div>
                  <div style={{ padding: '10px 0' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#123835', marginBottom: '6px' }}>
                      {summary.pendingSlipsCount || 0}
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#688d88' }}>
                      Orders have uploaded deposit slips awaiting manual hospital cashier verification.
                    </p>
                  </div>
                </article>

                <article className="reports-card">
                  <div className="reports-card-heading">
                    <div>
                      <h2>Settlement Reconciliation</h2>
                      <p>Paid vs Pending collections</p>
                    </div>
                    <CheckCircle2 size={19} color="#10b981" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Verified &amp; Paid:</span>
                      <strong style={{ color: '#10b981' }}>{money(summary.revenue)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Pending Verification:</span>
                      <strong style={{ color: '#f59e0b' }}>{money(summary.unpaidAmount)}</strong>
                    </div>
                    <div style={{ height: '1px', background: '#eef3f1' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800 }}>
                      <span>Total Expected:</span>
                      <span>{money(Number(summary.revenue || 0) + Number(summary.unpaidAmount || 0))}</span>
                    </div>
                  </div>
                </article>
              </div>

              {/* Transactions Ledger Table */}
              <article className="reports-card reports-table-card">
                <div className="reports-card-heading">
                  <div>
                    <h2>Transactions &amp; Order Payments Ledger</h2>
                    <p>Showing {filteredOrders.length} transactions in date range</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div className="reports-filter-pills">
                      {[
                        ['all', 'All'],
                        ['paid', 'Paid'],
                        ['pending', 'Pending / Unpaid'],
                        ['slip', 'Has Bank Slip'],
                      ].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          className={`reports-filter-pill-btn ${paymentFilter === val ? 'active' : ''}`}
                          onClick={() => setPaymentFilter(val)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <input
                      className="reports-search"
                      type="search"
                      placeholder="Search customer, order #…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                </div>

                <OrdersTable rows={filteredOrders} detailed />
              </article>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: TOP SELLING PRODUCTS
              ══════════════════════════════════════════════════════════ */}
          {activeReport === 'products' && (
            <article className="reports-card reports-table-card">
              <div className="reports-card-heading">
                <div>
                  <h2>Top Performing Medical &amp; Store Products</h2>
                  <p>Ranked by verified paid sales revenue in selected date range</p>
                </div>
                <input
                  className="reports-search"
                  type="search"
                  placeholder="Search top products…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="reports-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Rank</th>
                      <th>Product Name &amp; SKU</th>
                      <th>Units Sold</th>
                      <th>Orders Count</th>
                      <th>Average Sale Price</th>
                      <th>Gross Sales Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopProducts.map((p, idx) => (
                      <tr key={p.product_id || idx}>
                        <td>
                          <span className={`reports-rank-badge ${idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : ''}`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td>
                          <strong>{p.name}</strong>
                          <small>SKU: {p.product_id}</small>
                        </td>
                        <td><strong>{p.units_sold}</strong> units</td>
                        <td>{p.order_count} distinct orders</td>
                        <td>{money(p.avg_price)}</td>
                        <td>
                          <strong style={{ color: '#0d7773', fontSize: '13px' }}>
                            {money(p.total_revenue)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredTopProducts.length && (
                  <p className="reports-empty">No product sales recorded in this date range.</p>
                )}
              </div>
            </article>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 5: CUSTOMER SPENDERS & LOYALTY
              ══════════════════════════════════════════════════════════ */}
          {activeReport === 'customers' && (
            <article className="reports-card reports-table-card">
              <div className="reports-card-heading">
                <div>
                  <h2>Top Customer Spenders &amp; Repeat Clients</h2>
                  <p>Customer accounts ranked by total order spend in selected date range</p>
                </div>
                <input
                  className="reports-search"
                  type="search"
                  placeholder="Search customer name, email…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className="reports-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Rank</th>
                      <th>Client Details</th>
                      <th>Email Address</th>
                      <th>Contact Phone</th>
                      <th>Total Orders Placed</th>
                      <th>Total Amount Spent</th>
                      <th>Last Order Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopCustomers.map((c, idx) => (
                      <tr key={c.email || idx}>
                        <td>
                          <span className={`reports-rank-badge ${idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : ''}`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td>
                          <strong>{c.customer_name}</strong>
                        </td>
                        <td>{c.email}</td>
                        <td>{c.phone || '—'}</td>
                        <td><strong>{c.total_orders}</strong> order{c.total_orders > 1 ? 's' : ''}</td>
                        <td>
                          <strong style={{ color: '#0d7773', fontSize: '13px' }}>
                            {money(c.total_spent)}
                          </strong>
                        </td>
                        <td>{dateLabel(c.last_order_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredTopCustomers.length && (
                  <p className="reports-empty">No customer transactions found for this date range.</p>
                )}
              </div>
            </article>
          )}
        </>
      )}
    </section>
  )
}

function OrdersTable({ rows, detailed = false }) {
  return (
    <div className="reports-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Order #</th>
            <th>Customer</th>
            <th>Method</th>
            <th>Payment Status</th>
            <th>Order Status</th>
            {detailed && <th>Bank Slip</th>}
            {detailed ? (
              <>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Delivery</th>
                <th>Total</th>
              </>
            ) : (
              <th>Total Amount</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{dateLabel(row.created_at)}</td>
              <td><strong>{row.order_number}</strong></td>
              <td>
                <div>{row.customer_name}</div>
                {row.email && <small style={{ color: '#7a9692' }}>{row.email}</small>}
              </td>
              <td>{row.payment_method || 'Card'}</td>
              <td>
                <span className={`reports-status ${row.payment_status === 'paid' ? 'paid' : 'pending'}`}>
                  {row.payment_status || 'unpaid'}
                </span>
              </td>
              <td>{row.status}</td>
              {detailed && (
                <td>
                  {row.payment_slip ? (
                    <span className="reports-slip-badge">
                      <CheckCircle2 size={11} /> Uploaded
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>—</span>
                  )}
                </td>
              )}
              {detailed ? (
                <>
                  <td>{money(row.subtotal)}</td>
                  <td>{Number(row.discount_amount) > 0 ? `-${money(row.discount_amount)}` : '—'}</td>
                  <td>{money(row.delivery_fee)}</td>
                  <td><strong>{money(row.total_amount)}</strong></td>
                </>
              ) : (
                <td><strong>{money(row.total_amount)}</strong></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="reports-empty">No orders for this date range.</p>}
    </div>
  )
}
