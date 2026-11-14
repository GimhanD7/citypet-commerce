import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, CreditCard, Download, FileBarChart2, Package, PawPrint, RefreshCw, TrendingUp } from 'lucide-react'
import { apiFetch } from '../../../config/api'
import './reports.css'

const todayLocal = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
const monthStart = () => `${todayLocal().slice(0, 7)}-01`
const emptyReport = { summary: {}, sales: [], payments: [], orders: [], inventory: [], pets: [] }
const money = (amount) => `LKR ${Number(amount || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`
const dateLabel = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

function downloadCsv(filename, rows) {
  if (!rows.length) return
  const keys = Object.keys(rows[0])
  const csv = [keys, ...rows.map((row) => keys.map((key) => row[key] ?? ''))]
    .map((row) => row.map((value) => {
      const safe = /^[=+@\-\t\r]/.test(String(value)) ? `'${value}` : value
      return `"${String(safe).replaceAll('"', '""')}"`
    }).join(','))
    .join('\r\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function ReportsView() {
  const [period, setPeriod] = useState('month')
  const [start, setStart] = useState(monthStart)
  const [end, setEnd] = useState(todayLocal)
  const [activeReport, setActiveReport] = useState('overview')
  const [report, setReport] = useState(emptyReport)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  const loadReport = useCallback(async () => {
    if (!start || !end || start > end) {
      setError('Choose a valid date range.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await apiFetch(`admin/reports.php?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      setReport(result)
    } catch (err) {
      setError(err.message || 'Could not load reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [start, end])

  useEffect(() => { loadReport() }, [loadReport])

  const setPreset = (next) => {
    const today = todayLocal()
    setPeriod(next)
    if (next === 'today') { setStart(today); setEnd(today) }
    if (next === 'month') { setStart(`${today.slice(0, 7)}-01`); setEnd(today) }
    if (next === 'year') { setStart(`${today.slice(0, 4)}-01-01`); setEnd(today) }
  }

  const filteredInventory = useMemo(() => report.inventory.filter((row) => `${row.name} ${row.brand} ${row.category} ${row.stockLocation}`.toLowerCase().includes(query.toLowerCase())), [report.inventory, query])
  const filteredPets = useMemo(() => report.pets.filter((row) => `${row.name} ${row.species} ${row.breed} ${row.ownerName} ${row.ownerEmail}`.toLowerCase().includes(query.toLowerCase())), [report.pets, query])
  const filteredOrders = useMemo(() => report.orders.filter((row) => `${row.order_number} ${row.customer_name} ${row.payment_method} ${row.payment_status}`.toLowerCase().includes(query.toLowerCase())), [report.orders, query])
  const summary = report.summary || {}
  const maxRevenue = Math.max(1, ...report.sales.map((row) => Number(row.revenue)))

  const exportCurrent = () => {
    const prefix = `citypet-${activeReport}-${start}-to-${end}`
    if (activeReport === 'inventory') downloadCsv(`${prefix}.csv`, filteredInventory.map((row) => ({ SKU: row.id, Product: row.name, Brand: row.brand, Category: row.category, 'Pet type': row.petType, 'Stock units': row.stockCount, 'Reorder level': row.reorderLevel, 'Unit price LKR': row.price, 'Estimated retail value LKR': Number(row.price) * Number(row.stockCount), Location: row.stockLocation })))
    else if (activeReport === 'pets') downloadCsv(`${prefix}.csv`, filteredPets.map((row) => ({ Pet: row.name, Species: row.species, Breed: row.breed, Age: row.age, Gender: row.gender, Weight: row.weight, Owner: row.ownerName, Email: row.ownerEmail, Phone: row.ownerPhone, 'Visit count': row.visitCount, 'Medical history': (row.medicalHistory || []).map((visit) => `${visit.date}: ${visit.type} (${visit.doctor}, ${visit.status})`).join(' | '), 'Next checkup': row.nextCheckup })))
    else if (activeReport === 'payments') downloadCsv(`${prefix}.csv`, filteredOrders.map((row) => ({ Date: row.created_at, Order: row.order_number, Customer: row.customer_name, Method: row.payment_method, 'Payment status': row.payment_status, 'Order status': row.status, 'Subtotal LKR': row.subtotal, 'Discount LKR': row.discount_amount, 'Delivery LKR': row.delivery_fee, 'Total LKR': row.total_amount })))
    else downloadCsv(`${prefix}.csv`, report.sales.map((row) => ({ Period: row.period, Orders: row.order_count, 'Paid revenue LKR': row.revenue, 'Unpaid amount LKR': row.unpaid_amount })))
  }

  const reportTabs = [
    { id: 'overview', label: 'Revenue', icon: TrendingUp },
    { id: 'inventory', label: 'Stock', icon: Package },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'pets', label: 'Pets', icon: PawPrint },
  ]

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div><span className="reports-eyebrow">CITY PET MANAGEMENT</span><h1>System reports</h1><p>Review sales, stock, payments, and registered pet records.</p></div>
        <button className="reports-export" onClick={exportCurrent} type="button"><Download size={16} /> Export CSV</button>
      </header>

      <div className="reports-controls">
        <div className="reports-periods" role="group" aria-label="Report date range">
          {[['today', 'Daily'], ['month', 'Monthly'], ['year', 'Yearly'], ['custom', 'Custom']].map(([id, label]) => <button key={id} className={period === id ? 'selected' : ''} onClick={() => id === 'custom' ? setPeriod('custom') : setPreset(id)} type="button">{label}</button>)}
        </div>
        <label>From<input type="date" value={start} max={end || undefined} onChange={(event) => { setPeriod('custom'); setStart(event.target.value) }} /></label>
        <label>To<input type="date" value={end} min={start || undefined} max={todayLocal()} onChange={(event) => { setPeriod('custom'); setEnd(event.target.value) }} /></label>
        <button className="reports-refresh" type="button" onClick={loadReport} disabled={loading}><RefreshCw size={16} className={loading ? 'reports-spinning' : ''} /> Refresh</button>
      </div>

      {error && <div className="reports-error" role="alert">{error}</div>}
      {loading && !report.range ? <div className="reports-loading">Loading system reports…</div> : <>
        <div className="reports-kpis">
          <article><span className="reports-kpi-icon teal"><TrendingUp size={19} /></span><small>Paid revenue</small><strong>{money(summary.revenue)}</strong><span>{Number(summary.paidOrderCount || 0).toLocaleString()} paid orders</span></article>
          <article><span className="reports-kpi-icon mint"><Activity size={19} /></span><small>Orders in range</small><strong>{Number(summary.orderCount || 0).toLocaleString()}</strong><span>{money(summary.unpaidAmount)} unpaid or pending</span></article>
          <article><span className="reports-kpi-icon amber"><Package size={19} /></span><small>Stock on hand</small><strong>{Number(summary.stockUnits || 0).toLocaleString()} units</strong><span>{Number(summary.lowStockCount || 0)} at or below reorder level</span></article>
          <article><span className="reports-kpi-icon violet"><PawPrint size={19} /></span><small>Registered pets</small><strong>{Number(summary.petCount || 0).toLocaleString()}</strong><span>{Number(summary.petsRegisteredInRange || 0)} registered in this range</span></article>
        </div>

        <nav className="reports-tabs" aria-label="Report categories">{reportTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={activeReport === id ? 'active' : ''} onClick={() => { setActiveReport(id); setQuery('') }}><Icon size={16} />{label}</button>)}</nav>

        {activeReport === 'overview' && <div className="reports-grid">
          <article className="reports-card reports-sales-card"><div className="reports-card-heading"><div><h2>Revenue trend</h2><p>{report.range?.bucket === 'day' ? 'Daily' : report.range?.bucket === 'month' ? 'Monthly' : 'Yearly'} paid sales · {dateLabel(start)} – {dateLabel(end)}</p></div><FileBarChart2 size={19} /></div>
            {report.sales.length ? <div className="reports-bars">{report.sales.map((row) => <div className="reports-bar-column" key={row.period} title={`${row.period}: ${money(row.revenue)} revenue, ${row.order_count} orders`}><span>{money(row.revenue)}</span><div className="reports-bar-track"><i style={{ height: `${Math.max(3, Number(row.revenue) / maxRevenue * 100)}%` }} /></div><small>{row.period}</small><b>{row.order_count} orders</b></div>)}</div> : <p className="reports-empty">No orders were recorded in this date range.</p>}
          </article>
          <article className="reports-card"><div className="reports-card-heading"><div><h2>Payment methods</h2><p>Transactions grouped by method and status</p></div><CreditCard size={19} /></div>
            {report.payments.length ? <div className="reports-payment-list">{report.payments.map((row, index) => <div key={`${row.method}-${row.status}-${index}`}><span className={`reports-payment-dot ${String(row.method).toLowerCase().includes('bank') ? 'bank' : 'card'}`} /><div><strong>{row.method || 'Other'}</strong><small>{row.status || 'unknown'} · {row.transactions} orders</small></div><b>{money(row.amount)}</b></div>)}</div> : <p className="reports-empty">No payment records in this date range.</p>}
          </article>
          <article className="reports-card reports-full-width"><div className="reports-card-heading"><div><h2>Recent orders in range</h2><p>Latest transactions and payment status</p></div><button type="button" className="reports-text-button" onClick={() => setActiveReport('payments')}>View payment report</button></div><OrdersTable rows={report.orders.slice(0, 8)} /></article>
          <article className="reports-card reports-full-width reports-stock-summary"><div><Package size={20} /><span><strong>Estimated retail value of stock</strong><small>Current stock units × listed selling price. Product purchase costs are not recorded in this database.</small></span></div><b>{money(summary.estimatedRetailStockValue)}</b></article>
        </div>}

        {activeReport !== 'overview' && <article className="reports-card reports-table-card">
          <div className="reports-card-heading"><div><h2>{activeReport === 'inventory' ? 'Inventory report' : activeReport === 'payments' ? 'Payment report' : 'Pet records'}</h2><p>{activeReport === 'inventory' ? `${filteredInventory.length} products · current stock position` : activeReport === 'payments' ? `${filteredOrders.length} orders · ${dateLabel(start)} – ${dateLabel(end)}` : `${filteredPets.length} pet profiles · complete registry`}</p></div><input className="reports-search" type="search" placeholder="Search this report…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          {activeReport === 'inventory' && <div className="reports-table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Location</th><th>Units</th><th>Reorder at</th><th>Listed price</th><th>Stock retail value</th><th>Level</th></tr></thead><tbody>{filteredInventory.map((row) => <tr key={row.id}><td><strong>{row.name}</strong><small>{row.brand} · {row.id}</small></td><td>{row.category}</td><td>{row.stockLocation}</td><td>{Number(row.stockCount).toLocaleString()}</td><td>{Number(row.reorderLevel).toLocaleString()}</td><td>{money(row.price)}</td><td>{money(Number(row.price) * Number(row.stockCount))}</td><td><span className={`reports-stock-pill ${Number(row.stockCount) <= Number(row.reorderLevel) ? 'low' : 'ok'}`}>{Number(row.stockCount) <= Number(row.reorderLevel) ? 'Reorder' : 'Healthy'}</span></td></tr>)}</tbody></table>{!filteredInventory.length && <p className="reports-empty">No matching products.</p>}</div>}
          {activeReport === 'payments' && <OrdersTable rows={filteredOrders} detailed />}
          {activeReport === 'pets' && <div className="reports-table-wrap"><table><thead><tr><th>Pet</th><th>Species / breed</th><th>Owner</th><th>Age / weight</th><th>Visits</th><th>Clinical history</th><th>Next checkup</th></tr></thead><tbody>{filteredPets.map((row) => <tr key={row.id}><td><strong>{row.name}</strong><small>Registered {dateLabel(row.registeredAt)}</small></td><td>{row.species}{row.breed ? ` · ${row.breed}` : ''}</td><td><strong>{row.ownerName || '—'}</strong><small>{row.ownerEmail || row.ownerPhone || ''}</small></td><td>{row.age || '—'}{row.weight ? ` · ${row.weight}` : ''}</td><td>{Number(row.visitCount || 0)}</td><td className="reports-history-cell">{row.medicalHistory?.length ? row.medicalHistory.slice(0, 3).map((visit, index) => <small key={`${visit.date}-${index}`}>{visit.date} · {visit.type} · {visit.doctor} · {visit.status}</small>) : 'No history recorded'}</td><td>{row.nextCheckup || '—'}</td></tr>)}</tbody></table>{!filteredPets.length && <p className="reports-empty">No matching pet records.</p>}</div>}
        </article>}
        {error && !report.range && <div className="reports-empty-card">Reports could not be loaded. Check your admin session and database connection, then refresh.</div>}
      </>}
    </section>
  )
}

function OrdersTable({ rows, detailed = false }) {
  return <div className="reports-table-wrap"><table><thead><tr><th>Date</th><th>Order</th><th>Customer</th><th>Method</th><th>Payment</th><th>Order status</th>{detailed ? <><th>Subtotal</th><th>Discount</th><th>Delivery</th><th>Total</th></> : <th>Total</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{dateLabel(row.created_at)}</td><td><strong>{row.order_number}</strong></td><td>{row.customer_name}</td><td>{row.payment_method || '—'}</td><td><span className={`reports-status ${row.payment_status === 'paid' ? 'paid' : 'pending'}`}>{row.payment_status || 'unknown'}</span></td><td>{row.status}</td>{detailed ? <><td>{money(row.subtotal)}</td><td>{money(row.discount_amount)}</td><td>{money(row.delivery_fee)}</td><td>{money(row.total_amount)}</td></> : <td>{money(row.total_amount)}</td>}</tr>)}</tbody></table>{!rows.length && <p className="reports-empty">No orders for this date range.</p>}</div>
}
