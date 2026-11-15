import React, { useState, useEffect } from 'react'
import {
  X,
  Send,
  MessageSquare,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  User,
  Package,
  History,
} from 'lucide-react'
import { smsService } from '../../../services/api'

export default function SendSmsModal({
  order,
  onClose,
  showToast,
  onSmsSent,
}) {
  const [phone, setPhone] = useState(order?.phone || '')
  const [recipientName, setRecipientName] = useState(order?.customerName || 'Customer')
  const [templateType, setTemplateType] = useState('shipped')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [historyLogs, setHistoryLogs] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('compose') // 'compose' | 'history'

  const orderNum = order?.orderNumber || order?.id || 'CP-ORD'
  const trackingNum = order?.trackingNumber || 'CP-TRK'
  const customerFirst = (recipientName || 'Valued Customer').split(' ')[0]

  // Pre-configured City Pet templates
  const templates = [
    {
      id: 'shipped',
      label: '🚚 Shipped / In Transit',
      text: `Hello ${customerFirst}, your City Pet order #${orderNum} has been dispatched with Express Courier! Live tracking: https://citypet.kasunwalakumbura.com/#track/${trackingNum}`,
    },
    {
      id: 'ready_pickup',
      label: '🏥 Ready for Pickup',
      text: `Hello ${customerFirst}, your pet care order #${orderNum} is ready for collection at City Pet Animal Hospital Pharmacy, Colombo 07. Open 24/7.`,
    },
    {
      id: 'delivered',
      label: '✅ Order Delivered',
      text: `Dear ${customerFirst}, your City Pet order #${orderNum} has been delivered. Wishing your pet health & happiness! - City Pet Hospital (011 258 7890)`,
    },
    {
      id: 'processing',
      label: '⏳ Processing / Review',
      text: `Dear ${customerFirst}, your City Pet order #${orderNum} is now being prepared by our veterinary pharmacy team. Tracking: ${trackingNum}.`,
    },
    {
      id: 'payment_verified',
      label: '💳 Payment Verified',
      text: `Dear ${customerFirst}, your bank payment for City Pet order #${orderNum} has been verified. We are now packing your items.`,
    },
    {
      id: 'custom',
      label: '✏️ Custom Message',
      text: `Dear ${customerFirst}, update regarding your City Pet order #${orderNum}: `,
    },
  ]

  // Set initial template
  useEffect(() => {
    const defaultTpl = templates.find((t) => t.id === templateType) || templates[0]
    setMessage(defaultTpl.text)
  }, [templateType])

  // Fetch past SMS history for this order
  const fetchOrderHistory = async () => {
    if (!order?.id && !order?.orderNumber) return
    setLoadingHistory(true)
    try {
      const logs = await smsService.getOrderSmsLogs(order.id || order.orderNumber)
      setHistoryLogs(Array.isArray(logs) ? logs : [])
    } catch (err) {
      console.warn('Failed to fetch SMS history:', err)
      setHistoryLogs([])
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchOrderHistory()
  }, [order])

  const handleSelectTemplate = (tplId) => {
    setTemplateType(tplId)
    const tpl = templates.find((t) => t.id === tplId)
    if (tpl) {
      setMessage(tpl.text)
    }
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!phone.trim()) {
      showToast?.('Please provide a valid recipient phone number.')
      return
    }
    if (!message.trim()) {
      showToast?.('Please enter an SMS message body.')
      return
    }

    setSending(true)
    try {
      const res = await smsService.sendSms({
        orderId: order?.id,
        orderNumber: orderNum,
        phone,
        customerName: recipientName,
        message,
        templateType,
      })

      showToast?.(res?.message || `SMS dispatched to ${phone}!`)
      fetchOrderHistory()
      onSmsSent?.(order?.id || orderNum)
      setActiveTab('history')
    } catch (err) {
      console.warn('SMS send error:', err)
      showToast?.(err?.message || 'Failed to dispatch SMS.')
    } finally {
      setSending(false)
    }
  }

  const charCount = message.length
  const smsSegments = Math.ceil(charCount / 160) || 1

  return (
    <div className="order-modal-backdrop" onClick={onClose}>
      <div
        className="order-modal-card"
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="order-modal-header">
          <div className="order-modal-header-left">
            <div className="order-modal-icon" style={{ background: '#eef9f8', color: '#04959d' }}>
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="order-modal-title">Send SMS Notification</h3>
              <p className="order-modal-subtitle">
                Order #{orderNum} &bull; {recipientName} ({phone || 'No phone'})
              </p>
            </div>
          </div>
          <button type="button" className="order-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid #ebf4f1', padding: '0 24px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'compose' ? '2.5px solid #04959d' : '2.5px solid transparent',
              color: activeTab === 'compose' ? '#04959d' : '#6b8e8b',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Send size={15} /> Compose SMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'history' ? '2.5px solid #04959d' : '2.5px solid transparent',
              color: activeTab === 'history' ? '#04959d' : '#6b8e8b',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <History size={15} /> Sent History ({historyLogs.length})
          </button>
        </div>

        <div className="order-modal-body" style={{ padding: '20px 24px' }}>
          {activeTab === 'compose' ? (
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Recipient Details Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#325854', marginBottom: '6px' }}>
                    Customer Phone Number
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Phone size={15} style={{ position: 'absolute', left: '12px', color: '#7a9f9b' }} />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        border: '1px solid #d4e8e3',
                        borderRadius: '10px',
                        fontSize: '13.5px',
                        color: '#123835',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#325854', marginBottom: '6px' }}>
                    Customer Name
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <User size={15} style={{ position: 'absolute', left: '12px', color: '#7a9f9b' }} />
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Customer name"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        border: '1px solid #d4e8e3',
                        borderRadius: '10px',
                        fontSize: '13.5px',
                        color: '#123835',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Template Picker Pills */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#325854', marginBottom: '8px' }}>
                  Choose SMS Template
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {templates.map((tpl) => {
                    const active = templateType === tpl.id
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleSelectTemplate(tpl.id)}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '20px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: active ? '1.5px solid #04959d' : '1px solid #d4e8e3',
                          background: active ? '#eef9f8' : '#ffffff',
                          color: active ? '#04959d' : '#2b524e',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {tpl.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#325854' }}>
                    Message Content (Sri Lankan Gateway)
                  </label>
                  <span style={{ fontSize: '11.5px', color: charCount > 160 ? '#d97706' : '#7a9f9b', fontWeight: 600 }}>
                    {charCount} chars &bull; {smsSegments} SMS {smsSegments > 1 ? 'segments' : 'part'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type customer SMS update here..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1.5px solid #d4e8e3',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    lineHeight: '1.5',
                    color: '#123835',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Mobile Phone Mockup Preview */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f6faf9, #eef7f5)',
                  border: '1px solid #d8ece7',
                  borderRadius: '14px',
                  padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: '#04959d', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                      CITYPET-LK
                    </span>
                    <span style={{ fontSize: '11px', color: '#557e79', fontWeight: 600 }}>
                      Live Preview &bull; Today
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#00a86b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Direct Carrier Route
                  </span>
                </div>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e1efe9',
                    borderRadius: '10px 10px 10px 2px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: '#173d3b',
                    lineHeight: '1.45',
                    boxShadow: '0 2px 6px rgba(18, 56, 53, 0.04)',
                  }}
                >
                  {message || 'Your SMS message will display here...'}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="order-action-btn"
                  onClick={onClose}
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !phone.trim() || !message.trim()}
                  className="orders-create-btn"
                  style={{ padding: '10px 22px' }}
                >
                  <Send size={15} className={sending ? 'animate-spin' : ''} />
                  <span>{sending ? 'Sending SMS...' : 'Send SMS Notification'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#325854' }}>
                  Dispatched SMS for Order #{orderNum}
                </span>
                <button
                  type="button"
                  onClick={fetchOrderHistory}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#04959d',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Refresh Log
                </button>
              </div>

              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#7a9f9b' }}>
                  Loading SMS history...
                </div>
              ) : historyLogs.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 20px',
                    background: '#f8faf9',
                    borderRadius: '12px',
                    border: '1px dashed #d4e8e3',
                    color: '#6b8e8b',
                  }}
                >
                  <MessageSquare size={32} style={{ margin: '0 auto 10px', color: '#a0c4be' }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#173d3b' }}>
                    No SMS sent yet for this order
                  </p>
                  <p style={{ margin: '4px 0 14px', fontSize: '12.5px' }}>
                    Send order progress, courier tracking, or pickup notices via SMS.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('compose')}
                    className="orders-create-btn"
                    style={{ margin: '0 auto', padding: '8px 18px' }}
                  >
                    <Send size={14} /> <span>Compose First SMS</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {historyLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e1efe9',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        boxShadow: '0 2px 6px rgba(18, 56, 53, 0.03)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '8px',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              background: '#eef9f8',
                              color: '#04959d',
                              fontWeight: 800,
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {log.template_type || 'update'}
                          </span>
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#173d3b' }}>
                            To: {log.recipient_phone} ({log.recipient_name})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#7a9f9b' }}>
                          <Clock size={12} />
                          <span>{log.created_at}</span>
                          <span
                            style={{
                              background: '#e9f8f3',
                              color: '#00a86b',
                              padding: '1px 7px',
                              borderRadius: '10px',
                              fontWeight: 800,
                              fontSize: '10.5px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <CheckCircle2 size={11} /> Sent
                          </span>
                        </div>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          color: '#2b524e',
                          lineHeight: '1.45',
                          background: '#f8fbfb',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #edf4f2',
                        }}
                      >
                        {log.message}
                      </p>
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#9bb8b4' }}>
                        Dispatched by: <strong>{log.sent_by || 'Admin'}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
