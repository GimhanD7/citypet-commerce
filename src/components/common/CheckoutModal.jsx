import React, { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Truck,
  User,
  X,
} from 'lucide-react'

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems = [],
  onClearCart,
}) {
  const [step, setStep] = useState('form') // 'form' | 'success'
  const [orderNumber, setOrderNumber] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    address: '',
    paymentMethod: 'card', // 'card' | 'bank'
    notes: '',
  })

  if (!isOpen) return null

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const isFreeShipping = subtotal >= 10000
  const shippingFee = subtotal > 0 && !isFreeShipping ? 450 : 0
  const total = subtotal + shippingFee

  const generateWhatsAppLink = (orderNum) => {
    let text = `🐾 *NEW ORDER - CITY PET ONLINE STORE*\n`
    text += `*Order ID:* ${orderNum}\n`
    text += `*Customer:* ${formData.name}\n`
    text += `*Phone:* ${formData.phone}\n`
    text += `*Delivery Address:* ${formData.address}, ${formData.city}\n`
    text += `*Payment:* ${formData.paymentMethod === 'card' ? 'Online Card Payment (PayHere)' : 'Bank Transfer'}\n`
    if (formData.notes) text += `*Notes:* ${formData.notes}\n`
    text += `\n*Ordered Items:*\n`
    cartItems.forEach((item, idx) => {
      text += `${idx + 1}. ${item.product.name} (x${item.quantity}) - LKR ${(item.product.price * item.quantity).toLocaleString()}\n`
    })
    text += `\n*Subtotal:* LKR ${subtotal.toLocaleString()}\n`
    text += `*Delivery:* ${isFreeShipping ? 'FREE' : `LKR ${shippingFee}`}\n`
    text += `*Grand Total:* LKR ${total.toLocaleString()}\n\n`
    text += `Please confirm my order and dispatch timeline. Thank you!`

    return `https://wa.me/94718419273?text=${encodeURIComponent(text)}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newOrderNum = `CP-${Math.floor(1000 + Math.random() * 9000)}`
    setOrderNumber(newOrderNum)
    setStep('success')
    onClearCart()
  }

  return (
    <div className="checkout-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Complete Order">
      <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-modal-header">
          <h3>
            {step === 'form' ? 'Complete Your Order' : 'Order Placed Successfully!'}
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close checkout modal">
            <X size={20} />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="checkout-form">
            {/* Quick Order Summary Mini Bar */}
            <div className="checkout-mini-summary">
              <div>
                <span>Items in Order: <strong>{cartItems.reduce((a, b) => a + b.quantity, 0)}</strong></span>
                <span className="checkout-mini-total">Total: <strong>LKR {total.toLocaleString()}</strong></span>
              </div>
              <small className="checkout-shipping-pill">
                {isFreeShipping ? '🎉 Free Delivery' : `Standard Delivery: LKR ${shippingFee}`}
              </small>
            </div>

            <div className="form-section-title">
              <User size={15} /> <span>Delivery Details</span>
            </div>

            <div className="form-grid-two">
              <div className="form-field">
                <label>Your Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Priyantha Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>WhatsApp / Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 071 841 9273"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-two">
              <div className="form-field">
                <label>City / Area *</label>
                <input
                  type="text"
                  placeholder="e.g. Athurugiriya, Malabe, Colombo..."
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Street Address *</label>
                <input
                  type="text"
                  placeholder="No, Street Name"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>Special Instructions / Pet Notes (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Delivery after 3 PM or call upon arrival"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="form-section-title mt-3.5">
              <Truck size={15} /> <span>Payment Method</span>
            </div>

            <div className="payment-options-grid">
              <label className={`payment-option-card ${formData.paymentMethod === 'card' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={formData.paymentMethod === 'card'}
                  onChange={() => setFormData({ ...formData, paymentMethod: 'card' })}
                />
                <div className="payment-option-info">
                  <strong>Online Card (PayHere)</strong>
                  <span>Visa, Mastercard, AMEX &amp; Wallets</span>
                </div>
              </label>

              <label className={`payment-option-card ${formData.paymentMethod === 'bank' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="bank"
                  checked={formData.paymentMethod === 'bank'}
                  onChange={() => setFormData({ ...formData, paymentMethod: 'bank' })}
                />
                <div className="payment-option-info">
                  <strong>Direct Bank Transfer</strong>
                  <span>Transfer to City Pet Commercial Bank account</span>
                </div>
              </label>
            </div>

            <button type="submit" className="button primary checkout-submit-btn">
              <span>Send Order to WhatsApp (+94 71 841 9273)</span>
              <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <div className="checkout-success-view">
            <div className="success-icon-circle">
              <CheckCircle2 size={54} color="#07949a" />
            </div>
            <h4>Thank you, {formData.name || 'valued pet parent'}!</h4>
            <p className="success-order-id">
              Your Order Reference: <strong>#{orderNumber}</strong>
            </p>
            <p className="success-desc">
              Your order for <strong>LKR {total.toLocaleString()}</strong> has been recorded. Click below to immediately send the order details to the hospital on WhatsApp for rapid confirmation.
            </p>

            <a
              className="button primary whatsapp-confirm-btn"
              href={generateWhatsAppLink(orderNumber)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageSquare size={19} /> Open WhatsApp Order Summary
            </a>

            <button className="button secondary mt-2.5" onClick={onClose}>
              Back to Pet Store
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
