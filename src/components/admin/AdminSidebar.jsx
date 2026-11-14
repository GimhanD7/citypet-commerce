import React from 'react'
import { navItems } from './data/adminMockData'
import buddyDog from '../../assets/pet-buddy-dog.jpg'

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  return (
    <aside className={`admin-sidebar-nav ${mobileSidebarOpen ? 'mobile-drawer-open' : ''}`}>
      <div className="sidebar-links-list">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id)
                setMobileSidebarOpen(false)
              }}
            >
              <Icon size={18} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </button>
          )
        })}
      </div>

      {/* Bottom Sticky Script Promo Card with Golden Retriever */}
      <div className="sidebar-promo-badge-card">
        <div className="promo-badge-script-text">
          <span>Happier</span>
          <span>Pets</span>
          <span>Healthier</span>
          <span>
            Lives <span className="script-heart">♡</span>
          </span>
        </div>
        <div className="promo-dog-cutout-wrap">
          <img
            src={buddyDog}
            alt="Golden Retriever pet"
            className="promo-dog-cutout-img"
          />
        </div>
      </div>
    </aside>
  )
}
