import { mediaUrl } from '../../../config/media'
import './operations.css'
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
  FileText,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react'
import { orderService, smsService } from '../../../services/api'
import SendSmsModal from '../modals/SendSmsModal'
import './orders_payments.css'

export default function OrdersView({ onOpenCreateOrder, showToast }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deliveryFilter, setDeliveryFilter] = useState('all')
  const [viewingOrder, setViewingOrder] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [reviewingPaymentId, setReviewingPaymentId] = useState(null)
  // SMS Management States
  const [activeViewMode, setActiveViewMode] = useState('orders') // 'orders' | 'sms_logs'
  const [smsModalOrder, setSmsModalOrder] = useState(null)
  const [viewingOrderSms, setViewingOrderSms] = useState([])
  const [loadingViewingOrderSms, setLoadingViewingOrderSms] = useState(false)
  const [allSmsLogs, setAllSmsLogs] = useState([])
  const [loadingAllSms, setLoadingAllSms] = useState(false)

  // Fetch orders on mount
  const fetchOrders = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await orderService.getAllOrders()
      const list = Array.isArray(data) ? data : (data?.orders || [])
      setOrders(list)
    } catch (err) {
      console.warn('Failed to load orders:', err)
      setLoadError(err.message || 'Unable to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Load SMS logs for viewing order
  useEffect(() => {
    if (!viewingOrder?.id && !viewingOrder?.orderNumber) {
      setViewingOrderSms([])
      return
    }
    setLoadingViewingOrderSms(true)
    smsService.getOrderSmsLogs(viewingOrder.id || viewingOrder.orderNumber)
      .then((logs) => setViewingOrderSms(Array.isArray(logs) ? logs : []))
      .catch((err) => console.warn('Failed to load SMS for viewing order:', err))
      .finally(() => setLoadingViewingOrderSms(false))
  }, [viewingOrder])

  // Load all SMS logs for admin SMS sent tab
  const fetchAllSmsLogs = async () => {
    setLoadingAllSms(true)
    try {
      const logs = await smsService.getAllSmsLogs(100)
      setAllSmsLogs(Array.isArray(logs) ? logs : [])
    } catch (err) {
      console.warn('Failed to load all SMS logs:', err)
      setAllSmsLogs([])
    } finally {
      setLoadingAllSms(false)
    }
  }

  useEffect(() => {
    if (activeViewMode === 'sms_logs') {
      fetchAllSmsLogs()
    }
  }, [activeViewMode])

  const handleSmsSent = (orderId) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderNumber === orderId
          ? { ...o, smsCount: (o.smsCount || 0) + 1 }
          : o
      )
    )
    if (viewingOrder && (viewingOrder.id === orderId || viewingOrder.orderNumber === orderId)) {
      smsService.getOrderSmsLogs(orderId).then((logs) => {
        setViewingOrderSms(Array.isArray(logs) ? logs : [])
      })
    }
    if (activeViewMode === 'sms_logs') {
      fetchAllSmsLogs()
    }
  }

  const getDeliveryLabel = (methodId) => ({
    pickup: 'Hospital Pickup', standard: 'Standard Delivery', express: 'Express Delivery',
  })[methodId] || 'Islandwide Courier'

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
      setViewingOrder((prev) => prev && (prev.id === orderId || prev.orderNumber === orderId) ? { ...prev, ...patch } : prev)
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
    <div className="orders-admin-page admin-operations-page">
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
          {/* View Mode Switcher */}
          <div style={{ display: 'inline-flex', background: '#eef6f4', borderRadius: '12px', padding: '3px', border: '1px solid #d4e8e3' }}>
            <button
              type="button"
              onClick={() => setActiveViewMode('orders')}
              style={{
                border: 'none',
                borderRadius: '9px',
                padding: '7px 15px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                background: activeViewMode === 'orders' ? '#ffffff' : 'transparent',
                color: activeViewMode === 'orders' ? '#04959d' : '#557e79',
                boxShadow: activeViewMode === 'orders' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <ShoppingBag size={14} /> Orders ({totalOrders})
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('sms_logs')}
              style={{
                border: 'none',
                borderRadius: '9px',
                padding: '7px 15px',
                fontSize: '12.5px',
                fontWeight: 800,
                cursor: 'pointer',
                background: activeViewMode === 'sms_logs' ? '#ffffff' : 'transparent',
                color: activeViewMode === 'sms_logs' ? '#04959d' : '#557e79',
                boxShadow: activeViewMode === 'sms_logs' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageSquare size={14} /> SMS Sent Logs
            </button>
          </div>

          <button
            type="button"
            className="orders-refresh-btn"
            onClick={activeViewMode === 'orders' ? fetchOrders : fetchAllSmsLogs}
            title="Refresh from central database"
          >
            <RefreshCw size={14} className={(loading || loadingAllSms) ? 'animate-spin' : ''} />
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
            <option value="express">Express Delivery (past orders)</option>
            <option value="pickup">Hospital Counter Pickup</option>
          </select>
        </div>
      </div>

      {/* ── Orders Table or SMS Sent Logs Table ── */}
      {activeViewMode === 'orders' ? (
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
                {loading || loadError || filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#8daea9' }}>
                      <Package size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#173d3b' }}>
                        {loading ? 'Loading orders…' : loadError || 'No matching orders found'}
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
                            {o.smsCount > 0 && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  color: '#04959d',
                                  background: '#eef9f8',
                                  padding: '2px 7px',
                                  borderRadius: '10px',
                                  width: 'fit-content',
                                  marginTop: '3px',
                                }}
                                title={`${o.smsCount} SMS notification(s) sent`}
                              >
                                <MessageSquare size={11} /> {o.smsCount} SMS sent
                              </span>
                            )}
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
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="order-action-btn"
                              title="Send SMS update to customer"
                              style={{ color: '#04959d', borderColor: '#bce1db' }}
                              onClick={() => setSmsModalOrder(o)}
                            >
                              <MessageSquare size={13} />
                              SMS
                            </button>
                            <button
                              type="button"
                              className="order-action-btn"
                              title="View order tracking & receipt"
                              onClick={() => setViewingOrder(o)}
                            >
                              <Eye size={13} />
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* SMS Dispatch Audit Logs Table */
        <div className="orders-table-card">
          <div className="orders-page-header" style={{ padding: '18px 22px', borderBottom: '1px solid #ebf4f1', margin: 0, flexWrap: 'nowrap' }}>
            <div className="orders-header-text">
              <span className="orders-eyebrow">Customer Communication Logs</span>
              <h3 className="orders-page-title" style={{ fontSize: '20px' }}>SMS Dispatch History</h3>
              <p className="orders-page-desc">
                Live audit trail of all automated &amp; manual SMS alerts sent to customers.
              </p>
            </div>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#04959d',
                background: '#eef9f8',
                border: '1px solid #d4e8e3',
                padding: '6px 16px',
                borderRadius: '20px',
                whiteSpace: 'nowrap',
              }}
            >
              Total Sent: {allSmsLogs.length}
            </span>
          </div>

          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th className="orders-th">Time &amp; Date</th>
                  <th className="orders-th">Order #</th>
                  <th className="orders-th">Recipient</th>
                  <th className="orders-th">Message Body</th>
                  <th className="orders-th">Category</th>
                  <th className="orders-th">Sent By</th>
                  <th className="orders-th" style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingAllSms ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#7a9f9b' }}>
                      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>Loading SMS logs from database...</p>
                    </td>
                  </tr>
                ) : allSmsLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#8daea9' }}>
                      <MessageSquare size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#173d3b' }}>
                        No SMS notifications dispatched yet
                      </p>
                      <small style={{ color: '#7aa39e' }}>
                        Click the "SMS" button on any order to send real-time tracking and delivery notices.
                      </small>
                    </td>
                  </tr>
                ) : (
                  allSmsLogs.map((sms) => (
                    <tr key={sms.id} className="orders-row">
                      <td className="orders-td" style={{ fontSize: '12px', color: '#688d88', whiteSpace: 'nowrap' }}>
                        {sms.created_at}
                      </td>
                      <td className="orders-td">
                        <strong style={{ color: '#123835', fontSize: '13px' }}>
                          {sms.order_number || sms.order_id || 'Direct'}
                        </strong>
                      </td>
                      <td className="orders-td">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 800, color: '#173d3b', fontSize: '13px' }}>
                            {sms.recipient_name || 'Customer'}
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#04959d', fontWeight: 600 }}>
                            {sms.recipient_phone}
                          </span>
                        </div>
                      </td>
                      <td className="orders-td" style={{ maxWidth: '340px' }}>
                        <span style={{ fontSize: '12.5px', color: '#2b524e', lineHeight: '1.45', display: 'block' }}>
                          {sms.message}
                        </span>
                      </td>
                      <td className="orders-td">
                        <span
                          style={{
                            background: '#eef9f8',
                            color: '#04959d',
                            fontWeight: 800,
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {sms.template_type || 'custom'}
                        </span>
                      </td>
                      <td className="orders-td" style={{ fontSize: '12px', color: '#557e79', whiteSpace: 'nowrap' }}>
                        {sms.sent_by || 'Admin Staff'}
                      </td>
                      <td className="orders-td" style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            background: '#e9f8f3',
                            color: '#00a86b',
                            padding: '3px 9px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            fontSize: '11.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} /> Sent
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                      href={mediaUrl(viewingOrder.paymentSlip)}
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

                {/* SMS Live Notifications & Communication Card */}
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px 18px',
                    background: '#f0f9f8',
                    borderRadius: '14px',
                    border: '1.5px solid #bce8e3',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: viewingOrderSms.length > 0 ? '14px' : '0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#04959d',
                          boxShadow: '0 2px 8px rgba(4, 149, 157, 0.15)',
                        }}
                      >
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '14px', color: '#123835' }}>
                            Customer SMS Updates
                          </strong>
                          <span
                            style={{
                              fontSize: '11px',
                              background: '#e0f5ee',
                              color: '#00a86b',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '10px',
                            }}
                          >
                            ✓ Gateway Active
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#557e79' }}>
                          Linked phone: <strong>{viewingOrder.phone || 'No phone'}</strong> &bull;{' '}
                          {viewingOrderSms.length} message{viewingOrderSms.length !== 1 ? 's' : ''} dispatched
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="orders-create-btn"
                      style={{ padding: '8px 18px', fontSize: '12.5px' }}
                      onClick={() => setSmsModalOrder(viewingOrder)}
                    >
                      <Send size={14} />
                      <span>Send New SMS</span>
                    </button>
                  </div>

                  {/* SMS History List for this Order */}
                  {loadingViewingOrderSms ? (
                    <div style={{ fontSize: '12px', color: '#7a9f9b', padding: '8px 0' }}>
                      Loading SMS history...
                    </div>
                  ) : viewingOrderSms.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #d8ece7', paddingTop: '12px' }}>
                      {viewingOrderSms.map((sms) => (
                        <div
                          key={sms.id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '10px',
                            padding: '10px 14px',
                            border: '1px solid #e1efe9',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '4px',
                              fontSize: '11.5px',
                            }}
                          >
                            <span style={{ fontWeight: 800, color: '#04959d', textTransform: 'uppercase' }}>
                              {sms.template_type || 'update'}
                            </span>
                            <span style={{ color: '#7a9f9b' }}>{sms.created_at}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '12.5px', color: '#173d3b', lineHeight: '1.4' }}>
                            {sms.message}
                          </p>
                          <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#9bb8b4' }}>
                            Dispatched to <strong>{sms.recipient_phone}</strong> by {sms.sent_by || 'Admin Staff'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#7a9f9b', marginTop: '6px' }}>
                      No SMS sent yet. Click <strong>Send New SMS</strong> above to notify customer of tracking or status updates.
                    </div>
                  )}
                </div>
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

      {/* ── Send SMS Notification Modal ── */}
      {smsModalOrder && (
        <SendSmsModal
          order={smsModalOrder}
          onClose={() => setSmsModalOrder(null)}
          showToast={showToast}
          onSmsSent={handleSmsSent}
        />
      )}
    </div>
  )
}
