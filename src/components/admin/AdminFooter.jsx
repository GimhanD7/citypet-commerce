import React from 'react'
import logoMark from '../../assets/citypet-logo-mark.png'

export default function AdminFooter({ setActiveTab, showToast }) {
  return (
    <footer className="admin-dark-green-footer">
      <div className="admin-footer-main-grid">
        {/* Brand Info */}
        <div className="footer-brand-pane">
          <div className="footer-logo-row">
            <img src={logoMark} alt="City Pet Emblem" className="footer-emblem-img" />
            <div className="footer-brand-title">
              <strong>CITY PET</strong>
              <small>ANIMAL HOSPITAL</small>
            </div>
          </div>
          <p className="footer-mission-line">
            Caring for pets. Building healthier tomorrows.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-nav-col">
          <h4>Quick Links</h4>
          <a href="#dashboard" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard') }}>Dashboard</a>
          <a href="#orders" onClick={(e) => { e.preventDefault(); setActiveTab('orders') }}>Orders</a>
          <a href="#products" onClick={(e) => { e.preventDefault(); setActiveTab('products') }}>Products</a>
          <a href="#users" onClick={(e) => { e.preventDefault(); setActiveTab('users') }}>Users</a>
          <a href="#pets" onClick={(e) => { e.preventDefault(); setActiveTab('pets') }}>Pets</a>
        </div>

        {/* Help & Support */}
        <div className="footer-nav-col">
          <h4>Help & Support</h4>
          <a href="#guide" onClick={(e) => { e.preventDefault(); showToast('User guide opened') }}>User Guide</a>
          <a href="tel:+94112345678">Contact Support</a>
          <a href="#status" onClick={(e) => { e.preventDefault(); showToast('All systems operational: 100%') }}>System Status</a>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); showToast('Privacy policy: HIPAA & GDPR compliant') }}>Privacy Policy</a>
          <a href="#terms" onClick={(e) => { e.preventDefault(); showToast('Terms of Service: v2024.1') }}>Terms of Service</a>
        </div>

        {/* Cursive Brand Script */}
        <div className="footer-script-pane">
          <div className="footer-cursive-quote">
            <span>Happier Pets</span>
            <span>
              Healthier Lives <span className="heart-icon">♡</span>
            </span>
          </div>
        </div>
      </div>

      <div className="admin-footer-bottom-line">
        <span>© 2024 City Pet Animal Hospital. All rights reserved.</span>
        <div className="admin-footer-meta">
          <span>Admin Portal</span>
          <span className="dot">•</span>
          <span>Version 1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
