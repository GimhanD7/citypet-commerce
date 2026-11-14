import React, { useEffect, useState } from 'react'
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Eye,
  Plus,
  ArrowUpDown,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  Building,
  Package,
  X,
  Save,
  FileText,
} from 'lucide-react'
import { orderService } from '../../../services/api'
import './orders_payments.css'

// Initial seed orders for fallback
const SEED_ORDERS = [
  {
    id: 'ord-75821',
    orderNumber: '#CP75821',
    date: 'Apr 28, 2024',
    customerName: 'Sarah Perera',
    email: 'sarah.p@gmail.com',
    phone: '+94 77 123 4567',
    itemTitle: 'Royal Canin Mini Adult Dry Dog Food 2kg',
    itemsCount: 3,
    totalPrice: 7950,
    subtotal: 7500,
    deliveryFee: 450,
    discountAmount: 0,
    deliveryMethod: 'standard',
    paymentMethod: 'card',
    status: 'Delivered',
    statusType: 'delivered',
    trackingNumber: 'CP-TRK-849201',
    address: {
      line1: 'No 45, Alfred House Gardens',
      city: 'Colombo 03',
      postalCode: '00300',
    },
    itemsList: [
      { name: 'Royal Canin Mini Adult Dry Dog Food', size: '2 kg', price: 5500, qty: 1, lineTotal: 5500 },
      { name: 'Dental Bone Chew Toy', size: 'Medium', price: 1200, qty: 1, lineTotal: 1200 },
      { name: 'Salmon Oil Supplement Drops', size: '100ml', price: 800, qty: 1, lineTotal: 800 },
    ],
    trackingSteps: [
      { label: 'Order Placed', time: 'Apr 28, 09:30 AM', done: true },
      { label: 'Veterinary Pharmacist Review', time: 'Apr 28, 10:15 AM', done: true },
      { label: 'Packing & Quality Verification', time: 'Apr 28, 11:30 AM', done: true },
      { label: 'Delivered to Customer', time: 'Apr 29, 02:45 PM', done: true },
    ],
  },
  {
    id: 'ord-75820',
    orderNumber: '#CP75820',
    date: 'Apr 28, 2024',
    customerName: 'Nimesh Fernando',
    email: 'nimesh.f@gmail.com',
    phone: '+94 71 889 2314',
    itemTitle: "Hill's Science Diet Adult Cat Food 1.5kg",
    itemsCount: 2,
    totalPrice: 6800,
    subtotal: 6800,
    deliveryFee: 0,
    discountAmount: 0,
    deliveryMethod: 'pickup',
    paymentMethod: 'counter',
    status: 'Ready for Pickup',
    statusType: 'ready_pickup',
    trackingNumber: 'CP-TRK-774912',
    address: {
      line1: 'City Pet Central Pharmacy Counter',
      city: 'Colombo 07',
      postalCode: '00700',
    },
    itemsList: [
      { name: "Hill's Science Diet Adult Cat Food", size: '1.5 kg', price: 4800, qty: 1, lineTotal: 4800 },
      { name: 'Catnip Plush Fish Toy', size: 'Standard', price: 2000, qty: 1, lineTotal: 2000 },
    ],
    trackingSteps: [
      { label: 'Order Placed', time: 'Apr 28, 11:00 AM', done: true },
      { label: 'Veterinary Pharmacist Review', time: 'Apr 28, 11:20 AM', done: true },
      { label: 'Prepared & Labelled', time: 'Apr 28, 12:15 PM', done: true },
      { label: 'Ready for Hospital Pickup', time: 'Apr 28, 12:30 PM', done: true },
    ],
  },
  {
    id: 'ord-75819',
    orderNumber: '#CP75819',
    date: 'Apr 27, 2024',
    customerName: 'Dilini Jayasuriya',
    email: 'dilini.j@hotmail.com',
    phone: '+94 76 543 9876',
    itemTitle: "Vet's Best Omega-3 for Dogs",
    itemsCount: 1,
    totalPrice: 4650,
    subtotal: 4200,
    deliveryFee: 450,
    discountAmount: 0,
    deliveryMethod: 'standard',
    paymentMethod: 'cod',
    status: 'Shipped',
    statusType: 'shipped',
    trackingNumber: 'CP-TRK-661209',
    address: {
      line1: '12/4 Flower Road',
      city: 'Rajagiriya',
      postalCode: '10107',
    },
    itemsList: [
      { name: "Vet's Best Omega-3 for Dogs", size: '60 Softgels', price: 4200, qty: 1, lineTotal: 4200 },
    ],
    trackingSteps: [
      { label: 'Order Placed', time: 'Apr 27, 02:15 PM', done: true },
      { label: 'Veterinary Pharmacist Review', time: 'Apr 27, 03:00 PM', done: true },
      { label: 'Dispatched with Courier (City Pet Fleet)', time: 'Apr 28, 08:30 AM', done: true },
      { label: 'Out for Delivery', time: 'In Transit', done: false },
    ],
  },
  {
    id: 'ord-75818',
    orderNumber: '#CP75818',
    date: 'Apr 26, 2024',
    customerName: 'Kasun Wijesinghe',
    email: 'kasun.w@gmail.com',
    phone: '+94 77 999 1234',
    itemTitle: 'KONG Cozie Plush Dog Toy & Supplements',
    itemsCount: 4,
    totalPrice: 12450,
    subtotal: 12450,
    deliveryFee: 0,
    discountAmount: 0,
    deliveryMethod: 'standard',
    paymentMethod: 'card',
    status: 'Delivered',
    statusType: 'delivered',
    trackingNumber: 'CP-TRK-553102',
    address: {
      line1: '88 Pagoda Road',
      city: 'Nugegoda',
      postalCode: '10250',
    },
    itemsList: [
      { name: 'KONG Cozie Plush Dog Toy', size: 'Medium', price: 2450, qty: 2, lineTotal: 4900 },
      { name: 'Tick & Flea Prevention Shampoo', size: '500ml', price: 3800, qty: 1, lineTotal: 3800 },
      { name: 'Oral Dental Hygiene Gel', size: '100g', price: 3750, qty: 1, lineTotal: 3750 },
    ],
    trackingSteps: [
      { label: 'Order Placed', time: 'Apr 26, 10:00 AM', done: true },
      { label: 'Veterinary Pharmacist Review', time: 'Apr 26, 10:45 AM', done: true },
      { label: 'Packed & Handed to Courier', time: 'Apr 26, 02:00 PM', done: true },
      { label: 'Delivered to Customer', time: 'Apr 27, 11:30 AM', done: true },
    ],
  },
  {
    id: 'ord-75817',
    orderNumber: '#CP75817',
    date: 'Apr 26, 2024',
    customerName: 'Tharushi Kimara',
    email: 'tharushi.k@yahoo.com',
    phone: '+94 75 222 7890',
    itemTitle: 'Cat Litter Box Large & Eco Sand',
    itemsCount: 2,
    totalPrice: 5600,
    subtotal: 5150,
    deliveryFee: 450,
    discountAmount: 0,
    deliveryMethod: 'standard',
    paymentMethod: 'card',
    status: 'Processing',
    statusType: 'processing',
    trackingNumber: 'CP-TRK-442198',
    address: {
      line1: '45 Galle Road',
      city: 'Mount Lavinia',
      postalCode: '10370',
    },
    itemsList: [
      { name: 'Cat Litter Box (Large)', size: 'L - Grey', price: 3900, qty: 1, lineTotal: 3900 },
      { name: 'Natural Clumping Bentonite Sand', size: '5 kg', price: 1250, qty: 1, lineTotal: 1250 },
    ],
    trackingSteps: [
      { label: 'Order Placed', time: 'Apr 26, 04:20 PM', done: true },
      { label: 'Veterinary Pharmacist Review', time: 'Pending', done: false },
      { label: 'Packing in Progress', time: 'Pending', done: false },
      { label: 'Dispatched for Delivery', time: 'Pending', done: false },
    ],
  },
]

export default function OrdersView({ onOpenCreateOrder, showToast }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [viewingOrder, setViewingOrder] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [reviewingPaymentId, setReviewingPaymentId] = useState(null)
  const [deliverySettings, setDeliverySettings] = useState([
    { id: 'standard', name: 'Standard Delivery', time: '2 - 4 working days', fee: 350, enabled: true },
    { id: 'express', name: 'Express Delivery', time: '1 - 2 working days', fee: 700, enabled: true },
  ])
  const [savingDelivery, setSavingDelivery] = useState(false)

  // Fetch orders on mount
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await orderService.getAllOrders()
      const list = Array.isArray(data) ? data : (data?.orders || [])
      if (list.length > 0) {
        setOrders(list)
      } else {
        setOrders(SEED_ORDERS)
      }
    } catch (err) {
      console.warn('Failed to load orders, using seed data:', err)
      setOrders(SEED_ORDERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    orderService.getDeliverySettings({ includeDisabled: true })
      .then((methods) => {
        if (Array.isArray(methods) && methods.length > 0) {
          setDeliverySettings(methods.map((method) => ({
            ...method,
            fee: Number(method.fee ?? method.price ?? 0),
            enabled: method.enabled !== false,
          })))
        }
      })
      .catch((err) => console.warn('Failed to load delivery settings:', err))
  }, [])

  const getDeliveryLabel = (methodId) => {
    if (methodId === 'pickup') return 'Hospital Pickup'
    return deliverySettings.find((method) => method.id === methodId)?.name || 'Islandwide Courier'
  }

  const handleDeliverySettingChange = (id, field, value) => {
    setDeliverySettings((prev) =>
      prev.map((method) =>
        method.id === id
          ? { ...method, [field]: field === 'fee' ? Number(value) : value }
          : method
      )
    )
  }

  const handleSaveDeliverySettings = async () => {
    setSavingDelivery(true)
    try {
      const res = await orderService.updateDeliverySettings(deliverySettings)
      if (Array.isArray(res?.methods)) {
        setDeliverySettings(res.methods.map((method) => ({
          ...method,
          fee: Number(method.fee ?? method.price ?? 0),
          enabled: method.enabled !== false,
        })))
      }
      showToast?.('Delivery options updated for checkout.')
    } catch (err) {
      console.warn('Failed to save delivery settings:', err)
      showToast?.(err.message || 'Failed to update delivery options.')
    } finally {
      setSavingDelivery(false)
    }
  }

  const handleReviewBankTransfer = async (order, paymentAction) => {
    const orderId = order.id || order.orderNumber
    setReviewingPaymentId(orderId)
    try {
      const res = await orderService.reviewBankTransfer(orderId, paymentAction)
      const patch = {
        paymentStatus: res.paymentStatus,
        status: res.status,
        statusType: res.statusType,
      }
      setOrders((prev) =>
        prev.map((item) =>
          item.id === orderId || item.orderNumber === orderId ? { ...item, ...patch } : item
        )
      )
      setViewingOrder((prev) => prev ? { ...prev, ...patch } : prev)
      showToast?.(paymentAction === 'verify' ? `Bank payment verified for ${order.orderNumber}.` : `Bank payment rejected for ${order.orderNumber}.`)
    } catch (err) {
      showToast?.(err.message || 'Payment review failed.')
    } finally {
      setReviewingPaymentId(null)
    }
  }

  // Handle status update
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      const statusTypeMap = {
        'Delivered': 'delivered',
        'Processing': 'processing',
        'Ready for Pickup': 'ready_pickup',
        'Shipped': 'shipped',
        'Cancelled': 'cancelled',
      }
      const newType = statusTypeMap[newStatus] || newStatus.toLowerCase().replace(/\s+/g, '_')

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId || o.orderNumber === orderId
            ? { ...o, status: newStatus, statusType: newType }
            : o
        )
      )
      if (viewingOrder && (viewingOrder.id === orderId || viewingOrder.orderNumber === orderId)) {
        setViewingOrder((prev) => ({ ...prev, status: newStatus, statusType: newType }))
      }
      showToast?.(`Order ${orderId} updated to "${newStatus}"!`)
    } catch (err) {
      console.warn('Status update failed:', err)
      showToast?.(`Failed to update status for ${orderId}`)
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      !q ||
      (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
      (o.phone && o.phone.toLowerCase().includes(q)) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
      (o.itemTitle && o.itemTitle.toLowerCase().includes(q))

    const matchStatus =
      statusFilter === 'all' ? true : (o.statusType === statusFilter || o.status.toLowerCase() === statusFilter)

    const matchDelivery =
      deliveryFilter === 'all' ? true : (o.deliveryMethod === deliveryFilter)

    return matchSearch && matchStatus && matchDelivery
  })

  // KPI calculations
  const totalOrders = orders.length
  const processingCount = orders.filter((o) => o.statusType === 'processing' || o.status === 'Processing').length
  const readyOrShippedCount = orders.filter((o) => ['ready_pickup', 'shipped'].includes(o.statusType) || ['Ready for Pickup', 'Shipped'].includes(o.status)).length
  const deliveredCount = orders.filter((o) => o.statusType === 'delivered' || o.status === 'Delivered').length
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0)

  return (
    <div className="orders-admin-page">
      {/* ── Page Header ── */}
      <div className="orders-page-header">
        <div className="orders-header-text">
          <span className="orders-eyebrow">Hospital &amp; Store Fulfillment</span>
          <h2 className="orders-page-title">Orders Management</h2>
          <p className="orders-page-desc">
            Track pharmacy prescriptions, retail purchases, and live islandwide delivery statuses.
          </p>
        </div>
        <div className="orders-header-actions">
          <button
            type="button"
            className="orders-refresh-btn"
            onClick={fetchOrders}
            title="Refresh orders from central database"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Live</span>
          </button>
          <button
            type="button"
            className="orders-create-btn"
            onClick={onOpenCreateOrder}
          >
            <Plus size={16} />
            <span>Create Rx / Order</span>
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="orders-kpi-grid">
        <div className="orders-kpi-card">
          <div className="orders-kpi-icon-wrap mint">
            <ShoppingBag size={22} />
          </div>
          <div className="orders-kpi-texts">
            <span className="orders-kpi-label">Total Orders</span>
            <strong className="orders-kpi-val">{totalOrders}</strong>
            <span className="orders-kpi-sub">LKR {totalRevenue.toLocaleString()} volume</span>
          </div>
        </div>

        <div className="orders-kpi-card">
          <div className="orders-kpi-icon-wrap amber">
            <Clock size={22} />
          </div>
          <div className="orders-kpi-texts">
            <span className="orders-kpi-label">Processing / In Rx</span>
            <strong className="orders-kpi-val">{processingCount}</strong>
            <span className="orders-kpi-sub">Needs pharmacist review</span>
          </div>
        </div>

        <div className="orders-kpi-card">
          <div className="orders-kpi-icon-wrap blue">
            <Truck size={22} />
          </div>
          <div className="orders-kpi-texts">
            <span className="orders-kpi-label">Ready &amp; In-Transit</span>
            <strong className="orders-kpi-val">{readyOrShippedCount}</strong>
            <span className="orders-kpi-sub">Pickup counter &amp; courier</span>
          </div>
        </div>

        <div className="orders-kpi-card">
          <div className="orders-kpi-icon-wrap green">
            <CheckCircle2 size={22} />
          </div>
          <div className="orders-kpi-texts">
            <span className="orders-kpi-label">Delivered &amp; Completed</span>
            <strong className="orders-kpi-val">{deliveredCount}</strong>
            <span className="orders-kpi-sub">Successfully fulfilled</span>
          </div>
        </div>
      </div>

      <div className="orders-table-card" style={{ padding: '18px', marginBottom: '18px' }}>
        <div className="orders-page-header" style={{ marginBottom: '14px' }}>
          <div className="orders-header-text">
            <span className="orders-eyebrow">Checkout Delivery</span>
            <h3 className="orders-page-title" style={{ fontSize: '20px' }}>Delivery Options</h3>
            <p className="orders-page-desc">
              Enable or disable customer delivery choices and update the checkout fee.
            </p>
          </div>
          <button
            type="button"
            className="orders-create-btn"
            onClick={handleSaveDeliverySettings}
            disabled={savingDelivery}
          >
            <Save size={15} />
            <span>{savingDelivery ? 'Saving...' : 'Save Delivery'}</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(240px, 1fr))', gap: '12px' }}>
          {deliverySettings.map((method) => (
            <div
              key={method.id}
              style={{
                border: '1px solid rgba(23, 61, 59, 0.12)',
                borderRadius: '12px',
                padding: '14px',
                background: method.enabled ? '#f7fcfb' : '#f8faf9',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
                <span style={{ fontWeight: 900, color: '#173d3b' }}>{method.name}</span>
                <input
                  type="checkbox"
                  checked={method.enabled}
                  onChange={(e) => handleDeliverySettingChange(method.id, 'enabled', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#04959d' }}
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '10px' }}>
                <input
                  className="orders-select-filter"
                  type="text"
                  value={method.time || ''}
                  onChange={(e) => handleDeliverySettingChange(method.id, 'time', e.target.value)}
                  placeholder="Delivery time"
                />
                <input
                  className="orders-select-filter"
                  type="number"
                  min="0"
                  value={method.fee}
                  onChange={(e) => handleDeliverySettingChange(method.id, 'fee', e.target.value)}
                  placeholder="Fee"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="orders-toolbar">
        <div className="orders-search-box">
          <Search size={16} style={{ color: '#7aa39e' }} />
          <input
            type="text"
            className="orders-search-input"
            placeholder="Search by Order #, Customer, Phone, or Tracking #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              style={{ border: 0, background: 'none', cursor: 'pointer', color: '#7aa39e' }}
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="orders-filters-group">
          <select
            className="orders-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="processing">Processing</option>
            <option value="ready_pickup">Ready for Pickup</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            className="orders-select-filter"
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
          >
            <option value="all">All Delivery Modes</option>
            <option value="standard">Standard Delivery</option>
            <option value="express">Express Delivery</option>
            <option value="pickup">Hospital Counter Pickup</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="orders-table-card">
        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th className="orders-th">Order # &amp; Date</th>
                <th className="orders-th">Customer</th>
                <th className="orders-th">Order Summary</th>
                <th className="orders-th">Delivery &amp; Method</th>
                <th className="orders-th">Total (LKR)</th>
                <th className="orders-th">Status</th>
                <th className="orders-th" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#8daea9' }}>
                    <Package size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#173d3b' }}>
                      No matching orders found
                    </p>
                    <small style={{ color: '#7aa39e' }}>Try adjusting your search terms or filter selection</small>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const sType = o.statusType || 'processing'
                  return (
                    <tr key={o.id || o.orderNumber} className="orders-row">
                      {/* Order # */}
                      <td className="orders-td">
                        <div className="order-num-block">
                          <span className="order-num-bold">{o.orderNumber || o.id}</span>
                          <span className="order-date-sub">{o.date}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="orders-td">
                        <div className="order-customer-cell">
                          <span className="order-customer-name">{o.customerName || 'Customer'}</span>
                          <span className="order-customer-contact">
                            {o.phone || o.email || 'Verified Buyer'}
                          </span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="orders-td">
                        <div className="order-items-preview">
                          <span className="order-items-title">{o.itemTitle || 'Pet Care Essentials'}</span>
                          <span className="order-items-badge">
                            {o.itemsCount || (o.itemsList ? o.itemsList.length : 1)} item{o.itemsCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </td>

                      {/* Delivery & Payment */}
                      <td className="orders-td">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span className={`order-method-badge ${o.paymentMethod === 'card' ? 'card' : o.paymentMethod === 'cod' ? 'cod' : ''}`}>
                            {o.deliveryMethod === 'pickup' ? 'Hospital Pickup' : getDeliveryLabel(o.deliveryMethod)}
                          </span>
                          <small style={{ fontSize: '11px', color: '#8daea9' }}>
                            {o.address?.city || 'Colombo'} &bull; {o.paymentMethod?.toUpperCase() || 'CARD'}
                          </small>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="orders-td">
                        <span className="order-total-bold">
                          LKR {Number(o.totalPrice || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Status Selector */}
                      <td className="orders-td">
                        <select
                          className={`order-status-pill status-${sType}`}
                          value={o.status}
                          disabled={updatingId === o.id}
                          onChange={(e) => handleStatusChange(o.id || o.orderNumber, e.target.value)}
                        >
                          <option value="Processing">⏳ Processing</option>
                          <option value="Ready for Pickup">🏥 Ready for Pickup</option>
                          <option value="Shipped">🚚 Shipped</option>
                          <option value="Delivered">✅ Delivered</option>
                          <option value="Cancelled">❌ Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="orders-td" style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="order-action-btn"
                          title="View order tracking & receipt"
                          onClick={() => setViewingOrder(o)}
                        >
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Order Details Modal ── */}
      {viewingOrder && (
        <div className="order-modal-backdrop" onClick={() => setViewingOrder(null)}>
          <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div className="order-modal-header-left">
                <div className="order-modal-icon">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="order-modal-title">Order {viewingOrder.orderNumber || viewingOrder.id}</h3>
                  <p className="order-modal-subtitle">Placed on {viewingOrder.date} &bull; Tracking: {viewingOrder.trackingNumber}</p>
                </div>
              </div>
              <button
                type="button"
                className="order-modal-close"
                onClick={() => setViewingOrder(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="order-modal-body">
              {/* Customer & Shipping Details */}
              <div>
                <span className="order-modal-section-title">Delivery &amp; Customer Information</span>
                <div className="order-info-grid">
                  <div className="order-info-item">
                    <span className="order-info-label">Customer Name</span>
                    <strong className="order-info-value">{viewingOrder.customerName}</strong>
                  </div>
                  <div className="order-info-item">
                    <span className="order-info-label">Contact Phone</span>
                    <strong className="order-info-value">{viewingOrder.phone || '+94 77 123 4567'}</strong>
                  </div>
                  <div className="order-info-item">
                    <span className="order-info-label">Delivery Address</span>
                    <strong className="order-info-value">
                      {viewingOrder.address?.line1 || 'Alfred House Gardens'}, {viewingOrder.address?.city || 'Colombo'}
                    </strong>
                  </div>
                  <div className="order-info-item">
                    <span className="order-info-label">Payment Channel</span>
                    <strong className="order-info-value" style={{ textTransform: 'uppercase' }}>
                      {viewingOrder.paymentMethod === 'card'
                        ? 'PayHere Card Payment'
                        : viewingOrder.paymentMethod === 'bank'
                        ? 'Direct Bank Transfer'
                        : viewingOrder.paymentMethod || 'Credit / Debit Card'}
                    </strong>
                  </div>
                  <div className="order-info-item">
                    <span className="order-info-label">Delivery Method</span>
                    <strong className="order-info-value">{getDeliveryLabel(viewingOrder.deliveryMethod)}</strong>
                  </div>
                </div>

                {viewingOrder.paymentSlip && (
                  <div style={{ marginTop: '12px', padding: '12px 16px', background: '#f0f9f8', borderRadius: '12px', border: '1px solid #bce8e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} color="#04959d" />
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#123835' }}>Bank Payment Slip Attached</strong>
                        <span style={{ fontSize: '11px', color: '#557e79' }}>Customer uploaded deposit receipt for verification</span>
                      </div>
                    </div>
                    <a
                      href={viewingOrder.paymentSlip}
                      target="_blank"
                      rel="noreferrer"
                      style={{ background: '#04959d', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>View Slip</span> ↗
                    </a>
                  </div>
                )}

                {viewingOrder.paymentMethod === 'bank' && viewingOrder.paymentStatus !== 'paid' && viewingOrder.paymentStatus !== 'rejected' && (
                  <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fffaf0', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#713f12' }}>
                        Bank transfer awaiting admin review
                      </strong>
                      <span style={{ fontSize: '11px', color: '#92400e' }}>
                        Verify only when the bank amount matches products plus delivery fee.
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="orders-create-btn"
                        disabled={reviewingPaymentId === (viewingOrder.id || viewingOrder.orderNumber)}
                        onClick={() => handleReviewBankTransfer(viewingOrder, 'verify')}
                      >
                        <CheckCircle2 size={14} />
                        <span>Verify Payment</span>
                      </button>
                      <button
                        type="button"
                        className="order-action-btn"
                        disabled={reviewingPaymentId === (viewingOrder.id || viewingOrder.orderNumber)}
                        onClick={() => handleReviewBankTransfer(viewingOrder, 'reject')}
                      >
                        <XCircle size={14} />
                        <span>Reject Payment</span>
                      </button>
                    </div>
                  </div>
                )}

                {viewingOrder.paymentStatus === 'rejected' && (
                  <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3', color: '#991b1b' }}>
                    <strong style={{ display: 'block', fontSize: '13px' }}>Payment rejected</strong>
                    <span style={{ fontSize: '11px' }}>
                      This order is blocked because the submitted bank transfer did not match the order amount.
                    </span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <span className="order-modal-section-title">Purchased Items &amp; Prescriptions</span>
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Option</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewingOrder.itemsList || [
                      { name: viewingOrder.itemTitle || 'Pet Product', size: 'Standard', price: viewingOrder.totalPrice, qty: 1, lineTotal: viewingOrder.totalPrice },
                    ]).map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: '#173d3b' }}>{item.name}</td>
                        <td style={{ color: '#7aa39e' }}>{item.size || 'Default'}</td>
                        <td>LKR {Number(item.price || 0).toLocaleString()}</td>
                        <td>{item.qty || 1}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800 }}>
                          LKR {Number(item.lineTotal || item.price * (item.qty || 1)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Price Breakdown */}
              <div className="order-totals-summary">
                <div className="order-total-row">
                  <span>Subtotal:</span>
                  <span>LKR {Number(viewingOrder.subtotal || viewingOrder.totalPrice).toLocaleString()}</span>
                </div>
                <div className="order-total-row">
                  <span>Delivery Fee:</span>
                  <span>{viewingOrder.deliveryFee ? `LKR ${Number(viewingOrder.deliveryFee).toLocaleString()}` : 'FREE'}</span>
                </div>
                {Number(viewingOrder.discountAmount) > 0 && (
                  <div className="order-total-row" style={{ color: '#16a34a' }}>
                    <span>Promo Discount:</span>
                    <span>- LKR {Number(viewingOrder.discountAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="order-total-row grand-total">
                  <span>Total Amount Paid:</span>
                  <span>LKR {Number(viewingOrder.totalPrice || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Live Tracking Milestones */}
              <div>
                <span className="order-modal-section-title">Milestone Progress &amp; Audit Trail</span>
                <div className="order-tracking-steps-list">
                  {(viewingOrder.trackingSteps || [
                    { label: 'Order Placed', time: viewingOrder.date, done: true },
                    { label: 'Veterinary Pharmacist Review', time: 'Completed', done: true },
                    { label: 'Packed & Dispatched', time: 'In Progress', done: viewingOrder.status === 'Delivered' || viewingOrder.status === 'Shipped' },
                    { label: 'Delivered to Customer', time: 'Pending', done: viewingOrder.status === 'Delivered' },
                  ]).map((step, sIdx) => (
                    <div key={sIdx} className={`order-step-item ${step.done ? 'done' : ''}`}>
                      <span className="order-step-dot" />
                      <span className="order-step-name">{step.label}</span>
                      <span className="order-step-time">{step.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
