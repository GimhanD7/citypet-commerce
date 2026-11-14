/**
 * City Pet Animal Hospital - API Service Layer
 * Connects Frontend UI to PHP/MySQL REST Backend with Graceful Fallback
 */

import { apiFetch } from '../config/api'
import {
  filterBrands,
  filterCategories,
  filterPetTypes,
  storeCategories,
  storeProducts,
} from '../data/storeData'
import { customerProfile, recentOrdersData, userPetProfiles } from '../data/userData'

/* ============================================================
   1. AUTHENTICATION SERVICE (Universal Single Login)
   ============================================================ */
export const authService = {
  /**
   * Request OTP code
   */
  async sendOtp(identifier) {
    try {
      return await apiFetch('auth.php?action=send_otp', {
        method: 'POST',
        body: { identifier },
      })
    } catch (err) {
      console.warn('[authService.sendOtp] Backend fallback:', err.message)
      const isEmail = identifier.includes('@')
      const digits = identifier.replace(/\D/g, '')
      const isAdmin =
        identifier.toLowerCase().includes('admin') ||
        identifier.toLowerCase().includes('director') ||
        identifier.toLowerCase().includes('citypet.lk') ||
        digits.includes('712345678') ||
        digits.includes('112891234')
      return {
        sent: true,
        target: isEmail
          ? identifier.slice(0, 3) + '***@' + identifier.split('@')[1]
          : identifier.slice(0, 4) + '****' + identifier.slice(-3),
        role: isAdmin ? 'admin' : 'user',
        demo_otp: '123456',
        user_exists: true,
      }
    }
  },

  /**
   * Verify OTP and Login
   */
  async verifyOtp(identifier, otp) {
    const result = await apiFetch('auth.php?action=verify_otp', {
      method: 'POST',
      body: { identifier, otp },
    })
    const session = await apiFetch('auth.php?action=session')
    if (!session?.user || session.user.id !== result?.user?.id) {
      throw new Error('Unable to establish your session. Please allow cookies and try signing in again.')
    }
    // Merge: session.user has fresh DB fields; result.user has enriched fields (isNewCustomer, addressLine1, etc.)
    const mergedUser = { ...result.user, ...session.user, isNewCustomer: result.user?.isNewCustomer ?? false, addressLine1: result.user?.addressLine1 ?? '', addressLine2: result.user?.addressLine2 ?? '', city: result.user?.city ?? 'Colombo', district: result.user?.district ?? 'Colombo', postalCode: result.user?.postalCode ?? '' }
    return { ...result, user: mergedUser }
  },
  /**
   * Verify Current Session
   */
  async getMe(userId) {
    try {
      return await apiFetch(`auth.php?action=me&user_id=${encodeURIComponent(userId)}`)
    } catch (err) {
      console.warn('[authService.getMe] Backend fallback:', err.message)
      return {
        user: customerProfile,
        role: 'user',
      }
    }
  },
}

/* ============================================================
   2. PRODUCTS SERVICE
   ============================================================ */
export const productService = {
  /**
   * Get Products with Filters, Search, and Sort
   */
  async getProducts(params = {}) {
    try {
      const query = new URLSearchParams()
      if (params.category && params.category !== 'all') query.append('category', params.category)
      if (params.petType && params.petType !== 'all') query.append('pet_type', params.petType)
      if (params.brand && params.brand !== 'all') query.append('brand', params.brand)
      if (params.search) query.append('search', params.search)
      if (params.minPrice) query.append('min_price', params.minPrice)
      if (params.maxPrice) query.append('max_price', params.maxPrice)
      if (params.inStock !== undefined) query.append('in_stock', params.inStock ? '1' : '0')
      if (params.sort) query.append('sort', params.sort)
      if (params.limit) query.append('limit', params.limit)
      if (params.offset) query.append('offset', params.offset)

      const qs = query.toString()
      const res = await apiFetch(`products.php${qs ? '?' + qs : ''}`)
      return res.products || res
    } catch (err) {
      console.warn('[productService.getProducts] Backend fallback:', err.message)
      // Client-side fallback filtering
      let list = [...storeProducts]
      if (params.category && params.category !== 'all') {
        list = list.filter((p) => p.category === params.category)
      }
      if (params.petType && params.petType !== 'all') {
        list = list.filter((p) => p.petType === params.petType)
      }
      if (params.search) {
        const s = params.search.toLowerCase()
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            p.brand.toLowerCase().includes(s) ||
            (p.shortDescription && p.shortDescription.toLowerCase().includes(s))
        )
      }
      return list
    }
  },

  /**
   * Get Single Product Details by ID
   */
  async getProductById(id) {
    try {
      return await apiFetch(`products.php?id=${encodeURIComponent(id)}`)
    } catch (err) {
      console.warn('[productService.getProductById] Backend fallback:', err.message)
      const found = storeProducts.find((p) => p.id === id) || storeProducts[0]
      return found
    }
  },

  /**
   * Admin: Add Product
   */
  async createProduct(productData) {
    const session = await apiFetch('auth.php?action=session')
    return await apiFetch('products.php', {
      method: 'POST',
      body: { ...productData, csrfToken: session.csrfToken },
    })
  },

  /**
   * Admin: Update Product
   */
  async updateProduct(id, productData) {
    const session = await apiFetch('auth.php?action=session')
    return await apiFetch(`products.php?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: { ...productData, csrfToken: session.csrfToken },
    })
  },

  /**
   * Admin: Delete Product
   */
  async deleteProduct(id) {
    const session = await apiFetch('auth.php?action=session')
    return await apiFetch(`products.php?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      body: { csrfToken: session.csrfToken },
    })
  },
}

/* ============================================================
   3. CATEGORIES & TAXONOMY SERVICE
   ============================================================ */
export const categoryService = {
  async getCategories({ allowFallback = true } = {}) {
    try {
      return await apiFetch('categories.php')
    } catch (err) {
      if (!allowFallback) throw err
      console.warn('[categoryService.getCategories] Backend fallback:', err.message)
      return {
        categories: storeCategories,
        petTypes: filterPetTypes,
        brands: filterBrands,
      }
    }
  },
}

/* ============================================================
   4. ORDERS & CHECKOUT SERVICE
   ============================================================ */
export const orderService = {
  /**
   * Place a New Order
   */
  async createOrder(orderPayload) {
    const session = await apiFetch('auth.php?action=session')
    return apiFetch('orders.php', {
      method: 'POST',
      body: { ...orderPayload, csrfToken: session.csrfToken },
    })
  },

  /**
   * Get User Orders History
   */
  async getUserOrders(userId = '', status = '') {
    try {
      const qs = new URLSearchParams()
      if (userId) qs.append('user_id', userId)
      if (status && status !== 'all') qs.append('status', status)
      const res = await apiFetch(`orders.php?${qs.toString()}`)
      return res.orders || (Array.isArray(res) ? res : [])
    } catch (err) {
      console.warn('[orderService.getUserOrders] Backend fallback:', err.message)
      return [] // return empty — never show dummy orders for a real logged-in user
    }
  },

  /**
   * Admin: Get All Orders
   */
  async getAllOrders(status = '') {
    try {
      const qs = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''
      const res = await apiFetch(`orders.php${qs}`)
      return res.orders || res
    } catch (err) {
      console.warn('[orderService.getAllOrders] Backend fallback:', err.message)
      return recentOrdersData
    }
  },

  async getDeliverySettings({ includeDisabled = false } = {}) {
    try {
      const qs = includeDisabled ? '?all=1' : ''
      const res = await apiFetch(`delivery_settings.php${qs}`)
      return res.methods || []
    } catch (err) {
      console.warn('[orderService.getDeliverySettings] Backend fallback:', err.message)
      return [
        { id: 'standard', name: 'Standard Delivery', time: '2 - 4 working days', fee: 350, price: 350, enabled: true },
        { id: 'express', name: 'Express Delivery', time: '1 - 2 working days', fee: 700, price: 700, enabled: true },
      ].filter((method) => includeDisabled || method.enabled)
    }
  },

  async updateDeliverySettings(methods) {
    const session = await apiFetch('auth.php?action=session')
    return apiFetch('delivery_settings.php', {
      method: 'PUT',
      body: { methods, csrfToken: session.csrfToken },
    })
  },

  /**
   * Track Live Order
   */
  async trackOrder(query) {
    try {
      return await apiFetch(`orders.php?track=${encodeURIComponent(query)}`)
    } catch (err) {
      console.warn('[orderService.trackOrder] Backend fallback:', err.message)
      const found = recentOrdersData.find(
        (o) =>
          o.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
          o.trackingNumber.toLowerCase().includes(query.toLowerCase())
      )
      return found || recentOrdersData[2]
    }
  },

  /**
   * Admin: Update Order Status
   */
  async updateOrderStatus(orderId, status) {
    try {
      return await apiFetch('orders.php', {
        method: 'PUT',
        body: { orderId, status },
      })
    } catch (err) {
      console.warn('[orderService.updateOrderStatus] Backend fallback:', err.message)
      return { updated: true, orderId, status }
    }
  },

  async reviewBankTransfer(orderId, paymentAction) {
    const session = await apiFetch('auth.php?action=session')
    return apiFetch('orders.php', {
      method: 'PUT',
      body: { orderId, paymentAction, csrfToken: session.csrfToken },
    })
  },

  /**
   * Upload Bank Transfer Payment Slip
   */
  async uploadPaymentSlip(fileOrBase64) {
    try {
      if (fileOrBase64 instanceof File) {
        const fd = new FormData()
        fd.append('slip', fileOrBase64)
        return await apiFetch('upload_slip.php', {
          method: 'POST',
          body: fd,
        })
      } else {
        return await apiFetch('upload_slip.php', {
          method: 'POST',
          body: { base64Data: fileOrBase64 },
        })
      }
    } catch (err) {
      console.warn('[orderService.uploadPaymentSlip] Fallback to simulated slip:', err.message)
      return {
        url: typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')
          ? fileOrBase64
          : '/citypet/api/uploads/slips/sample_slip.png',
        filename: fileOrBase64?.name || 'bank_slip.jpg',
        size: fileOrBase64?.size || 102400,
        type: 'image',
      }
    }
  },

  /**
   * Generate PayHere Checkout Security Hash
   */
  async getPayHereHash(orderId, amount, currency = 'LKR') {
    try {
      return await apiFetch('payhere.php', {
        method: 'POST',
        body: { orderId, amount, currency },
      })
    } catch (err) {
      console.warn('[orderService.getPayHereHash] Local hash fallback:', err.message)
      return {
        merchantId: '1211149',
        orderId,
        amount: Number(amount).toFixed(2),
        currency,
        isSandbox: true,
      }
    }
  },
}

/* ============================================================
   5. CUSTOMER PROFILE SERVICE
   ============================================================ */
export const profileService = {
  async getProfile(userId = '') {
    if (!userId) return null
    try {
      return await apiFetch(`profile.php?user_id=${encodeURIComponent(userId)}`)
    } catch (err) {
      console.warn('[profileService.getProfile] Backend fallback:', err.message)
      return null
    }
  },

  async updateProfile(data) {
    try {
      return await apiFetch('profile.php', {
        method: 'PUT',
        body: data,
      })
    } catch (err) {
      console.warn('[profileService.updateProfile] Backend fallback:', err.message)
      return { updated: true }
    }
  },
}

/* ============================================================
   6. PETS & CLINICAL RECORDS SERVICE
   ============================================================ */
export const petService = {
  async getPets(userId = '') {
    try {
      const res = await apiFetch(`pets.php?user_id=${encodeURIComponent(userId)}`)
      return res.pets || (Array.isArray(res) ? res : [])
    } catch (err) {
      console.warn('[petService.getPets] Backend fallback:', err.message)
      return [] // return empty — never show dummy pets for a real logged-in user
    }
  },

  async createPet(petData) {
    try {
      return await apiFetch('pets.php', {
        method: 'POST',
        body: petData,
      })
    } catch (err) {
      console.warn('[petService.createPet] Backend fallback:', err.message)
      return { id: 'pet-' + Date.now(), name: petData.name }
    }
  },

  async updatePet(petId, petData) {
    try {
      return await apiFetch(`pets.php?id=${encodeURIComponent(petId)}`, {
        method: 'PUT',
        body: { ...petData, id: petId },
      })
    } catch (err) {
      console.warn('[petService.updatePet] Backend fallback:', err.message)
      return { updated: true, id: petId }
    }
  },

  async deletePet(petId) {
    try {
      return await apiFetch(`pets.php?id=${encodeURIComponent(petId)}`, {
        method: 'DELETE',
        body: { id: petId },
      })
    } catch (err) {
      console.warn('[petService.deletePet] Backend fallback:', err.message)
      return { deleted: true, id: petId }
    }
  },
}

/* ============================================================
   7. ADMIN DASHBOARD ANALYTICS SERVICE
   ============================================================ */
export const adminService = {
  async getDashboardStats() {
    try {
      return await apiFetch('admin/dashboard.php')
    } catch (err) {
      console.warn('[adminService.getDashboardStats] Backend fallback:', err.message)
      return {
        kpis: {
          totalRevenue: 2840500,
          revenueGrowth: '+14.2%',
          totalOrders: 384,
          ordersGrowth: '+8.6%',
          pendingOrders: 24,
          totalProducts: 138,
          totalPatients: 1240,
          patientGrowth: '+18.4%',
        },
        salesChart: [
          { date: 'Apr 1', day: 1, revenue: 130000, orders: 42 },
          { date: 'Apr 5', day: 5, revenue: 205000, orders: 58 },
          { date: 'Apr 10', day: 10, revenue: 260000, orders: 74 },
          { date: 'Apr 15', day: 15, revenue: 320450, orders: 86 },
          { date: 'Apr 20', day: 20, revenue: 195000, orders: 52 },
          { date: 'Apr 25', day: 25, revenue: 245000, orders: 68 },
          { date: 'Apr 30', day: 30, revenue: 335000, orders: 92 },
        ],
        recentOrders: [
          {
            id: 'ord-101',
            orderNumber: '#CP75821',
            customer: 'Sarah Jenkins',
            amount: '8300.00',
            status: 'Delivered',
            statusType: 'delivered',
            date: 'Apr 28, 2024',
            itemTitle: 'Royal Canin Mini Adult Dry Dog Food 2kg',
          },
        ],
        lowStockAlerts: [
          { product: 'Royal Canin Mini Adult 2kg', sku: 'RC001', stock: 5, minStock: 10 },
          { product: "Hill's Science Diet Cat 1.5kg", sku: 'HS001', stock: 4, minStock: 10 },
        ],
        lastUpdated: 'Just now',
      }
    }
  },
}

/* ============================================================
   8. USER & ADMIN ACTIVITY AUDIT LOG SERVICE
   ============================================================ */
// In-memory / localStorage fallback audit trail
const initialLocalLogs = [
  {
    id: 'log-101',
    user_id: 'adm-001',
    user_name: 'Dr. Anjali Silva',
    role: 'admin',
    action: 'PRODUCT_ADD',
    description: 'Added new store product "Royal Canin Mini Adult Dry Dog Food 2kg"',
    entity_type: 'product',
    entity_id: 'rc-mini-adult',
    ip_address: '192.168.1.45',
    created_at: '2024-04-30 09:42:15',
  },
  {
    id: 'log-102',
    user_id: 'adm-001',
    user_name: 'Dr. Anjali Silva',
    role: 'admin',
    action: 'STOCK_UPDATE',
    description: 'Updated inventory for SKU: rc-mini-adult to 16 units (Colombo 07 Pharmacy)',
    entity_type: 'inventory',
    entity_id: 'rc-mini-adult',
    ip_address: '192.168.1.45',
    created_at: '2024-04-30 09:45:00',
  },
  {
    id: 'log-103',
    user_id: 'usr-84920',
    user_name: 'Sarah Perera',
    role: 'user',
    action: 'ORDER_CREATE',
    description: 'Created new online store order #CP75821 for LKR 7,950',
    entity_type: 'order',
    entity_id: '#CP75821',
    ip_address: '112.134.18.90',
    created_at: '2024-04-30 10:12:30',
  },
  {
    id: 'log-104',
    user_id: 'adm-001',
    user_name: 'Dr. Anjali Silva',
    role: 'admin',
    action: 'REPORT_GENERATE',
    description: 'Downloaded Monthly Executive Performance Summary Report (PDF)',
    entity_type: 'report',
    entity_id: 'rep-2024-04',
    ip_address: '192.168.1.45',
    created_at: '2024-04-30 10:25:14',
  },
]

let lastActivitySignature = ''
let lastActivityTime = 0

export const activityService = {
  /**
   * Log user or admin activity to database
   */
  async logActivity(payload) {
    const action = payload.action || 'GENERAL_ACTION'
    const entityId = payload.entityId || ''
    const description = payload.description || 'Performed user action'
    const sig = `${action}_${entityId}_${description}`
    const now = Date.now()

    // Prevent duplicate logs triggered within 2.5 seconds
    if (sig === lastActivitySignature && now - lastActivityTime < 2500) {
      return null
    }
    lastActivitySignature = sig
    lastActivityTime = now

    const entry = {
      id: 'log-' + now + '-' + Math.floor(Math.random() * 1000),
      user_id: payload.userId || 'adm-001',
      user_name: payload.userName || 'Dr. Anjali Silva',
      role: payload.role || 'admin',
      action,
      description,
      entity_type: payload.entityType || 'system',
      entity_id: payload.entityId || null,
      ip_address: '192.168.1.45',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }

    try {
      await apiFetch('activity_logs.php', {
        method: 'POST',
        body: entry,
      })
    } catch (err) {
      console.warn('[activityService.logActivity] Backend fallback:', err.message)
    }

    // Append to local session memory without duplicates
    try {
      const existing = JSON.parse(localStorage.getItem('citypet_activity_logs') || '[]')
      const isDuplicate = existing.some(
        (l) => l.action === entry.action && l.description === entry.description && l.entity_id === entry.entity_id
      )
      if (!isDuplicate) {
        localStorage.setItem('citypet_activity_logs', JSON.stringify([entry, ...existing.slice(0, 49)]))
      }
    } catch (e) {
      // Storage fallback
    }

    return entry
  },

  /**
   * Fetch activity logs from database
   */
  async getActivityLogs(params = {}) {
    try {
      const query = new URLSearchParams()
      if (params.action && params.action !== 'all') query.append('action', params.action)
      if (params.role && params.role !== 'all') query.append('role', params.role)
      if (params.search) query.append('search', params.search)

      const qs = query.toString()
      const res = await apiFetch(`activity_logs.php${qs ? '?' + qs : ''}`)
      if (res && res.logs && res.logs.length > 0) {
        return res.logs
      }
    } catch (err) {
      console.warn('[activityService.getActivityLogs] Backend fallback:', err.message)
    }

    // Return stored local memory logs + default mock logs (deduplicated)
    try {
      const localLogs = JSON.parse(localStorage.getItem('citypet_activity_logs') || '[]')
      const combined = [...localLogs, ...initialLocalLogs]
      const seen = new Set()
      const deduplicated = combined.filter((item) => {
        const key = item.id || `${item.action}_${item.description}_${item.created_at}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      let filtered = deduplicated

      if (params.search) {
        const s = params.search.toLowerCase()
        filtered = filtered.filter(
          (l) =>
            l.user_name.toLowerCase().includes(s) ||
            l.description.toLowerCase().includes(s) ||
            l.action.toLowerCase().includes(s)
        )
      }

      if (params.action && params.action !== 'all') {
        filtered = filtered.filter((l) => l.action === params.action)
      }

      return filtered
    } catch (e) {
      return initialLocalLogs
    }
  },
}
