import { mediaUrl } from '../../config/media'
import React from 'react'
import {
  AlertCircle,
  Bell,
  Calendar,
  ChevronDown,
  Home,
  LogOut,
  Mail,
  Menu,
  PawPrint,
  Search,
  Settings,
  ShoppingBag,
  X,
} from 'lucide-react'

import logoMark from '../../assets/citypet-logo-mark.png'
import doctorAvatar from '../../assets/doctor-sugandhika.jpg'

export default function AdminHeader({
  mobileSidebarOpen,
  setMobileSidebarOpen,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  isDatePickerOpen,
  setIsDatePickerOpen,
  isNotificationsOpen,
  setIsNotificationsOpen,
  isProfileMenuOpen,
  setIsProfileMenuOpen,
  showToast,
  setActiveTab,
  onNavigate,
  onLogout,
  authUser,
}) {
  const displayName = authUser?.name || 'Dr. Sugandhika Gothami'
  const displayEmail = authUser?.email || 'director@citypet.lk'
  const initials = (
    displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part?.[0] || '')
      .join('') || 'CP'
  ).toUpperCase()
  const roleFormatMap = {
    admin: 'Administrator',
    super_admin: 'Super Administrator',
    veterinary_surgeon: 'Veterinary Surgeon',
    doctor: 'Veterinary Doctor',
    pharmacist: 'Hospital Pharmacist',
    receptionist_cashier: 'Receptionist & Cashier',
    store_manager: 'Store Manager',
    audit_compliance: 'Audit & Compliance Officer',
    nurse_technician: 'Veterinary Nurse',
    staff: 'Hospital Staff',
    user: 'Pet Parent (Customer)',
  }
  const displayRole = roleFormatMap[authUser?.role] || authUser?.role || 'Administrator'
  return (
    <header className="admin-top-appbar">
      {/* Left: Mobile Toggle & Hospital Brand */}
      <div className="admin-brand-left-group">
        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="admin-appbar-brand" onClick={() => setActiveTab('dashboard')}>
          <img src={logoMark} alt="City Pet Logo" className="appbar-logo-img" />
          <div className="appbar-brand-texts">
            <strong>CITY PET</strong>
            <small>ANIMAL HOSPITAL</small>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="admin-global-search-wrap">
        <Search size={16} className="search-lens-icon" />
        <input
          type="text"
          className="admin-search-field"
          placeholder="Search orders, users, products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchQuery('')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Right: Date Picker, Notifications, Doctor Profile */}
      <div className="admin-appbar-actions">
        {/* Date Range Selector */}
        <div className="admin-date-picker-dropdown">
          <button
            type="button"
            className="date-picker-trigger-btn"
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
          >
            <Calendar size={15} className="date-icon" />
            <span>{dateRange}</span>
            <ChevronDown size={14} className="date-chevron" />
          </button>

          {isDatePickerOpen && (
            <div className="date-picker-popup">
              <button
                type="button"
                className="date-option-item"
                onClick={() => {
                  setDateRange('Today, Apr 30, 2024')
                  setIsDatePickerOpen(false)
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="date-option-item"
                onClick={() => {
                  setDateRange('Last 7 Days (Apr 24 - 30)')
                  setIsDatePickerOpen(false)
                }}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                className="date-option-item active"
                onClick={() => {
                  setDateRange('Apr 1, 2024 - Apr 30, 2024')
                  setIsDatePickerOpen(false)
                }}
              >
                This Month (April 2024)
              </button>
              <button
                type="button"
                className="date-option-item"
                onClick={() => {
                  setDateRange('Mar 1, 2024 - Mar 31, 2024')
                  setIsDatePickerOpen(false)
                }}
              >
                Last Month (March 2024)
              </button>
            </div>
          )}
        </div>

        {/* Mail Messages */}
        <button
          type="button"
          className="appbar-icon-btn"
          title="Messages"
          onClick={() => showToast('All customer inquiries up to date (0 unread)')}
        >
          <Mail size={18} />
        </button>

        {/* Notification Bell with Badge 3 */}
        <div className="notification-bell-container">
          <button
            type="button"
            className="appbar-icon-btn notification-btn"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            title="Notifications"
          >
            <Bell size={18} />
          </button>

          {isNotificationsOpen && (
            <div className="notifications-popup">
              <div className="notif-popup-header">
                <strong>Notifications</strong>
                <span className="unread-count">0 new</span>
              </div>
              <div className="notif-popup-list">
                <div className="notif-item" style={{ justifyContent: 'center', padding: '20px', color: '#7aa39e' }}>
                  <small>No new notifications</small>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="admin-profile-pill-wrap">
          <button
            type="button"
            className="admin-profile-pill"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            {mediaUrl(authUser?.avatar) ? (
              <img src={mediaUrl(authUser.avatar)} alt={displayName} className="admin-avatar-img" />
            ) : authUser?.email === 'director@citypet.lk' ? (
              <img src={doctorAvatar} alt={displayName} className="admin-avatar-img" />
            ) : (
              <div
                className="admin-avatar-initials"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0e5d59 0%, #04959d 100%)',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: '0 2px 6px rgba(4, 149, 157, 0.25)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}
            <div className="admin-user-texts">
              <strong className="user-name">{displayName}</strong>
              <span className="user-role">{displayRole}</span>
            </div>
            <ChevronDown size={14} className="profile-chevron" />
          </button>

          {isProfileMenuOpen && (
            <div className="profile-dropdown-menu">
              <div className="profile-info-header">
                <strong>{displayName}</strong>
                <span>{displayEmail}</span>
              </div>
              <div className="profile-menu-links">
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    onNavigate('home')
                  }}
                >
                  <Home size={15} />
                  <span>View Public Website</span>
                </button>
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    onNavigate('store')
                  }}
                >
                  <ShoppingBag size={15} />
                  <span>Online Pet Store</span>
                </button>
                <button
                  type="button"
                  className="menu-item-btn"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    setActiveTab('settings')
                  }}
                >
                  <Settings size={15} />
                  <span>Portal Settings</span>
                </button>
                <div className="menu-divider" />
                <button
                  type="button"
                  className="menu-item-btn logout"
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    onLogout ? onLogout() : onNavigate('home')
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
