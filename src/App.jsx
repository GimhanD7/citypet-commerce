import React, { useEffect, useState } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import Hero from './components/sections/Hero'
import About from './components/sections/About'
import Doctors from './components/sections/Doctors'
import Services from './components/sections/Services'
import CarePromise from './components/sections/CarePromise'
import MobileAreas from './components/sections/MobileAreas'
import Locations from './components/sections/Locations'
import ContactCTA from './components/sections/ContactCTA'
import Store from './components/sections/Store'
import StoreCatalog from './components/sections/StoreCatalog'
import ProductDetail from './components/sections/ProductDetail'
import CustomerProfile from './components/sections/CustomerProfile'
import CheckoutPage from './components/sections/CheckoutPage'
import AdminLogin from './components/sections/AdminLogin'
import AdminDashboard from './components/admin/AdminDashboard'
import StoreTeaser from './components/sections/StoreTeaser'
import CartDrawer from './components/common/CartDrawer'
import SearchModal from './components/common/SearchModal'
import AccountModal from './components/common/AccountModal'
import CheckoutModal from './components/common/CheckoutModal'
import { storeProducts } from './data/storeData'
import { apiFetch } from './config/api'

const cartItemKey = (product) =>
  `${product?.id || ''}::${product?.selectedSize || product?.size || ''}`

function App() {
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionError, setSessionError] = useState('')
  useEffect(() => {
    let mounted = true
    apiFetch('auth.php?action=session')
      .then((data) => {
        if (mounted) setAuthUser(data?.user || null)
      })
      .catch(() => {
        if (mounted) {
          setAuthUser(null)
          setSessionError('Unable to check your login. Please sign in again.')
        }
      })
      .finally(() => { if (mounted) setSessionLoading(false) })
    return () => { mounted = false }
  }, [])
  const [activeView, setActiveView] = useState('home') // 'home' | 'store' | 'catalog' | 'product-detail' | 'account' | 'checkout' | 'admin' | 'login'
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('citypet_auth_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [selectedProduct, setSelectedProduct] = useState(() => {
    try {
      const hash = window.location.hash || ''
      const match = hash.match(/^#(?:product|pdp)(?:[/?]id=|\/)([^&?]+)/)
      const targetId = match ? decodeURIComponent(match[1]) : localStorage.getItem('citypet_selected_product_id')
      if (targetId) {
        const found = storeProducts.find((p) => p.id === targetId)
        if (found) return found
        const savedData = localStorage.getItem('citypet_selected_product_data')
        if (savedData) {
          const parsed = JSON.parse(savedData)
          if (parsed && parsed.id === targetId) return parsed
        }
        return { id: targetId, name: 'Pet Care Product', price: 0, inStock: true }
      }
    } catch {
      // ignore
    }
    return storeProducts[0]
  })
  const [catalogFilters, setCatalogFilters] = useState({ category: 'all', petType: 'dogs' })
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('citypet_cart')
      if (savedCart) return JSON.parse(savedCart)
    } catch {
      // ignore
    }
    // Initial 3 items as shown in design reference
    return [
      { product: storeProducts[0], quantity: 1 },
      { product: storeProducts[1], quantity: 1 },
      { product: storeProducts[2], quantity: 1 },
    ]
  })

  // Persist session and cart
  useEffect(() => {
    try {
      if (authUser) {
        localStorage.setItem('citypet_auth_user', JSON.stringify(authUser))
      } else {
        localStorage.removeItem('citypet_auth_user')
      }
    } catch {
      // ignore
    }
  }, [authUser])

  useEffect(() => {
    try {
      localStorage.setItem('citypet_cart', JSON.stringify(cartItems))
    } catch {
      // ignore
    }
  }, [cartItems])

  // Sync selectedProduct and cartItems when an item is restocked or updated in Admin
  useEffect(() => {
    let mounted = true

    async function syncCartWithLiveProducts() {
      try {
        const res = await apiFetch('products.php')
        const liveList = res?.products || (Array.isArray(res) ? res : [])
        if (!mounted || !liveList.length) return

        setCartItems((prevCart) => {
          let modified = false
          const refreshed = prevCart.map((item) => {
            const live = liveList.find((p) => p.id === item.product.id)
            if (live) {
              const liveCount = live.stockCount !== undefined ? Number(live.stockCount) : (live.inStock ? 15 : 0)
              const liveInStock = liveCount > 0
              if (
                item.product.stockCount !== liveCount ||
                item.product.inStock !== liveInStock ||
                item.product.price !== live.price
              ) {
                modified = true
                return {
                  ...item,
                  product: {
                    ...item.product,
                    ...live,
                    stockCount: liveCount,
                    inStock: liveInStock,
                  },
                }
              }
            }
            return item
          })
          return modified ? refreshed : prevCart
        })
      } catch (err) {
        // network/offline fallback
      }
    }

    syncCartWithLiveProducts()

    const handleProductSync = (e) => {
      const { productId, stockCount, inStock, product: updatedProd } = e.detail || {}
      if (!productId) return

      setSelectedProduct((prev) => {
        if (prev?.id === productId) {
          if (updatedProd) return updatedProd
          const newCount = stockCount !== undefined ? Number(stockCount) : prev.stockCount
          const newInStock = newCount > 0
          return { ...prev, stockCount: newCount, inStock: newInStock }
        }
        return prev
      })

      setCartItems((prev) =>
        prev.map((item) => {
          if (item.product.id === productId) {
            const newCount = stockCount !== undefined ? Number(stockCount) : item.product.stockCount
            const newInStock = newCount > 0
            return {
              ...item,
              product: {
                ...item.product,
                stockCount: newCount,
                inStock: newInStock,
              },
            }
          }
          return item
        })
      )

      syncCartWithLiveProducts()
    }

    window.addEventListener('citypet_products_updated', handleProductSync)
    return () => {
      mounted = false
      window.removeEventListener('citypet_products_updated', handleProductSync)
    }
  }, [])

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  // Handle hash changes if user navigates with direct URL anchors
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      const path = window.location.pathname
      if (hash === '#admin' || hash === '#portal' || path.endsWith('/admin')) {
        if (authUser?.role === 'admin') {
          setActiveView('admin')
        } else {
          setActiveView('login')
        }
      } else if (hash === '#login' || hash === '#signin' || hash === '#auth') {
        setActiveView('login')
      } else if (hash === '#store' || hash === '#store-page') {
        setActiveView('store')
      } else if (hash === '#catalog' || hash === '#shop') {
        setActiveView('catalog')
      } else if (hash.startsWith('#product') || hash.startsWith('#pdp')) {
        setActiveView('product-detail')
        const match = hash.match(/^#(?:product|pdp)(?:[/?]id=|\/)([^&?]+)/)
        const targetId = match ? decodeURIComponent(match[1]) : localStorage.getItem('citypet_selected_product_id')
        if (targetId) {
          try { localStorage.setItem('citypet_selected_product_id', targetId) } catch { /* ignore */ }
          setSelectedProduct((prev) => {
            if (prev?.id === targetId && prev?.price !== undefined) return prev
            const found = storeProducts.find((p) => p.id === targetId)
            if (found) return found
            try {
              const savedData = localStorage.getItem('citypet_selected_product_data')
              if (savedData) {
                const parsed = JSON.parse(savedData)
                if (parsed && parsed.id === targetId) return parsed
              }
            } catch { /* ignore */ }
            return { id: targetId, name: 'Pet Care Product', price: 0, inStock: true }
          })
        }
      } else if (hash === '#account' || hash === '#profile' || hash === '#dashboard') {
        if (authUser?.role === 'user') {
          setActiveView('account')
        } else if (authUser?.role === 'admin') {
          setActiveView('admin')
        } else {
          setActiveView('login')
        }
      } else if (hash === '#checkout' || hash === '#order') {
        setActiveView('checkout')
      } else {
        setActiveView('home')
      }
    }
    handleHash()
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [authUser])

  const handleLoginSuccess = (userData) => {
    setSessionError('')
    setAuthUser(userData)
    if (userData.role === 'admin') {
      setActiveView('admin')
      window.location.hash = '#admin'
    } else {
      setActiveView('account')
      window.location.hash = '#account'
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogout = () => {
    apiFetch('auth.php?action=logout', { method: 'POST', credentials: 'include' })
      .catch((err) => console.warn('Session logout failed:', err.message))
    setAuthUser(null)
    setActiveView('login')
    try { localStorage.removeItem('citypet_admin_tab') } catch { /* ignore */ }
    window.location.hash = '#login'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigate = (view, extra) => {
    if (view === 'login') {
      setActiveView('login')
      window.location.hash = '#login'
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (view === 'admin') {
      if (authUser?.role === 'admin') {
        setActiveView('admin')
        window.location.hash = '#admin'
      } else {
        setActiveView('login')
        window.location.hash = '#login'
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (view === 'checkout') {
      setActiveView('checkout')
      window.location.hash = '#checkout'
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (view === 'account') {
      if (authUser?.role === 'user') {
        setActiveView('account')
        window.location.hash = '#account'
      } else if (authUser?.role === 'admin') {
        setActiveView('admin')
        window.location.hash = '#admin'
      } else {
        setActiveView('login')
        window.location.hash = '#login'
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (view === 'catalog') {
      if (typeof extra === 'object' && extra !== null) {
        setCatalogFilters(extra)
      }
      setActiveView('catalog')
      window.location.hash = '#catalog'
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (view === 'product-detail') {
      const prod = extra || selectedProduct
      if (prod) {
        setSelectedProduct(prod)
        try {
          localStorage.setItem('citypet_selected_product_id', prod.id)
          localStorage.setItem('citypet_selected_product_data', JSON.stringify(prod))
        } catch { /* ignore */ }
        window.location.hash = `#product/${encodeURIComponent(prod.id)}`
      } else {
        window.location.hash = '#product'
      }
      setActiveView('product-detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setActiveView(view)
    if (typeof extra === 'string') {
      window.location.hash = `#${extra}`
      setTimeout(() => {
        const el = document.getElementById(extra)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 50)
    } else {
      window.location.hash = view === 'store' ? '#store' : ''
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSelectProduct = (product) => {
    if (!product) return
    setSelectedProduct(product)
    setActiveView('product-detail')
    try {
      localStorage.setItem('citypet_selected_product_id', product.id)
      localStorage.setItem('citypet_selected_product_data', JSON.stringify(product))
    } catch { /* ignore */ }
    window.location.hash = `#product/${encodeURIComponent(product.id)}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isProductOutOfStock = (product) => {
    if (!product) return true
    if (product.stockCount !== undefined && product.stockCount !== null && product.stockCount !== '') {
      return Number(product.stockCount) <= 0
    }
    return !product.inStock
  }

  const addToCart = (product, qty = 1) => {
    if (!product) return
    if (isProductOutOfStock(product)) {
      return
    }

    setCartItems((prev) => {
      const targetKey = cartItemKey(product)
      const existing = prev.find((item) => cartItemKey(item.product) === targetKey)
      if (existing) {
        return prev.map((item) =>
          cartItemKey(item.product) === targetKey
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      }
      return [{ product, quantity: qty }, ...prev]
    })
    setIsCartOpen(true)
  }

  const handleBuyNow = (product, qty = 1) => {
    if (!product) return
    if (isProductOutOfStock(product)) {
      return
    }

    addToCart(product, qty)
    handleNavigate('checkout')
  }

  const updateQty = (itemKey, newQty) => {
    if (newQty <= 0) {
      removeFromCart(itemKey)
      return
    }
    setCartItems((prev) =>
      prev.map((item) =>
        cartItemKey(item.product) === itemKey ? { ...item, quantity: newQty } : item
      )
    )
  }

  const removeFromCart = (itemKey) => {
    setCartItems((prev) => prev.filter((item) => cartItemKey(item.product) !== itemKey))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  // UNIFIED LOGIN VIEW (for both Normal Users and Admins)
  if (sessionLoading) {
    return <div className="admin-root-shell"><p role="status">Checking your session…</p></div>
  }

  if (activeView === 'login') {
    return (
      <div className="admin-root-shell">
        {sessionError && <p role="alert">{sessionError}</p>}
        <AdminLogin
          onNavigate={handleNavigate}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    )
  }

  // AUTHENTICATED ADMIN DASHBOARD VIEW
  if (activeView === 'admin') {
    return (
      <div className="admin-root-shell">
        <AdminDashboard
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          authUser={authUser}
        />
      </div>
    )
  }

  return (
    <div className="site-shell">
      {/* Dynamic Header */}
      <Header
        cartCount={totalCartCount}
        authUser={authUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        activeView={activeView}
        onNavigate={handleNavigate}
      />

      <main>
        {activeView === 'checkout' ? (
          /* Dedicated Complete Your Order Checkout Page matching reference screenshot */
          <CheckoutPage
            cartItems={cartItems}
            authUser={authUser}
            onUpdateQty={updateQty}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onNavigate={handleNavigate}
            onOpenCart={() => setIsCartOpen(true)}
            onCheckoutLogin={(user) => {
              setAuthUser(user)
            }}
          />
        ) : activeView === 'account' ? (
          /* Dedicated Customer Profile Dashboard Page */
          <CustomerProfile
            authUser={authUser}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onAddToCart={addToCart}
            onSelectProduct={handleSelectProduct}
          />
        ) : activeView === 'product-detail' ? (
          /* Dedicated Product Detail Page */
          <ProductDetail
            product={selectedProduct}
            authUser={authUser}
            onAddToCart={addToCart}
            onBuyNow={handleBuyNow}
            onNavigate={handleNavigate}
            onOpenAccount={() => setIsAccountOpen(true)}
            onSelectProduct={handleSelectProduct}
          />
        ) : activeView === 'catalog' ? (
          /* Dedicated Store Catalog / Filter Shop Page */
          <StoreCatalog
            initialCategory={catalogFilters.category}
            initialPetType={catalogFilters.petType}
            onAddToCart={addToCart}
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        ) : activeView === 'store' ? (
          /* Dedicated Store Landing Page */
          <Store
            onAddToCart={addToCart}
            onNavigateToCatalog={(params) => handleNavigate('catalog', params)}
            onSelectProduct={handleSelectProduct}
          />
        ) : (
          /* Main Hospital Home Page */
          <>
            <Hero />
            <About />
            <Doctors />
            <Services />
            {/* Store teaser on Home Page */}
            <StoreTeaser
              onNavigateToStore={() => handleNavigate('store', 'store-page')}
              onAddToCart={addToCart}
              onSelectProduct={handleSelectProduct}
            />
            <CarePromise />
            <MobileAreas />
            <Locations />
            <ContactCTA />
          </>
        )}
      </main>

      {/* Modern Store / Hospital Footer */}
      <Footer onNavigate={handleNavigate} authUser={authUser} />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={updateQty}
        onRemoveItem={removeFromCart}
        onOpenCheckout={() => {
          setIsCartOpen(false)
          handleNavigate('checkout')
        }}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onAddToCart={addToCart}
        onSelectProduct={handleSelectProduct}
      />

      {/* Customer Account Portal Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
      />

      {/* WhatsApp / Direct Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onClearCart={clearCart}
      />
    </div>
  )
}

export default App
