import React, { useEffect, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Clock,
  Database,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react'
import { activityService } from '../../../services/api'

export default function ActivityLogsView({ showToast }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const data = await activityService.getActivityLogs({
        search: searchQuery,
        action: actionFilter,
      })
      setLogs(data || [])
    } catch (err) {
      console.warn('Failed to load activity logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [actionFilter, searchQuery])

  // Metric counts
  const adminActionsCount = logs.filter((l) => l.role === 'admin').length
  const customerActionsCount = logs.filter((l) => l.role === 'user').length
  const inventoryEventsCount = logs.filter((l) => l.action === 'STOCK_UPDATE' || l.entity_type === 'inventory').length

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'PRODUCT_ADD':
      case 'PRODUCT_SAVE':
        return 'success'
      case 'STOCK_UPDATE':
        return 'info'
      case 'PRODUCT_DELETE':
        return 'danger-pill'
      case 'ORDER_CREATE':
        return 'purple'
      case 'REPORT_GENERATE':
        return 'warning-amber'
      default:
        return 'info'
    }
  }

  return (
    <div className="admin-subview-panel admin-activity-logs-page">
      {/* Subview Header */}
      <div className="subview-header-row">
        <div>
          <span className="welcome-eyebrow">SYSTEM SECURITY & AUDIT TRAIL</span>
          <h2 className="subview-title">User & Admin Activity Logs</h2>
          <p className="welcome-sub-desc">
            Real-time audit logging connected to MySQL database. Tracks product edits, stock changes, orders, and system activity.
          </p>
        </div>
        <button
          type="button"
          className="quick-action-btn secondary-mint"
          onClick={() => {
            fetchLogs()
            showToast('Activity logs synchronized with database!')
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="admin-kpi-cards-grid">
        <div className="admin-kpi-card mint-card">
          <div className="kpi-card-top">
            <span className="kpi-metric-label">TOTAL AUDIT LOGS</span>
            <div className="kpi-icon-bubble mint-bubble"><Database size={17} /></div>
          </div>
          <strong className="kpi-big-value">{logs.length} Log Entries</strong>
          <small className="kpi-sub-text">Recorded activity history</small>
        </div>

        <div className="admin-kpi-card cyan-card">
          <div className="kpi-card-top">
            <span className="kpi-metric-label">ADMINISTRATOR ACTIONS</span>
            <div className="kpi-icon-bubble cyan-bubble"><ShieldCheck size={17} /></div>
          </div>
          <strong className="kpi-big-value">{adminActionsCount} Admin Events</strong>
          <small className="kpi-sub-text">Staff & doctor portal activity</small>
        </div>

        <div className="admin-kpi-card blue-card">
          <div className="kpi-card-top">
            <span className="kpi-metric-label">CUSTOMER ACTIONS</span>
            <div className="kpi-icon-bubble blue-bubble"><Users size={17} /></div>
          </div>
          <strong className="kpi-big-value">{customerActionsCount} User Events</strong>
          <small className="kpi-sub-text">Store orders & account activity</small>
        </div>

        <div className="admin-kpi-card salmon-card">
          <div className="kpi-card-top">
            <span className="kpi-metric-label">INVENTORY UPDATES</span>
            <div className="kpi-icon-bubble salmon-bubble"><Activity size={17} /></div>
          </div>
          <strong className="kpi-big-value">{inventoryEventsCount} Stock Edits</strong>
          <small className="kpi-sub-text">Pharmacy inventory adjustments</small>
        </div>
      </div>

      {/* Toolbar: Search & Action Filter */}
      <div className="admin-card-surface products-toolbar-surface">
        <div className="admin-product-search-box">
          <Search size={16} className="search-lens-icon" />
          <input
            type="text"
            placeholder="Search activity by user, action, description, or IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-product-search-input"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="clear-search-btn">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="admin-product-filter-box">
          <Filter size={15} className="filter-icon" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="admin-product-filter-select"
          >
            <option value="all">All Log Actions</option>
            <option value="PRODUCT_ADD">Product Added</option>
            <option value="STOCK_UPDATE">Stock / Inventory Updated</option>
            <option value="PRODUCT_DELETE">Product Deleted</option>
            <option value="ORDER_CREATE">Order Placed</option>
            <option value="REPORT_GENERATE">Report Generated</option>
          </select>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="admin-card-surface">
        <div className="admin-table-responsive">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User & Role</th>
                <th>Action Type</th>
                <th>Description / Activity Details</th>
                <th>Entity Info</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="empty-subview-card">
                      <Clock size={28} style={{ margin: '0 auto 10px', color: '#7aa39e' }} />
                      <h4>No Activity Logs Found</h4>
                      <p>No user activity records match your search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="td-date">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-teal-600" />
                        <strong>{log.created_at}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="pet-owner-combo">
                        <div className="w-8 h-8 rounded-full bg-teal-50 grid place-items-center text-teal-700 font-bold text-xs">
                          {log.role === 'admin' ? '👨‍⚕️' : '👤'}
                        </div>
                        <div className="pet-owner-texts">
                          <strong>{log.user_name}</strong>
                          <small className="capitalize">{log.role}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-gray-800 text-sm">{log.description}</span>
                    </td>
                    <td>
                      {log.entity_id ? (
                        <span className="status-pill purple text-xs font-mono">
                          {log.entity_type || 'item'}: {log.entity_id}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="td-sku font-mono text-xs">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
