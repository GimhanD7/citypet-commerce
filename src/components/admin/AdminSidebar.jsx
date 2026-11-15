import React from 'react'
import { navSections } from './data/adminMockData'
import buddyDog from '../../assets/pet-buddy-dog.jpg'

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  mobileSidebarOpen,
  setMobileSidebarOpen,
}) {
  return (
    <aside className={`admin-sidebar-nav ${mobileSidebarOpen ? 'mobile-drawer-open' : ''}`}>
      <div className="sidebar-scroll-wrapper">
        {/* Hospital Console Status Tag */}
        <div className="sidebar-console-tag">
          <span className="console-status-pulse" />
          <span className="console-status-text">Hospital Console • Active</span>
        </div>

        {/* Grouped Navigation Links */}
        <div className="sidebar-sections-container">
          {navSections.map((section) => (
            <div key={section.title} className="sidebar-nav-section">
              <span className="sidebar-section-title">{section.title}</span>
              <div className="sidebar-links-list">
                {section.items.map((item) => {
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
                      <span className="nav-icon-wrap">
                        <Icon size={17} className="nav-icon" />
                      </span>
                      <span className="nav-label">{item.label}</span>
                      {item.badge && (
                        <span className={`nav-item-badge ${isActive ? 'badge-active' : ''}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
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
      </div>
    </aside>
  )
}
