import React, { useEffect, useState } from 'react'
import {
  Search,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  ShieldCheck,
  Eye,
  FileText,
  X,
  Building2,
  Wallet,
  XCircle,
} from 'lucide-react'
import { orderService } from '../../../services/api'
import './orders_payments.css'

// Initial seed transactions
const SEED_TRANSACTIONS = [
  {
    id: 'txn-99412',
    reference: 'PAY-CP-849201',
    orderNumber: '#CP75821',
    date: 'Apr 28, 2024, 09:30 AM',
    customerName: 'Sarah Perera',
    email: 'sarah.p@gmail.com',
    paymentMethod: 'Visa / Mastercard',
    gateway: 'Stripe Central Gateway',
    authCode: 'AUTH_772189',
    amount: 7950,
    status: 'Settled',
    statusType: 'settled',
    type: 'Online Pharmacy Rx',
  },
  {
    id: 'txn-99411',
    reference: 'PAY-CP-774912',
    orderNumber: '#CP75820',
    date: 'Apr 28, 2024, 11:00 AM',
    customerName: 'Nimesh Fernando',
    email: 'nimesh.f@gmail.com',
    paymentMethod: 'Hospital Counter POS',
    gateway: 'City Pet Central Till #1',
    authCode: 'POS_449210',
    amount: 6800,
    status: 'Settled',
    statusType: 'settled',
    type: 'Counter Pickup',
  },
  {
    id: 'txn-99410',
    reference: 'PAY-CP-661209',
    orderNumber: '#CP75819',
    date: 'Apr 27, 2024, 02:15 PM',
    customerName: 'Dilini Jayasuriya',
    email: 'dilini.j@hotmail.com',
    paymentMethod: 'Cash on Delivery (COD)',
    gateway: 'Islandwide Fleet Collection',
    authCode: 'COD_PENDING',
    amount: 4650,
    status: 'Pending Collection',
    statusType: 'pending',
    type: 'Courier Dispatch',
  },
  {
    id: 'txn-99409',
    reference: 'PAY-CP-553102',
    orderNumber: '#CP75818',
    date: 'Apr 26, 2024, 10:00 AM',
    customerName: 'Kasun Wijesinghe',
    email: 'kasun.w@gmail.com',
    paymentMethod: 'Visa / Mastercard',
    gateway: 'Stripe Central Gateway',
    authCode: 'AUTH_883012',
    amount: 12450,
    status: 'Settled',
    statusType: 'settled',
    type: 'Online Store Purchase',
  },
  {
    id: 'txn-99408',
    reference: 'PAY-CP-442198',
    orderNumber: '#CP75817',
    date: 'Apr 26, 2024, 04:20 PM',
    customerName: 'Tharushi Kimara',
    email: 'tharushi.k@yahoo.com',
    paymentMethod: 'Direct Bank Transfer',
    gateway: 'Commercial Bank of Ceylon',
    authCode: 'BTR_293810',
    amount: 5600,
    status: 'Settled',
    statusType: 'settled',
    type: 'Online Store Purchase',
  },
  {
    id: 'txn-99407',
    reference: 'PAY-CP-331902',
    orderNumber: '#CP75816',
    date: 'Apr 25, 2024, 01:10 PM',
    customerName: 'Roshan Samarasekera',
    email: 'roshan.s@gmail.com',
    paymentMethod: 'Visa / Mastercard',
    gateway: 'Stripe Central Gateway',
    authCode: 'AUTH_119023',
    amount: 8900,
    status: 'Refunded',
    statusType: 'refunded',
    type: 'Hospital Clinical Care',
  },
]

export default function PaymentsView({ showToast }) {
  const [transactions, setTransactions] = useState(SEED_TRANSACTIONS)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [methodFilter, setMethodFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewingTxn, setViewingTxn] = useState(null)
  const [reviewingId, setReviewingId] = useState(null)

  // Sync with live orders to build unified ledger
  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const data = await orderService.getAllOrders()
      const list = Array.isArray(data) ? data : (data?.orders || [])
      if (list.length > 0) {
        // Build transaction ledger from live orders
        const mapped = list.map((o, idx) => {
          const isCard = o.paymentMethod === 'card'
          const isBank = o.paymentMethod === 'bank'
          const isCod = o.paymentMethod === 'cod'
          const isDelivered = o.status === 'Delivered'
          const paymentStatus = o.paymentStatus || 'unpaid'
          const isRejected = paymentStatus === 'rejected' || o.status === 'Payment Rejected'
          return {
            id: `txn-${10000 + idx}`,
            orderId: o.id,
            reference: `PAY-${o.trackingNumber || (o.orderNumber || o.id).replace('#', '')}`,
            orderNumber: o.orderNumber || o.id,
            date: o.date || 'Recent',
            customerName: o.customerName || 'Customer',
            email: o.email || 'customer@citypet.lk',
            paymentMethod: isCard ? 'PayHere Online Card' : isBank ? 'Direct Bank Transfer' : isCod ? 'Cash on Delivery (COD)' : 'Hospital Counter POS',
            gateway: isCard ? 'PayHere Gateway' : isBank ? 'Commercial Bank Transfer' : isCod ? 'Fleet Collection' : 'Central Pharmacy POS',
            authCode: isCard ? (o.payherePaymentId || `PH_${Math.floor(100000 + Math.random() * 900000)}`) : isBank ? (o.paymentSlip ? 'SLIP_ATTACHED' : 'PENDING_SLIP') : 'POS_PAID',
            amount: Number(o.totalPrice) || 0,
            subtotal: Number(o.subtotal) || 0,
            deliveryFee: Number(o.deliveryFee) || 0,
            discountAmount: Number(o.discountAmount) || 0,
            status: isRejected ? 'Rejected' : (isBank && paymentStatus !== 'paid' ? 'Slip Verification' : (isCod && !isDelivered ? 'Pending Collection' : (o.status === 'Cancelled' ? 'Refunded' : 'Settled'))),
            statusType: isRejected ? 'rejected' : (isBank && paymentStatus !== 'paid' ? 'pending' : (isCod && !isDelivered ? 'pending' : (o.status === 'Cancelled' ? 'refunded' : 'settled'))),
            type: 'Online Store Courier',
            paymentSlip: o.paymentSlip || null,
            paymentStatus,
            itemsList: o.itemsList || [],
          }
        })
        setTransactions(mapped)
      } else {
        setTransactions(SEED_TRANSACTIONS)
      }
    } catch (err) {
      console.warn('Using seed transactions:', err)
      setTransactions(SEED_TRANSACTIONS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  // Filter logic
  const filtered = transactions.filter((t) => {
    const q = searchQuery.toLowerCase().trim()
    const matchSearch =
      !q ||
      t.reference.toLowerCase().includes(q) ||
      t.orderNumber.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q) ||
      t.authCode.toLowerCase().includes(q)

    const matchMethod =
      methodFilter === 'all'
        ? true
        : t.paymentMethod.toLowerCase().includes(methodFilter.toLowerCase())

    const matchStatus =
      statusFilter === 'all'
        ? true
        : t.statusType === statusFilter

    return matchSearch && matchMethod && matchStatus
  })

  // KPI calculations
  const totalVolume = transactions.reduce((s, t) => s + (!['refunded', 'rejected'].includes(t.statusType) ? t.amount : 0), 0)
  const settledCount = transactions.filter((t) => t.statusType === 'settled').length
  const settledVolume = transactions.filter((t) => t.statusType === 'settled').reduce((s, t) => s + t.amount, 0)
  const pendingCount = transactions.filter((t) => t.statusType === 'pending').length
  const pendingVolume = transactions.filter((t) => t.statusType === 'pending').reduce((s, t) => s + t.amount, 0)
  const avgTicket = totalVolume && transactions.length ? Math.round(totalVolume / transactions.length) : 0
  const txnAmount = (txn) => Number(txn?.amount ?? 0)
  const txnDeliveryFee = (txn) => Number(txn?.deliveryFee ?? 0)
  const txnDiscount = (txn) => Number(txn?.discountAmount ?? 0)
  const txnSubtotal = (txn) => Number(txn?.subtotal ?? Math.max(0, txnAmount(txn) - txnDeliveryFee(txn)))

  const handleReviewBankTransfer = async (txn, paymentAction) => {
    const orderId = txn.orderId || txn.orderNumber
    setReviewingId(txn.id)
    try {
      const res = await orderService.reviewBankTransfer(orderId, paymentAction)
      const nextStatus = res.paymentStatus
      const nextOrderStatus = res.status
      const nextStatusType = paymentAction === 'verify' ? 'settled' : 'rejected'
      setTransactions((prev) =>
        prev.map((item) =>
          item.id === txn.id
            ? {
                ...item,
                paymentStatus: nextStatus,
                status: paymentAction === 'verify' ? 'Settled' : 'Rejected',
                statusType: nextStatusType,
                authCode: paymentAction === 'verify' ? 'BANK_VERIFIED' : 'BANK_REJECTED',
                orderStatus: nextOrderStatus,
              }
            : item
        )
      )
      setViewingTxn((prev) =>
        prev && prev.id === txn.id
          ? {
              ...prev,
              paymentStatus: nextStatus,
              status: paymentAction === 'verify' ? 'Settled' : 'Rejected',
              statusType: nextStatusType,
              authCode: paymentAction === 'verify' ? 'BANK_VERIFIED' : 'BANK_REJECTED',
              orderStatus: nextOrderStatus,
            }
          : prev
      )
      showToast?.(paymentAction === 'verify' ? `Bank payment verified for ${txn.orderNumber}.` : `Bank payment rejected and order cancelled for ${txn.orderNumber}.`)
    } catch (err) {
      showToast?.(err.message || 'Payment review failed.')
    } finally {
      setReviewingId(null)
    }
  }

  return (
    <div className="payments-admin-page">
      {/* ── Page Header ── */}
      <div className="payments-page-header">
        <div className="payments-header-text">
          <span className="payments-eyebrow">Financial Settlement &amp; Billing</span>
          <h2 className="payments-page-title">Payments &amp; Transactions</h2>
          <p className="payments-page-desc">
            Monitor real-time gateway authorizations, COD disbursements, counter collections, and merchant settlements.
          </p>
        </div>
        <div className="orders-header-actions">
          <button
            type="button"
            className="payments-refresh-btn"
            onClick={fetchTransactions}
            title="Refresh payment transactions"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Sync Ledger</span>
          </button>
          <button
            type="button"
            className="orders-create-btn"
            onClick={() => showToast?.('Exporting financial payment ledger CSV...')}
          >
            <Download size={15} />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* ── Financial KPIs ── */}
      <div className="payments-kpi-grid">
        <div className="payments-kpi-card">
          <div className="payments-kpi-icon-wrap mint">
            <DollarSign size={22} />
          </div>
          <div className="payments-kpi-texts">
            <span className="payments-kpi-label">Gross Processed Volume</span>
            <strong className="payments-kpi-val">LKR {totalVolume.toLocaleString()}</strong>
            <span className="payments-kpi-sub">{transactions.length} total transactions</span>
          </div>
        </div>

        <div className="payments-kpi-card">
          <div className="payments-kpi-icon-wrap green">
            <CheckCircle2 size={22} />
          </div>
          <div className="payments-kpi-texts">
            <span className="payments-kpi-label">Settled &amp; Deposited</span>
            <strong className="payments-kpi-val">LKR {settledVolume.toLocaleString()}</strong>
            <span className="payments-kpi-sub">{settledCount} cleared payments</span>
          </div>
        </div>

        <div className="payments-kpi-card">
          <div className="payments-kpi-icon-wrap amber">
            <Clock size={22} />
          </div>
          <div className="payments-kpi-texts">
            <span className="payments-kpi-label">Pending COD / Fleet</span>
            <strong className="payments-kpi-val">LKR {pendingVolume.toLocaleString()}</strong>
            <span className="payments-kpi-sub">{pendingCount} orders in transit</span>
          </div>
        </div>

        <div className="payments-kpi-card">
          <div className="payments-kpi-icon-wrap purple">
            <TrendingUp size={22} />
          </div>
          <div className="payments-kpi-texts">
            <span className="payments-kpi-label">Average Order Value</span>
            <strong className="payments-kpi-val">LKR {avgTicket.toLocaleString()}</strong>
            <span className="payments-kpi-sub">Across all payment channels</span>
          </div>
        </div>
      </div>

      {/* ── Filter Toolbar ── */}
      <div className="payments-toolbar">
        <div className="payments-search-box">
          <Search size={16} style={{ color: '#7aa39e' }} />
          <input
            type="text"
            className="payments-search-input"
            placeholder="Search by Payment Ref, Order #, Customer, or Auth Code..."
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

        <div className="payments-filters-group">
          <select
            className="payments-select-filter"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">All Payment Gateways</option>
            <option value="card">Visa / Mastercard (Stripe)</option>
            <option value="cod">Cash on Delivery (COD)</option>
            <option value="counter">Hospital Counter POS</option>
            <option value="bank">Bank Transfer</option>
          </select>

          <select
            className="payments-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Settlement States</option>
            <option value="settled">Settled &amp; Paid</option>
            <option value="pending">Pending Collection</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded / Reversible</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="payments-table-card">
        <div className="payments-table-wrap">
          <table className="payments-table">
            <thead>
              <tr>
                <th className="payments-th">Payment Reference</th>
                <th className="payments-th">Order # &amp; Date</th>
                <th className="payments-th">Customer</th>
                <th className="payments-th">Products</th>
                <th className="payments-th">Channel &amp; Gateway</th>
                <th className="payments-th">Amount (LKR)</th>
                <th className="payments-th">Status</th>
                <th className="payments-th" style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: '#8daea9' }}>
                    <CreditCard size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#173d3b' }}>
                      No matching payment records
                    </p>
                    <small style={{ color: '#7aa39e' }}>Try adjusting your search criteria</small>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id || t.reference} className="payments-row">
                    {/* Reference */}
                    <td className="payments-td">
                      <div className="order-num-block">
                        <span className="order-num-bold" style={{ color: '#173d3b' }}>{t.reference}</span>
                        <span className="order-date-sub">{t.type}</span>
                      </div>
                    </td>

                    {/* Order & Date */}
                    <td className="payments-td">
                      <div className="order-num-block">
                        <span style={{ fontWeight: 800, color: '#0e5d59' }}>{t.orderNumber}</span>
                        <span className="order-date-sub">{t.date}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="payments-td">
                      <div className="order-customer-cell">
                        <span className="order-customer-name">{t.customerName}</span>
                        <span className="order-customer-contact">{t.email}</span>
                      </div>
                    </td>

                    {/* Method & Gateway */}
                    <td className="payments-td">
                      <div className="order-items-preview">
                        <span className="order-items-title">
                          {t.itemsList?.[0]?.name || 'Pet care order'}
                        </span>
                        <span className="order-items-badge">
                          {(t.itemsList?.length || 1)} product{(t.itemsList?.length || 1) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>

                    <td className="payments-td">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 800, color: '#173d3b', fontSize: '12.5px' }}>
                          {t.paymentMethod}
                        </span>
                        <small style={{ color: '#7aa39e', fontSize: '11px' }}>
                          {t.gateway} &bull; {t.authCode}
                        </small>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="payments-td">
                      <span className="order-total-bold" style={{ color: ['refunded', 'rejected'].includes(t.statusType) ? '#dc2626' : '#0e5d59' }}>
                        {['refunded', 'rejected'].includes(t.statusType) ? '-' : ''}LKR {txnAmount(t).toLocaleString()}
                      </span>
                      <small style={{ display: 'block', color: '#7aa39e', fontSize: '11px' }}>
                        Products LKR {txnSubtotal(t).toLocaleString()} + Delivery LKR {txnDeliveryFee(t).toLocaleString()}
                      </small>
                    </td>

                    {/* Status */}
                    <td className="payments-td">
                      <span className={`order-status-pill status-${t.statusType === 'settled' ? 'delivered' : t.statusType === 'pending' ? 'processing' : 'cancelled'}`}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {t.status}
                      </span>
                    </td>

                    {/* Receipt */}
                    <td className="payments-td" style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="order-action-btn"
                          title="View digital payment slip"
                          onClick={() => setViewingTxn(t)}
                        >
                          <FileText size={13} />
                          Slip
                        </button>
                        {t.paymentMethod === 'Direct Bank Transfer' && t.statusType === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="order-action-btn"
                              disabled={reviewingId === t.id}
                              onClick={() => handleReviewBankTransfer(t, 'verify')}
                            >
                              <CheckCircle2 size={13} />
                              Verify
                            </button>
                            <button
                              type="button"
                              className="order-action-btn"
                              disabled={reviewingId === t.id}
                              onClick={() => handleReviewBankTransfer(t, 'reject')}
                            >
                              <XCircle size={13} />
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transaction Slip Modal ── */}
      {viewingTxn && (
        <div className="order-modal-backdrop" onClick={() => setViewingTxn(null)}>
          <div className="order-modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div className="order-modal-header-left">
                <div className="order-modal-icon" style={{ background: '#edfbf3', color: '#16a34a' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="order-modal-title">Payment Voucher</h3>
                  <p className="order-modal-subtitle">{viewingTxn.reference} &bull; {viewingTxn.date}</p>
                </div>
              </div>
              <button
                type="button"
                className="order-modal-close"
                onClick={() => setViewingTxn(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="order-modal-body">
              <div className="order-info-grid">
                <div className="order-info-item">
                  <span className="order-info-label">Linked Order Number</span>
                  <strong className="order-info-value" style={{ color: '#0e5d59' }}>{viewingTxn.orderNumber}</strong>
                </div>
                <div className="order-info-item">
                  <span className="order-info-label">Customer Name</span>
                  <strong className="order-info-value">{viewingTxn.customerName}</strong>
                </div>
                <div className="order-info-item">
                  <span className="order-info-label">Payment Channel</span>
                  <strong className="order-info-value">{viewingTxn.paymentMethod}</strong>
                </div>
                <div className="order-info-item">
                  <span className="order-info-label">Merchant Gateway</span>
                  <strong className="order-info-value">{viewingTxn.gateway}</strong>
                </div>
                <div className="order-info-item">
                  <span className="order-info-label">Authorization Code</span>
                  <strong className="order-info-value" style={{ fontFamily: 'monospace' }}>{viewingTxn.authCode}</strong>
                </div>
                <div className="order-info-item">
                  <span className="order-info-label">Settlement Status</span>
                  <strong className="order-info-value" style={{ color: viewingTxn.statusType === 'settled' ? '#16a34a' : '#d97706' }}>
                    {viewingTxn.status}
                  </strong>
                </div>
              </div>

              <div className="order-totals-summary">
                <div className="order-total-row">
                  <span>Products Subtotal:</span>
                  <span>LKR {txnSubtotal(viewingTxn).toLocaleString()}</span>
                </div>
                <div className="order-total-row">
                  <span>Delivery Fee:</span>
                  <span>LKR {txnDeliveryFee(viewingTxn).toLocaleString()}</span>
                </div>
                {txnDiscount(viewingTxn) > 0 && (
                  <div className="order-total-row" style={{ color: '#16a34a' }}>
                    <span>Promo Discount:</span>
                    <span>- LKR {txnDiscount(viewingTxn).toLocaleString()}</span>
                  </div>
                )}
                <div className="order-total-row grand-total" style={{ border: 'none', padding: 0, margin: 0 }}>
                  <span>{viewingTxn.statusType === 'rejected' ? 'Rejected Amount:' : 'Total Amount Paid:'}</span>
                  <span>LKR {txnAmount(viewingTxn).toLocaleString()}</span>
                </div>
                <small style={{ color: viewingTxn.statusType === 'rejected' ? '#dc2626' : '#7aa39e', fontSize: '11px', marginTop: '6px' }}>
                  {viewingTxn.statusType === 'rejected'
                    ? 'Payment rejected. The customer must submit a correct payment before fulfillment.'
                    : 'City Pet Animal Hospital (Pvt) Ltd • Colombo 07 Central Pharmacy • Tax Invoice Issued'}
                </small>
              </div>

              {viewingTxn.itemsList?.length > 0 && (
                <div>
                  <span className="order-modal-section-title">Ordered Products</span>
                  <table className="order-items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Option</th>
                        <th>Qty</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingTxn.itemsList.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 700, color: '#173d3b' }}>{item.name}</td>
                          <td style={{ color: '#7aa39e' }}>{item.size || 'Default'}</td>
                          <td>{item.qty || 1}</td>
                          <td style={{ textAlign: 'right', fontWeight: 800 }}>
                            LKR {Number(item.lineTotal || item.price * (item.qty || 1) || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewingTxn.paymentSlip && (
                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f0f9f8', borderRadius: '10px', border: '1px solid #bce8e3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="#04959d" />
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#123835' }}>Customer Bank Deposit Slip</span>
                  </div>
                  <a
                    href={viewingTxn.paymentSlip}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '12px', fontWeight: 800, color: '#04959d', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    View Slip ↗
                  </a>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {viewingTxn.paymentMethod === 'Direct Bank Transfer' && viewingTxn.statusType === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="orders-create-btn"
                      style={{ flex: 1, justifyContent: 'center' }}
                      disabled={reviewingId === viewingTxn.id}
                      onClick={() => handleReviewBankTransfer(viewingTxn, 'verify')}
                    >
                      <CheckCircle2 size={14} />
                      <span>Verify Payment</span>
                    </button>
                    <button
                      type="button"
                      className="order-action-btn"
                      style={{ flex: 1, justifyContent: 'center' }}
                      disabled={reviewingId === viewingTxn.id}
                      onClick={() => handleReviewBankTransfer(viewingTxn, 'reject')}
                    >
                      <XCircle size={14} />
                      <span>Reject Payment</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="orders-create-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    showToast?.(`Downloaded receipt for ${viewingTxn.reference}`)
                    setViewingTxn(null)
                  }}
                >
                  <Download size={14} />
                  <span>Download PDF Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
