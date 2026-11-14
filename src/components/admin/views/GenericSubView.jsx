import React from 'react'
import { Layers, Plus } from 'lucide-react'
import { navItems } from '../data/adminMockData'

export default function GenericSubView({ activeTab, setActiveTab, showToast }) {
  const currentNav = navItems.find((n) => n.id === activeTab)

  return (
    <div className="admin-subview-panel">
      <div className="subview-header-row">
        <div>
          <span className="welcome-eyebrow">CITY PET MANAGEMENT</span>
          <h2 className="subview-title">
            {currentNav?.label || 'Section'}
          </h2>
          <p className="welcome-sub-desc">
            Manage and overview all {activeTab} records across City Pet Animal Hospital.
          </p>
        </div>
        <button
          type="button"
          className="quick-action-btn primary-teal"
          onClick={() => showToast(`Adding new record in ${activeTab}...`)}
        >
          <Plus size={16} />
          <span>Add New</span>
        </button>
      </div>

      <div className="admin-card-surface subview-content-box">
        <div className="empty-subview-card">
          <div className="empty-icon-circle">
            {React.createElement(currentNav?.icon || Layers, { size: 32 })}
          </div>
          <h3>{currentNav?.label} Hub Active</h3>
          <p>
            Live synchronization enabled with City Pet central database. Showing records for April 2024.
          </p>
          <button
            type="button"
            className="surface-link-btn primary"
            onClick={() => setActiveTab('dashboard')}
          >
            <span>← Return to Main Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  )
}
