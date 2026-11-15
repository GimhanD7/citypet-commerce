import React, { useEffect, useState, useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'

// Data & Services
import { storeProducts } from '../../data/storeData'
import { adminService, productService } from '../../services/api'
import {
  defaultPatients,
  defaultRecentOrders,
} from './data/adminMockData'

// Modular Components
import AdminHeader from './AdminHeader'
import AdminSidebar from './AdminSidebar'
import AddProductModal from './modals/AddProductModal'
import ImportProductsModal from './modals/ImportProductsModal'
import CreateOrderModal from './modals/CreateOrderModal'
import GenerateReportModal from './modals/GenerateReportModal'
import ActivityLogsView from './views/ActivityLogsView'
import CategoriesView from './views/CategoriesView'
import UsersView from './views/UsersView'
import DashboardOverview from './views/DashboardOverview'
import GenericSubView from './views/GenericSubView'
import ProductsManagement from './views/ProductsManagement'
import ReviewsView from './views/ReviewsView'
import OrdersView from './views/OrdersView'
import PaymentsView from './views/PaymentsView'
import ReportsView from './views/ReportsView'
import SettingsView from './views/SettingsView'
import { activityService } from '../../services/api'

export default function AdminDashboard({ onNavigate, onLogout, authUser }) {
  // Navigation & View States
  // Restore the last-visited admin tab on mount (survives page refresh)
  const [activeTab, setActiveTabRaw] = useState(() => {
    try {
      const savedTab = localStorage.getItem('citypet_admin_tab')
      return savedTab === 'customers' ? 'users' : savedTab || 'dashboard'
    } catch {
      return 'dashboard'
    }
  })

  // Wrap setActiveTab so every navigation persists the tab key
  const setActiveTab = (tab) => {
    try { localStorage.setItem('citypet_admin_tab', tab) } catch { /* ignore */ }
    setActiveTabRaw(tab)
  }
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [dateRange, setDateRange] = useState('Apr 1, 2024 - Apr 30, 2024')
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  // Products Management State
  const [orderRevision, setOrderRevision] = useState(0)
  const [adminProducts, setAdminProducts] = useState(storeProducts)
  const [productSearch, setProductSearch] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForm, setProductForm] = useState({
    name: '',
    brand: 'City Pet',
    category: 'food',
    petType: 'dogs',
    price: '',
    originalPrice: '',
    inStock: true,
    stockCount: 15,
    stockLocation: 'Colombo 07 Central Pharmacy',
    shortDescription: '',
    description: '',
    ingredients: '',
    additives: '',
    analysis: [],
    feedingGuide: [],
    tags: '',
    sizes: [],
    mainImage: '',
    gallery: [],
    imageType: 'royal-canin-dog',
  })

  // Modals State
  const [activeModal, setActiveModal] = useState(null) // 'addProduct' | 'createOrder' | 'generateReport' | null

  // Notification Toast State
  const [notificationToast, setNotificationToast] = useState(null)

  const showToast = (msg) => {
    setNotificationToast(msg)
    setTimeout(() => setNotificationToast(null), 3500)
  }

  // Orders & Clinical Patients States
  const [recentOrders, setRecentOrders] = useState(defaultRecentOrders)
  const [recentPatients, setRecentPatients] = useState(defaultPatients)
  const [dashboardStats, setDashboardStats] = useState(null)
  const stockUpdateInFlight = useRef(new Set())

  // Quick Stock Quantity Increment/Decrement Handler (supports variant-level restocking)
  const handleUpdateStockCount = async (productId, changeQty, variantIndex = null) => {
    const lockKey = productId
    if (stockUpdateInFlight.current.has(lockKey)) {
      console.warn(`[handleUpdateStockCount] Ignored duplicate stock update for ${lockKey}`)
      return
    }
    const target = adminProducts.find((p) => p.id === productId)
    if (!target) return
    stockUpdateInFlight.current.add(lockKey)

    let newCount = 0
    let updatedSizes = target.sizes ? [...target.sizes] : []
    let variantName = ''

    if (variantIndex !== null && variantIndex !== undefined && updatedSizes[variantIndex]) {
      const currentVariant = updatedSizes[variantIndex]
      variantName = currentVariant.size || `Variant #${variantIndex + 1}`
      const currentVariantQty = currentVariant.stockCount !== undefined ? currentVariant.stockCount : 0
      const newVariantQty = Math.max(0, Number(currentVariantQty) + changeQty)
      updatedSizes[variantIndex] = {
        ...currentVariant,
        stockCount: newVariantQty,
      }
      newCount = updatedSizes.reduce((s, item) => s + (parseInt(item.stockCount, 10) || 0), 0)
    } else {
      const currentCount = target.stockCount !== undefined ? target.stockCount : (target.inStock ? 15 : 0)
      newCount = Math.max(0, Number(currentCount) + changeQty)
    }

    const newInStock = newCount > 0

    // Persist the stock change before updating the visible inventory.
    try {
      const putPayload = {
        inStock: newInStock,
        stockCount: newCount,
      }
      if (updatedSizes.length > 0) {
        putPayload.sizes = updatedSizes
      }
      await productService.updateProduct(productId, putPayload)
    } catch (err) {
      showToast(err.message || 'Unable to update stock.')
      return
    } finally {
      stockUpdateInFlight.current.delete(lockKey)
    }
    setAdminProducts((products) => products.map((product) => product.id === productId
      ? { ...product, stockCount: newCount, inStock: newInStock, sizes: updatedSizes }
      : product))

    // 3. Log Activity
    const desc = variantName
      ? `Restocked size variant "${variantName}" for product "${target.name}" (SKU: ${target.id}) by +${changeQty} units (Total product stock: ${newCount} units).`
      : `Adjusted inventory stock for product "${target.name}" (SKU: ${target.id}) to ${newCount} units.`

    activityService.logActivity({
      action: 'STOCK_UPDATE',
      description: desc,
      entityType: 'inventory',
      entityId: target.id,
    })

    // 4. Dispatch global real-time event so customer side (PDP, Catalog, Store) updates immediately
    window.dispatchEvent(
      new CustomEvent('citypet_products_updated', {
        detail: {
          productId,
          stockCount: newCount,
          inStock: newInStock,
          sizes: updatedSizes,
        },
      })
    )

    const toastMsg = variantName
      ? `Restocked ${variantName}: now has ${updatedSizes[variantIndex]?.stockCount || 0} units (Total: ${newCount} units)!`
      : `Inventory restocked: "${target.name}" is now ${newCount} units (${newInStock ? 'In Stock' : 'Out of Stock'})!`

    showToast(toastMsg)
    return true
  }

  // Load Products from API
  useEffect(() => {
    let mounted = true
    async function fetchProducts() {
      try {
        const products = await productService.getAllProducts()
        if (mounted) setAdminProducts(products)
      } catch (err) {
        console.warn('Failed to load products for admin:', err)
      }
    }
    fetchProducts()
    return () => {
      mounted = false
    }
  }, [])

  // Live Admin Dashboard Stats Fetching
  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const stats = await adminService.getDashboardStats()
        if (mounted && stats) {
          setDashboardStats(stats)
          setRecentOrders(Array.isArray(stats.recentOrders) ? stats.recentOrders : [])
          setRecentPatients(Array.isArray(stats.recentPatients) ? stats.recentPatients : [])
        }
      } catch (err) {
        console.warn('Admin dashboard fetch error:', err)
      }
    }
    loadStats()
    return () => {
      mounted = false
    }
  }, [activeTab, orderRevision])

  // Product CRUD Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      brand: 'City Pet',
      category: 'food',
      petType: 'dogs',
      price: '',
      originalPrice: '',
      inStock: true,
      stockCount: 15,
      stockLocation: 'Colombo 07 Central Pharmacy',
      shortDescription: '',
      description: '',
      ingredients: '',
      additives: '',
      analysis: [],
      feedingGuide: [],
      tags: '',
      sizes: [],
      mainImage: '',
      gallery: [],
      imageType: 'royal-canin-dog',
    })
    setActiveModal('addProduct')
  }

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p)
    setProductForm({
      name: p.name || p.fullName || '',
      brand: p.brand || 'City Pet',
      category: p.category || 'food',
      petType: p.petType || 'dogs',
      price: p.price || '',
      originalPrice: p.originalPrice || '',
      inStock: p.inStock ?? true,
      stockCount: p.stockCount !== undefined ? p.stockCount : 15,
      stockLocation: p.stockLocation || 'Colombo 07 Central Pharmacy',
      shortDescription: p.shortDescription || '',
      description: Array.isArray(p.description) ? p.description.join('\n\n') : p.description || '',
      ingredients: p.ingredients?.composition || (typeof p.ingredients === 'string' ? p.ingredients : ''),
      additives: p.ingredients?.additives || '',
      analysis: Array.isArray(p.ingredients?.analysis)
        ? p.ingredients.analysis.map((row) => ({ nutrient: row.nutrient || '', value: row.value || '' }))
        : [],
      feedingGuide: Array.isArray(p.feedingGuide)
        ? p.feedingGuide.map((row) => ({
            petSize: row.petSize || row.dogWeight || '',
            standardGuideline: row.standardGuideline || row.normalActivity || '',
            notesActivity: row.notesActivity || row.highActivity || '',
            dogWeight: row.petSize || row.dogWeight || '',
            normalActivity: row.standardGuideline || row.normalActivity || '',
            highActivity: row.notesActivity || row.highActivity || '',
          }))
        : [],
      tags: (p.tags || []).join('\n'),
      sizes: p.sizes || [],
      mainImage: p.mainImage || '',
      gallery: p.gallery || [],
      imageType: p.imageType || 'royal-canin-dog',
    })
    setActiveModal('addProduct')
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    if (!productForm.name.trim() || !productForm.price) {
      showToast('Please provide a valid product name and price.')
      return
    }
    if (!editingProduct && !productForm.mainImage) {
      showToast('Please upload a main product image.')
      return
    }

    try {
      const payload = {
        ...productForm,
        fullName: productForm.name,
        inStock: (Number(productForm.stockCount) || 0) > 0,
        stockCount: Number(productForm.stockCount) || 0,
        reorderLevel: 5,
        mainImage: productForm.mainImage || '',
        gallery: productForm.gallery || [],
        ingredients: {
          composition: productForm.ingredients || '',
          additives: productForm.additives || '',
          analysis: Array.isArray(productForm.analysis)
            ? productForm.analysis.filter((row) => (row.nutrient || '').trim() || (row.value || '').trim())
            : [],
        },
        tags: (productForm.tags || '').split('\n').map((s) => s.trim()).filter(Boolean),
        sizes: (productForm.sizes || []).map((size, index) => ({
          ...size,
          size: (size.size || '').trim(),
          price: Number(size.price) || 0,
          stockCount: Math.max(0, parseInt(size.stockCount, 10) || 0),
          default: size.default !== undefined ? !!size.default : index === 0,
        })),
      }
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, payload)
        const savedProduct = await productService.getProductById(editingProduct.id)
        setAdminProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? savedProduct
              : p
          )
        )
        activityService.logActivity({
          action: 'PRODUCT_SAVE',
          description: `Updated store product details for "${productForm.name}" (SKU: ${editingProduct.id}).`,
          entityType: 'product',
          entityId: editingProduct.id,
        })
        window.dispatchEvent(
          new CustomEvent('citypet_products_updated', {
            detail: {
              productId: editingProduct.id,
              stockCount: payload.stockCount,
              inStock: payload.inStock,
              product: savedProduct,
            },
          })
        )
        showToast(`Product "${productForm.name}" updated successfully!`)
      } else {
        const res = await productService.createProduct(payload)
        const newProduct = await productService.getProductById(res.id)
        setAdminProducts((prev) => [newProduct, ...prev])
        activityService.logActivity({
          action: 'PRODUCT_ADD',
          description: `Created new hospital store product "${productForm.name}" for LKR ${productForm.price}.`,
          entityType: 'product',
          entityId: newProduct.id,
        })
        window.dispatchEvent(
          new CustomEvent('citypet_products_updated', {
            detail: {
              productId: res.id,
              product: newProduct,
            },
          })
        )
        showToast(`Product "${productForm.name}" added to hospital store!`)
      }
      setActiveModal(null)
      setEditingProduct(null)
    } catch (err) {
      showToast(err.message || 'Failed to save product.')
    }
  }

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from store catalog?`)) {
      return
    }
    try {
      await productService.deleteProduct(id)
      setAdminProducts((prev) => prev.filter((p) => p.id !== id))
      activityService.logActivity({
        action: 'PRODUCT_DELETE',
        description: `Deleted store product "${name}" (ID: ${id}) from catalog.`,
        entityType: 'product',
        entityId: id,
      })
      window.dispatchEvent(
        new CustomEvent('citypet_products_updated', {
          detail: {
            productId: id,
            deleted: true,
          },
        })
      )
      showToast(`Product "${name}" deleted from store.`)
    } catch (err) {
      showToast(err.message || 'Failed to delete product.')
    }
  }

  return (
    <div className="admin-dashboard-app">
      {/* Toast Notification Alert */}
      {notificationToast && (
        <div className="admin-toast-toast">
          <CheckCircle2 size={18} className="toast-icon" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Top Application Bar Header */}
      <AdminHeader
        mobileSidebarOpen={mobileSidebarOpen}
        setMobileSidebarOpen={setMobileSidebarOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateRange={dateRange}
        setDateRange={setDateRange}
        isDatePickerOpen={isDatePickerOpen}
        setIsDatePickerOpen={setIsDatePickerOpen}
        isNotificationsOpen={isNotificationsOpen}
        setIsNotificationsOpen={setIsNotificationsOpen}
        isProfileMenuOpen={isProfileMenuOpen}
        setIsProfileMenuOpen={setIsProfileMenuOpen}
        showToast={showToast}
        setActiveTab={setActiveTab}
        onNavigate={onNavigate}
        onLogout={onLogout}
        authUser={authUser}
      />

      {/* Main Admin Workspace (Sidebar + Dynamic Main View Canvas) */}
      <div className="admin-workspace-grid">
        {/* Mobile Sidebar Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div
            className="admin-mobile-overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Left Navigation Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        {/* Main Content Area Canvas */}
        <main className="admin-main-canvas">
          {activeTab === 'dashboard' ? (
            <DashboardOverview
              dashboardStats={dashboardStats}
              recentOrders={recentOrders}
              recentPatients={recentPatients}
              setActiveTab={setActiveTab}
              setActiveModal={setActiveModal}
              showToast={showToast}
            />
          ) : activeTab === 'products' ? (
            <ProductsManagement
              adminProducts={adminProducts}
              productSearch={productSearch}
              setProductSearch={setProductSearch}
              productCategoryFilter={productCategoryFilter}
              setProductCategoryFilter={setProductCategoryFilter}
              handleOpenAddProduct={handleOpenAddProduct}
              handleOpenImportProducts={() => setActiveModal('importProducts')}
              handleOpenEditProduct={handleOpenEditProduct}
              handleDeleteProduct={handleDeleteProduct}
              handleUpdateStockCount={handleUpdateStockCount}
            />
          ) : activeTab === 'orders' ? (
            <OrdersView
              key={orderRevision}
              onOpenCreateOrder={() => setActiveModal('createOrder')}
              showToast={showToast}
            />
          ) : activeTab === 'payments' ? (
            <PaymentsView showToast={showToast} />
          ) : activeTab === 'reports' ? (
            <ReportsView />
          ) : activeTab === 'activity' ? (
            <ActivityLogsView showToast={showToast} />
          ) : activeTab === 'categories' ? (
            <CategoriesView adminProducts={adminProducts} showToast={showToast} />
          ) : activeTab === 'reviews' ? (
            <ReviewsView adminProducts={adminProducts} showToast={showToast} />
          ) : activeTab === 'users' ? (
            <UsersView onSessionExpired={onLogout} />
          ) : activeTab === 'settings' || activeTab === 'sms' ? (
            <SettingsView
              initialTab={activeTab === 'sms' ? 'sms' : 'general'}
              adminProducts={adminProducts}
              setAdminProducts={setAdminProducts}
              showToast={showToast}
              setActiveTab={setActiveTab}
              authUser={authUser}
            />
          ) : (
            <GenericSubView
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {activeModal === 'addProduct' && (
        <AddProductModal
          editingProduct={editingProduct}
          productForm={productForm}
          setProductForm={setProductForm}
          handleSaveProduct={handleSaveProduct}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'importProducts' && (
        <ImportProductsModal
          onClose={() => setActiveModal(null)}
          onImported={(products) => {
            const addedIds = new Set(products.map(({ id }) => id))
            setAdminProducts((prev) => [...products, ...prev.filter(({ id }) => !addedIds.has(id))])
            window.dispatchEvent(new CustomEvent('citypet_products_updated'))
            activityService.logActivity({
              action: 'PRODUCT_ADD',
              description: `Imported ${products.length} products from Excel.`,
              entityType: 'product',
            })
          }}
        />
      )}

      {activeModal === 'createOrder' && (
        <CreateOrderModal
          products={adminProducts}
          onCreated={(order) => {
            setOrderRevision((revision) => revision + 1)
            setActiveModal(null)
            showToast('Order ' + order.orderNumber + ' created.')
          }}
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      )}

      {activeModal === 'generateReport' && (
        <GenerateReportModal
          onClose={() => setActiveModal(null)}
          showToast={showToast}
        />
      )}
    </div>
  )
}
