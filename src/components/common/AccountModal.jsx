import React, { useState } from 'react'
import {
  CheckCircle2,
  Heart,
  Package,
  PawPrint,
  Phone,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'

export default function AccountModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    ownerName: 'Kasun Perera',
    phone: '077 123 4567',
    email: 'kasun.perera@example.com',
    petName: 'Milo',
    petType: 'Golden Retriever',
    petAge: '2 Years',
    address: 'No. 45, Temple Road, Athurugiriya',
  })

  if (!isOpen) return null

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="account-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Customer Account">
      <div className="account-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="account-modal-header">
          <div className="account-avatar-banner">
            <div className="account-avatar-circle">
              <User size={28} />
            </div>
            <div>
              <h3>{formData.ownerName || 'Pet Parent'}</h3>
              <p>City Pet Club Member · {formData.petName ? `Parent of ${formData.petName} 🐾` : 'Sri Lanka'}</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close account modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="account-tabs">
          <button
            className={`account-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <PawPrint size={16} /> Pet & Owner Profile
          </button>
          <button
            className={`account-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={16} /> Recent Orders (1)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="account-modal-body">
          {activeTab === 'profile' ? (
            <form onSubmit={handleSave} className="account-form">
              <div className="form-section-title">
                <PawPrint size={15} /> <span>Pet Details</span>
              </div>
              <div className="form-grid-two">
                <div className="form-field">
                  <label>Pet's Name</label>
                  <input
                    type="text"
                    value={formData.petName}
                    onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                    placeholder="e.g. Milo"
                  />
                </div>
                <div className="form-field">
                  <label>Breed / Species</label>
                  <input
                    type="text"
                    value={formData.petType}
                    onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                    placeholder="e.g. Labrador / Persian Cat"
                  />
                </div>
              </div>

              <div className="form-section-title mt-4">
                <User size={15} /> <span>Owner & Delivery Info</span>
              </div>
              <div className="form-grid-two">
                <div className="form-field">
                  <label>Your Full Name</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Contact Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Primary Delivery Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House No, Street, City"
                />
              </div>

              {saved && (
                <div className="save-success-alert">
                  <CheckCircle2 size={16} /> Details saved successfully!
                </div>
              )}

              <button type="submit" className="button primary w-full mt-3">
                Save Profile
              </button>
            </form>
          ) : (
            <div className="recent-orders-list">
              <div className="order-history-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-id">Order #CP-8921</span>
                    <span className="order-date">Placed yesterday</span>
                  </div>
                  <span className="order-status-badge">🚚 Dispatched</span>
                </div>
                <div className="order-card-items">
                  <div className="order-item-mini">
                    <span>1x Royal Canin Mini Adult 2kg</span>
                    <b>LKR 7,950</b>
                  </div>
                  <div className="order-item-mini">
                    <span>1x KONG Plush Dog Toy</span>
                    <b>LKR 2,450</b>
                  </div>
                </div>
                <div className="order-card-footer">
                  <span>Total: <strong>LKR 10,400</strong></span>
                  <a
                    className="whatsapp-track-link"
                    href="https://wa.me/94718419273?text=Hi%20City%20Pet,%20I'd%20like%20to%20track%20my%20Order%20%23CP-8921"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Track via WhatsApp →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
