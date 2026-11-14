import React, { useState } from 'react'
import {
  CheckCircle2,
  Package,
  PawPrint,
  User,
  X,
} from 'lucide-react'

export default function AccountModal({ isOpen, onClose, authUser = null }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    ownerName: authUser?.name || '',
    phone: authUser?.phone || '',
    email: authUser?.email || '',
    petName: '',
    petType: '',
    petAge: '',
    address: authUser?.addressLine1 || '',
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
              <h3>{formData.ownerName || authUser?.name || 'Pet Parent'}</h3>
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
            <Package size={16} /> Recent Orders
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
                    placeholder="Enter pet name"
                  />
                </div>
                <div className="form-field">
                  <label>Breed / Species</label>
                  <input
                    type="text"
                    value={formData.petType}
                    onChange={(e) => setFormData({ ...formData, petType: e.target.value })}
                    placeholder="Enter breed or species"
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
              <p style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b' }}>
                No orders found yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
