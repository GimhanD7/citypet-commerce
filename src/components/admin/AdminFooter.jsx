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
          <h4 className="footer-col-head">Quick Links</h4>
          <div className="footer-nav-link-list">
            <button
              type="button"
              className="footer-nav-link-btn"
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              type="button"
              className="footer-nav-link-btn"
              onClick={() => setActiveTab('orders')}
            >
              Orders &amp; Dispensing
            </button>
            <button
              type="button"
              className="footer-nav-link-btn"
              onClick={() => setActiveTab('products')}
            >
              Medical Products
            </button>
            <button
              type="button"
              className="footer-nav-link-btn"
              onClick={() => setActiveTab('users')}
            >
              Users &amp; Roles
            </button>
          </div>
        </div>

        {/* Help & Support */}
        <div className="footer-nav-col">
          <h4 className="footer-col-head">Help &amp; Support</h4>
          <div className="footer-nav-link-list">
            <button
              type="button"
              className="footer-nav-link-btn"
              onClick={() => showToast('User guide opened')}
            >
              User Guide
            </button>
            <a href="tel:+94112345678" className="footer-nav-link-btn">
              Contact Support
            </a>
            <button
              type="button"
              className="footer-nav-link-btn"
              onClick={() => showToast('All systems operational: 100%')}
            >
              System Status
            </button>
            <button
              type="button"
              className="footer-nav-link-btn"
              onClick={() => showToast('HIPAA & GDPR compliant privacy standards')}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              className="footer-nav-link-btn"
              onClick={() => showToast('Terms of Service: v2024.1')}
            >
              Terms of Service
            </button>
          </div>
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
