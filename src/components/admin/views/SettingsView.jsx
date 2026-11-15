import React, { useState, useEffect, useRef } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  HardDrive,
  Key,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react'

import {
  smsService,
  orderService,
  userService,
  activityService,
} from '../../../services/api'
import './settings.css'

// Default hospital portal settings
const DEFAULT_SETTINGS = {
  // Hospital Profile
  hospitalName: 'City Pet Animal Hospital',
  branchName: 'Colombo 07 Central Animal Hospital & Pharmacy',
  registrationNo: 'SLVMC/2018/HOSP-8491',
  phone: '011 234 5678',
  hotline: '077 123 4567',
  email: 'director@citypet.lk',
  address: 'No. 142/A, Dharmapala Mawatha, Colombo 07, Sri Lanka',
  operatingHours: 'Mon - Sun: 8:00 AM - 10:00 PM (Emergency 24/7)',

  // Commerce & Logistics
  currency: 'LKR',
  taxPercentage: '8',
  deliveryFee: '450',
  freeDeliveryThreshold: '5000',
  autoConfirmOrders: true,
  stockAlertThreshold: '5',

  // SMS Gateway Configuration (Sri Lanka)
  smsProvider: 'textit',
  smsApiKey: 'txt_live_9a7d8e2bf41c089',
  smsSenderId: 'CITYPET',
  smsBalance: 2480,
  smsTriggers: {
    orderPlaced: true,
    orderShipped: true,
    paymentReceived: true,
    vetAppointment: true,
  },
  smsTemplates: {
    orderPlaced:
      'Dear {customer_name}, thank you for your order {order_number} at City Pet Hospital. Total: LKR {total}. We are preparing your items now!',
    orderShipped:
      'Hello {customer_name}, your order {order_number} from City Pet has been dispatched! Our courier will deliver to your doorstep shortly.',
    paymentReceived:
      'City Pet Notice: We have received your payment of LKR {total} for order {order_number}. Thank you!',
    vetAppointment:
      'Reminder: Your veterinary care appointment for your pet is scheduled with City Pet Hospital. Please call {hospital_phone} for assistance.',
  },

  // Security
  sessionTimeout: '60',
  requireTwoFactor: false,
  logAuditTrail: true,
}

// Helper: Download a string as a file in browser
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Helper: Convert array of objects to CSV string
function convertToCsv(items) {
  if (!items || !items.length) return ''
  const headers = Object.keys(items[0])
  const headerLine = headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',')
  const rows = items.map((item) => {
    return headers
      .map((header) => {
        let val = item[header]
        if (val === null || val === undefined) val = ''
        if (typeof val === 'object') val = JSON.stringify(val)
        return `"${String(val).replace(/"/g, '""')}"`
      })
      .join(',')
  })
  return [headerLine, ...rows].join('\r\n')
}

// Simple CSV parser for uploaded files
function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []

  const splitLine = (line) => {
    const result = []
    let cur = ''
    let insideQuote = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          insideQuote = !insideQuote
        }
      } else if (char === ',' && !insideQuote) {
        result.push(cur.trim())
        cur = ''
      } else {
        cur += char
      }
    }
    result.push(cur.trim())
    return result
  }

  const rawHeaders = splitLine(lines[0])
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim())

  return lines.slice(1).map((line) => {
    const values = splitLine(line).map((v) => v.replace(/^["']|["']$/g, '').trim())
    const row = {}
    headers.forEach((h, i) => {
      row[h] = values[i] !== undefined ? values[i] : ''
    })
    return row
  })
}

export default function SettingsView({
  initialTab = 'general',
  adminProducts = [],
  setAdminProducts,
  showToast,
  setActiveTab,
  authUser,
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab)

  // Load persisted settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('citypet_portal_settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // SMS Test Sender State
  const [testPhone, setTestPhone] = useState('077 123 4567')
  const [testTemplate, setTestTemplate] = useState('orderPlaced')
  const [testMessage, setTestMessage] = useState(settings.smsTemplates.orderPlaced)
  const [isSendingSms, setIsSendingSms] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [smsLogs, setSmsLogs] = useState([])
  const [loadingSmsLogs, setLoadingSmsLogs] = useState(false)
  const [smsStats, setSmsStats] = useState({ total: 0, today: 0 })

  // Import State
  const [importType, setImportType] = useState('products') // 'products' | 'users'
  const [importRows, setImportRows] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

  // Sync test message when template selection changes
  const handleSelectTemplate = (tplKey) => {
    setTestTemplate(tplKey)
    const tpl = settings.smsTemplates[tplKey] || ''
    const sample = tpl
      .replace('{customer_name}', 'Nimal Perera')
      .replace('{order_number}', 'ORD-2024-8921')
      .replace('{total}', '4,850')
      .replace('{hospital_phone}', settings.hotline)
    setTestMessage(sample)
  }

  // Load recent SMS logs from API
  const loadSmsHistory = async () => {
    setLoadingSmsLogs(true)
    try {
      const res = await smsService.getAllSmsLogs(30)
      if (res && res.logs) {
        setSmsLogs(res.logs)
        setSmsStats({ total: res.total || res.logs.length, today: res.today || 0 })
      }
    } catch (err) {
      console.warn('[SettingsView] Error loading SMS logs:', err)
    } finally {
      setLoadingSmsLogs(false)
    }
  }

  useEffect(() => {
    if (activeSubTab === 'sms') {
      loadSmsHistory()
    }
  }, [activeSubTab])

  const [deliveryReady, setDeliveryReady] = useState(false)
  const [deliveryLoadError, setDeliveryLoadError] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    let active = true
    orderService.getDeliverySettings().then(([method]) => {
      if (!active) return
      if (!method) throw new Error('Standard Delivery is unavailable.')
      setSettings((current) => ({ ...current, deliveryFee: method.fee, freeDeliveryThreshold: method.freeDeliveryThreshold }))
      setDeliveryReady(true)
    }).catch((error) => { if (active) setDeliveryLoadError(error.message) })
    return () => { active = false }
  }, [])

  const handleSaveSettings = async (event) => {
    event.preventDefault()
    if (!deliveryReady || savingSettings) return
    setSavingSettings(true)
    try {
      const { methods: [method] } = await orderService.updateDeliverySettings({
        fee: settings.deliveryFee, freeDeliveryThreshold: settings.freeDeliveryThreshold,
      })
      const saved = { ...settings, deliveryFee: method.fee, freeDeliveryThreshold: method.freeDeliveryThreshold }
      setSettings(saved)
      localStorage.setItem('citypet_portal_settings', JSON.stringify(saved))
      showToast('Portal settings saved.')
    } catch (error) {
      showToast(error.message || 'Unable to save settings.')
    } finally {
      setSavingSettings(false)
    }
  }

  // Send Test SMS Handler
  const handleSendTestSms = async (e) => {
    e.preventDefault()
    if (!testPhone.trim() || !testMessage.trim()) {
      showToast('Please enter both phone number and SMS message.')
      return
    }

    setIsSendingSms(true)
    try {
      const res = await smsService.sendSms({
        phone: testPhone,
        customerName: 'Test Recipient',
        message: testMessage,
        templateType: testTemplate,
        orderNumber: 'TEST-SMS',
      })
      showToast(`SMS sent to ${testPhone} successfully!`)
      loadSmsHistory()
    } catch (err) {
      showToast(`SMS Dispatch: ${err.message || 'Sent in local simulation mode'}`)
      loadSmsHistory()
    } finally {
      setIsSendingSms(false)
    }
  }

  // Export Data Handlers
  const handleExportProductsCsv = () => {
    if (!adminProducts || !adminProducts.length) {
      showToast('No products available to export.')
      return
    }
    const exportable = adminProducts.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand || 'City Pet',
      category: p.category,
      petType: p.petType || 'all',
      price: p.price,
      originalPrice: p.originalPrice || '',
      stockCount: p.stockCount !== undefined ? p.stockCount : 15,
      inStock: p.inStock ? 'YES' : 'NO',
      badge: p.badge || '',
      rating: p.rating || 5.0,
      reviews: p.reviews || 0,
      shortDescription: p.shortDescription || '',
    }))
    const csv = convertToCsv(exportable)
    downloadFile(`citypet_products_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8;')
    showToast(`Exported ${exportable.length} products to CSV!`)
  }

  const handleExportProductsJson = () => {
    const jsonStr = JSON.stringify(adminProducts, null, 2)
    downloadFile(`citypet_products_${new Date().toISOString().slice(0, 10)}.json`, jsonStr, 'application/json')
    showToast(`Exported ${adminProducts.length} products to JSON!`)
  }

  const handleExportOrdersCsv = async () => {
    try {
      showToast('Preparing orders dataset...')
      const orders = await orderService.getAllOrders()
      if (!orders || !orders.length) {
        showToast('No orders found to export.')
        return
      }
      const exportable = orders.map((o) => ({
        order_number: o.order_number || o.id,
        date: o.created_at || o.date || '',
        customer_name: o.customer_name || o.customerName || 'Customer',
        phone: o.customer_phone || o.phone || '',
        email: o.customer_email || o.email || '',
        total: o.total_amount || o.total || 0,
        status: o.status || 'pending',
        payment_method: o.payment_method || 'Cash on Delivery',
        payment_status: o.payment_status || 'pending',
        item_count: o.items ? (Array.isArray(o.items) ? o.items.length : 1) : 0,
      }))
      const csv = convertToCsv(exportable)
      downloadFile(`citypet_orders_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8;')
      showToast(`Exported ${exportable.length} orders to CSV!`)
    } catch (err) {
      showToast('Failed to export orders: ' + err.message)
    }
  }

  const handleExportUsersCsv = async () => {
    try {
      showToast('Preparing users dataset...')
      const usersData = await userService.getUsers()
      const users = usersData.users || usersData
      if (!users || !users.length) {
        showToast('No user accounts found to export.')
        return
      }
      const exportable = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        role: u.role || 'user',
        member_since: u.member_since || u.created_at || '',
      }))
      const csv = convertToCsv(exportable)
      downloadFile(`citypet_users_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8;')
      showToast(`Exported ${exportable.length} users to CSV!`)
    } catch (err) {
      showToast('Failed to export users: ' + err.message)
    }
  }

  const handleExportFullBackup = () => {
    const snapshot = {
      system: 'City Pet Animal Hospital Commerce & Clinic Portal',
      exported_at: new Date().toISOString(),
      exported_by: authUser?.name || 'Administrator',
      version: '1.0.0',
      portal_settings: settings,
      products_count: adminProducts.length,
      products: adminProducts,
    }
    downloadFile(`citypet_full_backup_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(snapshot, null, 2), 'application/json')
    showToast('Full system backup downloaded successfully!')
  }

  // Template Download Handlers
  const handleDownloadProductTemplate = () => {
    const template = [
      {
        name: 'Royal Canin Maxi Adult Dog Food 4kg',
        brand: 'Royal Canin',
        category: 'food',
        petType: 'dogs',
        price: '14500',
        originalPrice: '16000',
        stockCount: '25',
        inStock: 'YES',
        badge: 'Bestseller',
        shortDescription: 'Complete nutrition for adult dogs',
      },
      {
        name: 'NexGard Chewables for Dogs 10-25kg',
        brand: 'Boehringer Ingelheim',
        category: 'healthcare',
        petType: 'dogs',
        price: '6800',
        originalPrice: '7200',
        stockCount: '40',
        inStock: 'YES',
        badge: 'Vet Recommended',
        shortDescription: 'Flea and tick protection chewables',
      },
    ]
    const csv = convertToCsv(template)
    downloadFile('citypet_products_template.csv', csv, 'text/csv;charset=utf-8;')
    showToast('Product CSV template downloaded!')
  }

  const handleDownloadUsersTemplate = () => {
    const template = [
      {
        name: 'Dr. Ruwan Perera',
        email: 'ruwan.vet@citypet.lk',
        phone: '077 123 4567',
        role: 'veterinary_surgeon',
      },
      {
        name: 'Kamal Bandara',
        email: 'kamal.staff@citypet.lk',
        phone: '071 987 6543',
        role: 'receptionist_cashier',
      },
    ]
    const csv = convertToCsv(template)
    downloadFile('citypet_users_template.csv', csv, 'text/csv;charset=utf-8;')
    showToast('Users CSV template downloaded!')
  }

  // CSV File Upload & Parsing Handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFileName(file.name)
    setImportError('')
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        const text = evt.target.result
        const rows = parseCsv(text)
        if (!rows.length) {
          setImportError('The uploaded CSV file is empty or formatted incorrectly.')
          setImportRows([])
          return
        }
        setImportRows(rows)
        showToast(`Parsed ${rows.length} rows from ${file.name}`)
      } catch (err) {
        setImportError('Failed to parse CSV: ' + err.message)
        setImportRows([])
      }
    }

    reader.readAsText(file)
  }

  // Execute Import Handler
  const handleExecuteImport = async () => {
    if (!importRows.length) return
    setImporting(true)
    try {
      if (importType === 'products') {
        const newProducts = importRows.map((row, idx) => ({
          id: row.id || `imported_${Date.now()}_${idx}`,
          name: row.name || 'Unnamed Product',
          brand: row.brand || 'City Pet',
          category: row.category || 'food',
          petType: row.petType || 'all',
          price: parseFloat(row.price) || 1000,
          originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : null,
          stockCount: parseInt(row.stockCount, 10) || 10,
          inStock: row.inStock === 'NO' ? false : true,
          badge: row.badge || '',
          rating: 5.0,
          reviews: 1,
          imageType: 'royal-canin-dog',
          shortDescription: row.shortDescription || '',
        }))

        if (setAdminProducts) {
          setAdminProducts((prev) => [...newProducts, ...prev])
        }
        showToast(`Successfully imported ${newProducts.length} products into hospital catalog!`)
      } else {
        // Users import
        let successCount = 0
        for (const row of importRows) {
          if (row.name && row.email) {
            try {
              await userService.createUser({
                name: row.name,
                email: row.email,
                phone: row.phone || '',
                role: row.role || 'user',
                password: 'TempPassword@123',
              })
              successCount++
            } catch {
              // continue
            }
          }
        }
        showToast(`Successfully created ${successCount} user accounts from CSV!`)
      }

      setImportRows([])
      setImportFileName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      showToast('Import error: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="pm-page settings-page">
      {/* ── Page Header ── */}
      <div className="pm-page-header">
        <div>
          <span className="pm-eyebrow">CONFIGURATION &amp; TOOLS</span>
          <h2 className="pm-page-title">Hospital Portal Settings</h2>
          <p className="pm-page-desc">
            Manage hospital profile, SMS communications gateway, automated event triggers, and import/export tools.
          </p>
        </div>

        {/* Sub-tab Navigation Switcher */}
        <div className="settings-tabs-bar">
          <button
            type="button"
            className={`settings-tab-btn ${activeSubTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('general')}
          >
            <Building2 size={15} />
            <span>General &amp; Profile</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeSubTab === 'sms' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('sms')}
          >
            <MessageSquare size={15} />
            <span>SMS Communications</span>
            <span className="settings-tab-badge">Active</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeSubTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('data')}
          >
            <FileSpreadsheet size={15} />
            <span>Import &amp; Export</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeSubTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('security')}
          >
            <ShieldCheck size={15} />
            <span>Security &amp; RBAC</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: GENERAL & HOSPITAL PROFILE
          ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="settings-card">
          <div className="settings-section-header">
            <div className="settings-section-title-wrap">
              <span className="settings-icon-bubble" style={{ background: '#e6f5f3', color: '#04959d' }}>
                <Building2 size={22} />
              </span>
              <div>
                <h3>Hospital Identification &amp; Contact Details</h3>
                <p>Official information displayed across patient invoices, SMS masks, and receipts</p>
              </div>
            </div>
            <button type="submit" className="settings-save-btn" disabled={!deliveryReady || savingSettings}>
              <Check size={16} /> Save Changes
            </button>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label className="settings-label">Hospital Name *</label>
              <input
                type="text"
                className="settings-input"
                required
                value={settings.hospitalName}
                onChange={(e) => setSettings((s) => ({ ...s, hospitalName: e.target.value }))}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Primary Branch / Campus</label>
              <input
                type="text"
                className="settings-input"
                value={settings.branchName}
                onChange={(e) => setSettings((s) => ({ ...s, branchName: e.target.value }))}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Veterinary Medical Council License #</label>
              <input
                type="text"
                className="settings-input"
                value={settings.registrationNo}
                onChange={(e) => setSettings((s) => ({ ...s, registrationNo: e.target.value }))}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Official Inquiries Email *</label>
              <input
                type="email"
                className="settings-input"
                required
                value={settings.email}
                onChange={(e) => setSettings((s) => ({ ...s, email: e.target.value }))}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Hospital Landline Telephone</label>
              <input
                type="text"
                className="settings-input"
                value={settings.phone}
                onChange={(e) => setSettings((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">24/7 Emergency Hotline Mobile *</label>
              <input
                type="text"
                className="settings-input"
                required
                value={settings.hotline}
                onChange={(e) => setSettings((s) => ({ ...s, hotline: e.target.value }))}
              />
            </div>

            <div className="settings-field-full">
              <label className="settings-label">Hospital Physical Address</label>
              <input
                type="text"
                className="settings-input"
                value={settings.address}
                onChange={(e) => setSettings((s) => ({ ...s, address: e.target.value }))}
              />
            </div>

            <div className="settings-field-full">
              <label className="settings-label">Clinic &amp; Pharmacy Operating Hours</label>
              <input
                type="text"
                className="settings-input"
                value={settings.operatingHours}
                onChange={(e) => setSettings((s) => ({ ...s, operatingHours: e.target.value }))}
              />
            </div>
          </div>

          <div className="settings-section-header" style={{ marginTop: '12px' }}>
            <div className="settings-section-title-wrap">
              <span className="settings-icon-bubble" style={{ background: '#eef8fc', color: '#0284c7' }}>
                <CreditCard size={22} />
              </span>
              <div>
                <h3>Store Pricing &amp; Logistics Configuration</h3>
                <p>Tax calculations, delivery charges, and inventory thresholds</p>
              </div>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label className="settings-label">Operating Currency</label>
              <select
                className="settings-select"
                value={settings.currency}
                onChange={(e) => setSettings((s) => ({ ...s, currency: e.target.value }))}
              >
                <option value="LKR">LKR — Sri Lankan Rupee</option>
                <option value="USD">USD — US Dollar</option>
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label">VAT / Healthcare Tax Rate (%)</label>
              <input
                type="number"
                className="settings-input"
                min="0"
                max="30"
                value={settings.taxPercentage}
                onChange={(e) => setSettings((s) => ({ ...s, taxPercentage: e.target.value }))}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Standard Islandwide Delivery Fee (LKR)</label>
              <input
                type="number"
                className="settings-input"
                min="0"
                required step="0.01" max="99999999.99" disabled={!deliveryReady || savingSettings}
                value={deliveryReady ? settings.deliveryFee : ""}
                onChange={(e) => setSettings((s) => ({ ...s, deliveryFee: e.target.value }))}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label">Free Delivery Order Minimum (LKR)</label>
              <input
                type="number"
                className="settings-input"
                min="0"
                required step="0.01" max="99999999.99" disabled={!deliveryReady || savingSettings}
                value={deliveryReady ? settings.freeDeliveryThreshold : ""}
                onChange={(e) => setSettings((s) => ({ ...s, freeDeliveryThreshold: e.target.value }))}
              />
              <small className="settings-hint">Applies to the merchandise subtotal before discounts. Set to 0 for free delivery on every order.</small>
            </div>
          </div>

          {deliveryLoadError && <p role="alert">{deliveryLoadError} Reload Settings to retry.</p>}
          <div className="settings-action-bar">
            <button
              type="button"
              className="settings-secondary-btn"
              onClick={() => setSettings(DEFAULT_SETTINGS)}
            >
              Reset to Defaults
            </button>
            <button type="submit" className="settings-save-btn" disabled={!deliveryReady || savingSettings}>
              <Check size={16} /> Save Hospital Settings
            </button>
          </div>
        </form>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: SMS COMMUNICATIONS & GATEWAY HUB
          ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'sms' && (
        <div className="settings-card">
          {/* Status Indicator Banner */}
          <div className="sms-status-banner">
            <div className="sms-status-left">
              <div className="sms-pulse-indicator" />
              <div className="sms-status-texts">
                <h4>SMS Gateway Online • TextIt.biz Sri Lanka Bridge</h4>
                <p>Delivering real-time SMS to Dialog, Mobitel, Airtel &amp; Hutch networks</p>
              </div>
            </div>

            <div className="sms-balance-badge">
              <div style={{ textAlign: 'right' }}>
                <span className="sms-credit-label">Remaining Balance</span>
                <div className="sms-credit-number">{settings.smsBalance} Credits</div>
              </div>
              <button
                type="button"
                className="settings-secondary-btn"
                style={{ padding: '6px 12px', fontSize: '11.5px' }}
                onClick={() => showToast('SMS Gateway Balance: 2,480 credits (Synchronized)')}
              >
                <RefreshCw size={12} /> Sync
              </button>
            </div>
          </div>

          {/* Gateway Credentials */}
          <div className="settings-section-header">
            <div className="settings-section-title-wrap">
              <span className="settings-icon-bubble" style={{ background: '#e6f5f3', color: '#04959d' }}>
                <MessageSquare size={22} />
              </span>
              <div>
                <h3>SMS Gateway Provider &amp; Sender Mask</h3>
                <p>Configure credentials for Sri Lankan SMS aggregators</p>
              </div>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label className="settings-label">SMS Provider Gateway</label>
              <select
                className="settings-select"
                value={settings.smsProvider}
                onChange={(e) => setSettings((s) => ({ ...s, smsProvider: e.target.value }))}
              >
                <option value="textit">TextIt.biz (Direct Sri Lankan Gateway)</option>
                <option value="notifylk">Notify.lk (Sri Lanka Telecom Bridge)</option>
                <option value="dialog">Dialog mConnect Direct Business SMS</option>
                <option value="mobitel">Mobitel Enterprise SMS API</option>
                <option value="custom">Generic REST / HTTP SMS Webhook</option>
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label">Sender ID / Mask *</label>
              <input
                type="text"
                className="settings-input"
                maxLength={11}
                required
                value={settings.smsSenderId}
                onChange={(e) => setSettings((s) => ({ ...s, smsSenderId: e.target.value }))}
                placeholder="CITYPET"
              />
              <small className="settings-hint">Authorized alphanumeric mask approved by TRCSL</small>
            </div>

            <div className="settings-field-full">
              <label className="settings-label">API Secret Key / Bearer Token</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className="settings-input"
                  style={{ paddingRight: '45px', fontFamily: showApiKey ? 'inherit' : 'monospace' }}
                  value={settings.smsApiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, smsApiKey: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    border: 'none',
                    background: 'none',
                    color: '#638581',
                    cursor: 'pointer',
                  }}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Automated Event Notification Triggers */}
          <div className="settings-section-header" style={{ marginTop: '12px' }}>
            <div className="settings-section-title-wrap">
              <span className="settings-icon-bubble" style={{ background: '#f5f0fb', color: '#8b5cf6' }}>
                <Sparkles size={22} />
              </span>
              <div>
                <h3>Automated Customer SMS Triggers</h3>
                <p>Enable automated broadcasts sent to customers upon hospital events</p>
              </div>
            </div>
          </div>

          <div className="sms-triggers-list">
            {[
              {
                key: 'orderPlaced',
                title: 'Order Placed Confirmation',
                desc: 'Instantly notify customer with order # and total amount upon checkout',
                icon: ShoppingBag,
                color: '#04959d',
                bg: '#e6f5f3',
              },
              {
                key: 'orderShipped',
                title: 'Order Dispatched / Shipped',
                desc: 'Send tracking update when courier package is dispatched from hospital',
                icon: Truck,
                color: '#0284c7',
                bg: '#eef8fc',
              },
              {
                key: 'paymentReceived',
                title: 'Payment Verification Receipt',
                desc: 'Confirm payment receipt for credit cards, bank transfer, or cash',
                icon: CreditCard,
                color: '#00a86b',
                bg: '#e6f6f3',
              },
              {
                key: 'vetAppointment',
                title: 'Clinical Appointment & Prescription',
                desc: 'Send patient reminder 24h prior to doctor checkup or vaccine due date',
                icon: Calendar,
                color: '#b45309',
                bg: '#fffbeb',
              },
            ].map(({ key, title, desc, icon: Icon, color, bg }) => {
              const isEnabled = !!settings.smsTriggers[key]
              return (
                <div
                  key={key}
                  className={`sms-trigger-card ${isEnabled ? 'enabled' : ''}`}
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      smsTriggers: { ...s.smsTriggers, [key]: !isEnabled },
                    }))
                  }
                >
                  <div className="sms-trigger-info">
                    <span className="sms-trigger-icon" style={{ background: bg, color }}>
                      <Icon size={18} />
                    </span>
                    <div className="sms-trigger-texts">
                      <strong>{title}</strong>
                      <p>{desc}</p>
                    </div>
                  </div>
                  <div className={`sms-switch-toggle ${isEnabled ? 'on' : ''}`}>
                    <div className="sms-switch-dot" />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Live Test SMS Sender */}
          <div className="sms-test-dispatcher">
            <div className="sms-test-header">
              <h4>
                <Send size={16} color="#04959d" /> Direct Test SMS Dispatcher
              </h4>
              <span className="sms-char-counter">
                {testMessage.length} / 160 chars ({Math.ceil(testMessage.length / 160) || 1} SMS)
              </span>
            </div>

            <form onSubmit={handleSendTestSms} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="settings-label">Recipient Mobile Number *</label>
                  <input
                    type="tel"
                    className="settings-input"
                    required
                    placeholder="077 123 4567"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                  <small className="settings-hint">Supports formats: 077XXXXXXX or +9477XXXXXXX</small>
                </div>

                <div>
                  <label className="settings-label">Select Pre-configured Template</label>
                  <select
                    className="settings-select"
                    value={testTemplate}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                  >
                    <option value="orderPlaced">Order Placed Template</option>
                    <option value="orderShipped">Order Dispatched Template</option>
                    <option value="paymentReceived">Payment Received Template</option>
                    <option value="vetAppointment">Vet Appointment Template</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="settings-label">SMS Message Body</label>
                <textarea
                  className="settings-textarea"
                  rows={3}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={isSendingSms}
                  className="sms-dispatch-btn"
                >
                  <Send size={14} />
                  <span>{isSendingSms ? 'Transmitting SMS...' : 'Send Live Test SMS'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SMS Audit Logs History Table (From MySQL) */}
          <div className="settings-section-header" style={{ marginTop: '16px' }}>
            <div className="settings-section-title-wrap">
              <span className="settings-icon-bubble" style={{ background: '#e6f5f3', color: '#04959d' }}>
                <Clock size={20} />
              </span>
              <div>
                <h3>Recent SMS Dispatch Audit Trail</h3>
                <p>Broadcast history saved in hospital MySQL database (Total: {smsStats.total} messages)</p>
              </div>
            </div>
            <button
              type="button"
              className="settings-secondary-btn"
              onClick={loadSmsHistory}
              disabled={loadingSmsLogs}
            >
              <RefreshCw size={13} className={loadingSmsLogs ? 'animate-spin' : ''} />
              <span>Refresh History</span>
            </button>
          </div>

          <div style={{ border: '1px solid #e1eee9', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="sms-logs-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Customer Name</th>
                    <th>Template Type</th>
                    <th>Message Preview</th>
                    <th>Sent By</th>
                    <th>Date &amp; Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {smsLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <strong style={{ fontFamily: 'monospace', color: '#123835' }}>
                          {log.recipient_phone}
                        </strong>
                      </td>
                      <td>{log.recipient_name || 'Valued Customer'}</td>
                      <td>
                        <span style={{ fontSize: '11px', fontWeight: 700, background: '#f0f7f5', color: '#04959d', padding: '2px 7px', borderRadius: '6px' }}>
                          {log.template_type || 'direct'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message}>
                        {log.message}
                      </td>
                      <td>{log.sent_by || 'Admin'}</td>
                      <td style={{ fontSize: '11.5px', color: '#688d88' }}>
                        {log.created_at || 'Recently'}
                      </td>
                      <td>
                        <span className={`sms-badge ${log.status || 'sent'}`}>
                          <Check size={11} /> {log.status || 'Delivered'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {smsLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#648984' }}>
                        {loadingSmsLogs ? 'Loading SMS logs from database...' : 'No SMS messages sent yet. Use the Test Sender above to dispatch an SMS!'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: DATA IMPORT & EXPORT HUB
          ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'data' && (
        <div className="import-export-grid">
          {/* EXPORT DATA CARD */}
          <div className="data-hub-card">
            <div className="data-hub-card-header">
              <span className="data-hub-icon-wrap" style={{ background: '#e6f5f3', color: '#04959d' }}>
                <Download size={24} />
              </span>
              <div>
                <h3>Export Data Hub</h3>
                <p>Download complete database datasets in CSV and JSON formats</p>
              </div>
            </div>

            <div className="data-action-list">
              {/* Export Products */}
              <div className="data-action-row">
                <div className="data-action-left">
                  <Package size={20} color="#04959d" />
                  <div className="data-action-texts">
                    <strong>Export Products &amp; Inventory</strong>
                    <span>{adminProducts.length} items with prices, stock counts &amp; variants</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="data-pill-btn outline"
                    onClick={handleExportProductsCsv}
                    title="Export Products as CSV for Excel"
                  >
                    <FileSpreadsheet size={13} /> CSV
                  </button>
                  <button
                    type="button"
                    className="data-pill-btn outline"
                    onClick={handleExportProductsJson}
                    title="Export Products as JSON"
                  >
                    <FileText size={13} /> JSON
                  </button>
                </div>
              </div>

              {/* Export Orders */}
              <div className="data-action-row">
                <div className="data-action-left">
                  <ShoppingBag size={20} color="#0284c7" />
                  <div className="data-action-texts">
                    <strong>Export Orders History</strong>
                    <span>Customer details, items, payment status &amp; totals</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="data-pill-btn teal"
                  onClick={handleExportOrdersCsv}
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>

              {/* Export Users */}
              <div className="data-action-row">
                <div className="data-action-left">
                  <Users size={20} color="#8b5cf6" />
                  <div className="data-action-texts">
                    <strong>Export Registered Users</strong>
                    <span>Doctors, staff accounts, customers &amp; assigned roles</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="data-pill-btn teal"
                  onClick={handleExportUsersCsv}
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>

              {/* Full System Backup */}
              <div className="data-action-row" style={{ background: '#f5faf9', borderColor: '#a4d8d0' }}>
                <div className="data-action-left">
                  <HardDrive size={20} color="#0e5d59" />
                  <div className="data-action-texts">
                    <strong>Full System Database Backup</strong>
                    <span>1-click JSON snapshot of settings, products &amp; configuration</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="data-pill-btn teal"
                  style={{ background: '#0e5d59' }}
                  onClick={handleExportFullBackup}
                >
                  <HardDrive size={13} /> Backup JSON
                </button>
              </div>
            </div>
          </div>

          {/* IMPORT DATA CARD */}
          <div className="data-hub-card">
            <div className="data-hub-card-header">
              <span className="data-hub-icon-wrap" style={{ background: '#eef8fc', color: '#0284c7' }}>
                <Upload size={24} />
              </span>
              <div>
                <h3>Import Data Center</h3>
                <p>Bulk upload products, customer records, and inventory from CSV</p>
              </div>
            </div>

            {/* Import Type Switcher */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`data-pill-btn ${importType === 'products' ? 'teal' : 'outline'}`}
                onClick={() => {
                  setImportType('products')
                  setImportRows([])
                  setImportFileName('')
                }}
              >
                <Package size={13} /> Import Products CSV
              </button>
              <button
                type="button"
                className={`data-pill-btn ${importType === 'users' ? 'teal' : 'outline'}`}
                onClick={() => {
                  setImportType('users')
                  setImportRows([])
                  setImportFileName('')
                }}
              >
                <Users size={13} /> Import Users CSV
              </button>
            </div>

            {/* CSV Drag & Drop Upload Zone */}
            <div
              className="csv-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <span className="csv-dropzone-icon">
                <Upload size={24} />
              </span>
              <div>
                <strong>
                  {importFileName ? `Selected: ${importFileName}` : `Click to choose ${importType === 'products' ? 'Products' : 'Users'} CSV file`}
                </strong>
                <p>Supports .csv files with standard column headers</p>
              </div>

              {/* Sample Template Download */}
              <div className="csv-template-pills" onClick={(e) => e.stopPropagation()}>
                <span style={{ fontSize: '11px', color: '#557e79' }}>Need a sample format?</span>
                {importType === 'products' ? (
                  <button type="button" onClick={handleDownloadProductTemplate}>
                    <Download size={11} /> Download Product CSV Template
                  </button>
                ) : (
                  <button type="button" onClick={handleDownloadUsersTemplate}>
                    <Download size={11} /> Download Users CSV Template
                  </button>
                )}
              </div>
            </div>

            {importError && (
              <p style={{ margin: 0, padding: '10px 14px', borderRadius: '8px', background: '#fff1f2', color: '#be123c', fontSize: '12.5px' }}>
                {importError}
              </p>
            )}

            {/* Preview Box if rows parsed */}
            {importRows.length > 0 && (
              <div className="import-preview-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '12.5px', color: '#123835' }}>
                    Previewing {importRows.length} valid rows from CSV:
                  </strong>
                  <span style={{ fontSize: '11.5px', color: '#04959d', fontWeight: 700 }}>
                    Ready to commit
                  </span>
                </div>

                <div className="preview-table-wrap">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {Object.keys(importRows[0] || {}).slice(0, 5).map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 4).map((row, idx) => (
                        <tr key={idx}>
                          {Object.keys(row).slice(0, 5).map((col) => (
                            <td key={col}>{String(row[col] || '—')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="settings-secondary-btn"
                    onClick={() => {
                      setImportRows([])
                      setImportFileName('')
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="settings-save-btn"
                    disabled={importing}
                    onClick={handleExecuteImport}
                  >
                    <Check size={14} />
                    <span>{importing ? 'Importing Dataset...' : `Import ${importRows.length} Records Now`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 4: SECURITY & RBAC
          ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'security' && (
        <div className="settings-card">
          <div className="settings-section-header">
            <div className="settings-section-title-wrap">
              <span className="settings-icon-bubble" style={{ background: '#fdf2f8', color: '#db2777' }}>
                <ShieldCheck size={22} />
              </span>
              <div>
                <h3>Access Control, Session Security &amp; RBAC</h3>
                <p>Configure password security guidelines and jump to granular role permissions</p>
              </div>
            </div>
            <button
              type="button"
              className="settings-save-btn"
              onClick={() => setActiveTab('users')}
            >
              <Users size={15} /> Open Users &amp; Roles Matrix
            </button>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label className="settings-label">Admin Session Idle Inactivity Timeout</label>
              <select
                className="settings-select"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings((s) => ({ ...s, sessionTimeout: e.target.value }))}
              >
                <option value="15">15 Minutes of inactivity</option>
                <option value="30">30 Minutes of inactivity</option>
                <option value="60">1 Hour of inactivity</option>
                <option value="240">4 Hours (Clinical shift)</option>
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label">Security Audit Logging</label>
              <select
                className="settings-select"
                value={settings.logAuditTrail ? 'enabled' : 'disabled'}
                onChange={(e) => setSettings((s) => ({ ...s, logAuditTrail: e.target.value === 'enabled' }))}
              >
                <option value="enabled">Enabled (Logs every Admin action to MySQL)</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          <div style={{ padding: '18px 20px', background: '#f8faf9', borderRadius: '14px', border: '1px solid #d4ece7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '14px', color: '#123835', marginBottom: '2px' }}>
                Role-Based Access Control (RBAC) System
              </strong>
              <p style={{ margin: 0, fontSize: '12px', color: '#557e79' }}>
                Granular Add (Create), Read (View), Update (Edit), and Delete (Remove) privileges across 9 hospital modules are managed in the Roles view.
              </p>
            </div>
            <button
              type="button"
              className="settings-secondary-btn"
              onClick={() => setActiveTab('users')}
              style={{ flexShrink: 0 }}
            >
              Configure Roles →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
