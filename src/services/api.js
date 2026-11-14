/**
 * City Pet Animal Hospital - API Service Layer
 * Connects Frontend UI directly to PHP/MySQL REST Backend (Actual Database Data Only)
 */

import { apiFetch } from '../config/api'
import {
  filterBrands,
  filterPetTypes,
  storeCategories,
} from '../data/storeData'

/* ============================================================
   1. AUTHENTICATION SERVICE (Email/Password, Registration & Google OAuth)
   ============================================================ */
async function finalizeAuthSession(result) {
  const session = await apiFetch('auth.php?action=session')
  if (!session?.user || session.user.id !== result?.user?.id) {
    throw new Error('Unable to establish your session. Please allow cookies and try signing in again.')
  }
  const mergedUser = {
    ...result.user,
    ...session.user,
    isNewCustomer: result.user?.isNewCustomer ?? false,
    addressLine1: result.user?.addressLine1 ?? '',
    addressLine2: result.user?.addressLine2 ?? '',
    city: result.user?.city ?? 'Colombo',
    district: result.user?.district ?? 'Colombo',
    postalCode: result.user?.postalCode ?? '',
  }
  return { ...result, user: mergedUser }
}

export const authService = {
  /**
   * Sign in with Email & Password
   */
  async login(email, password) {
    const result = await apiFetch('auth.php?action=login', {
      method: 'POST',
      body: { email, password },
    })
    return await finalizeAuthSession(result)
  },

  /**
   * Register a new User Account
   */
  async register({ name, email, phone, password }) {
    const result = await apiFetch('auth.php?action=register', {
      method: 'POST',
      body: { name, email, phone, password },
    })
    return await finalizeAuthSession(result)
  },

  /**
   * Sign in or Register with Google Account (ID Token or OAuth2 Access Token)
   */
  async googleLogin(payload) {
    const result = await apiFetch('auth.php?action=google', {
      method: 'POST',
      body: payload,
    })
    return await finalizeAuthSession(result)
  },

  /**
   * Get Session & Auth Config (including server-configured Google Client ID)
   */
  async getSession() {
    return await apiFetch('auth.php?action=session')
  },

  /**
   * Request OTP code
   */
  async sendOtp(identifier) {
    return await apiFetch('auth.php?action=send_otp', {
      method: 'POST',
      body: { identifier },
    })
  },

  /**
   * Verify OTP and Login
   */
  async verifyOtp(identifier, otp) {
    const result = await apiFetch('auth.php?action=verify_otp', {
      method: 'POST',
      body: { identifier, otp },
    })
    return await finalizeAuthSession(result)
  },

  /**
   * Verify Current Session
   */
  async getMe(userId) {
    return await apiFetch(`auth.php?action=me&user_id=${encodeURIComponent(userId)}`)
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
      return res.products || (Array.isArray(res) ? res : [])
    } catch (err) {
      console.warn('[productService.getProducts] Error loading products:', err.message)
      return []
    }
  },

  /**
   * Get Single Product Details by ID
   */
  async getProductById(id) {
    return await apiFetch(`products.php?id=${encodeURIComponent(id)}`)
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
      console.warn('[categoryService.getCategories] Error loading categories:', err.message)
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
      console.warn('[orderService.getUserOrders] Error loading orders:', err.message)
      return []
    }
  },

  /**
   * Admin: Get All Orders
   */
  async getAllOrders(status = '') {
    try {
      const qs = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''
      const res = await apiFetch(`orders.php${qs}`)
      return res.orders || (Array.isArray(res) ? res : [])
    } catch (err) {
      console.warn('[orderService.getAllOrders] Error loading orders:', err.message)
      return []
    }
  },

  async getDeliverySettings({ includeDisabled = false } = {}) {
    try {
      const qs = includeDisabled ? '?all=1' : ''
      const res = await apiFetch(`delivery_settings.php${qs}`)
      return res.methods || []
    } catch (err) {
      console.warn('[orderService.getDeliverySettings] Error loading delivery settings:', err.message)
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
    return await apiFetch(`orders.php?track=${encodeURIComponent(query)}`)
  },

  /**
   * Admin: Update Order Status
   */
  async updateOrderStatus(orderId, status) {
    return await apiFetch('orders.php', {
      method: 'PUT',
      body: { orderId, status },
    })
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
    if (fileOrBase64 instanceof File) {
      const fd = new FormData()
      fd.append('slip', fileOrBase64)
      return await apiFetch('upload_slip.php', {
        method: 'POST',
        body: fd,
      })
    }
    return await apiFetch('upload_slip.php', {
      method: 'POST',
      body: { base64Data: fileOrBase64 },
    })
  },

  /**
   * Generate PayHere Checkout Security Hash
   */
  async getPayHereHash(orderId, amount, currency = 'LKR') {
    return await apiFetch('payhere.php', {
      method: 'POST',
      body: { orderId, amount, currency },
    })
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
      console.warn('[profileService.getProfile] Error loading profile:', err.message)
      return null
    }
  },

  async updateProfile(data) {
    return await apiFetch('profile.php', {
      method: 'PUT',
      body: data,
    })
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
      console.warn('[petService.getPets] Error loading pets:', err.message)
      return []
    }
  },

  async createPet(petData) {
    return await apiFetch('pets.php', {
      method: 'POST',
      body: petData,
    })
  },

  async updatePet(petId, petData) {
    return await apiFetch(`pets.php?id=${encodeURIComponent(petId)}`, {
      method: 'PUT',
      body: { ...petData, id: petId },
    })
  },

  async deletePet(petId) {
    return await apiFetch(`pets.php?id=${encodeURIComponent(petId)}`, {
      method: 'DELETE',
      body: { id: petId },
    })
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
      console.warn('[adminService.getDashboardStats] Error loading dashboard stats:', err.message)
      return {
        kpis: {
          totalRevenue: 0,
          revenueGrowth: '0%',
          totalOrders: 0,
          ordersGrowth: '0%',
          pendingOrders: 0,
          totalProducts: 0,
          totalCustomers: 0,
          totalPatients: 0,
          lowStockCount: 0,
          patientGrowth: '0%',
        },
        salesChart: [],
        recentOrders: [],
        topProducts: [],
        lowStockAlerts: [],
        recentPatients: [],
        lastUpdated: 'Just now',
      }
    }
  },
}

/* ============================================================
   8. USER & ADMIN ACTIVITY AUDIT LOG SERVICE
   ============================================================ */
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

    if (sig === lastActivitySignature && now - lastActivityTime < 2500) {
      return null
    }
    lastActivitySignature = sig
    lastActivityTime = now

    const entry = {
      id: 'log-' + now + '-' + Math.floor(Math.random() * 1000),
      user_id: payload.userId || 'adm-001',
      user_name: payload.userName || 'Administrator',
      role: payload.role || 'admin',
      action,
      description,
      entity_type: payload.entityType || 'system',
      entity_id: payload.entityId || null,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }

    try {
      await apiFetch('activity_logs.php', {
        method: 'POST',
        body: entry,
      })
    } catch (err) {
      console.warn('[activityService.logActivity] Error logging activity:', err.message)
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
      return Array.isArray(res?.logs) ? res.logs : (Array.isArray(res) ? res : [])
    } catch (err) {
      console.warn('[activityService.getActivityLogs] Error loading activity logs:', err.message)
      return []
    }
  },
}
