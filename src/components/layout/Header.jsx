import React, { useEffect, useState } from 'react'
import {
  Menu,
  Phone,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import Brand from '../common/Brand'

export default function Header({
  cartCount = 0,
  authUser = null,
  onOpenCart,
  onOpenSearch,
  onOpenAccount,
  activeView = 'home',
  onNavigate,
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      document.body.classList.toggle('scrolled', window.scrollY > 18)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNavClick = (view, anchorId) => {
    setMenuOpen(false)
    onNavigate(view, anchorId)
  }

  return (
    <header className="site-header">
      <div className="container nav-wrap store-nav-wrap">
        <Brand />

        {/* Center Navigation Links */}
        <nav className={`main-nav ${menuOpen ? 'open' : ''}`} aria-label="Primary navigation">
          <a
            href="#home"
            className={activeView === 'home' ? 'nav-active' : ''}
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('home', 'home')
            }}
          >
            Home
          </a>
          <a
            href="#doctors"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('home', 'doctors')
            }}
          >
            Doctors
          </a>
          <a
            href="#services"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('home', 'services')
            }}
          >
            Services
          </a>
          <a
            href="#store"
            className={`nav-link-store ${activeView === 'store' || activeView === 'catalog' ? 'nav-active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('store', 'store-page')
            }}
          >
            Store
          </a>
          <a
            href="#locations"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('home', 'locations')
            }}
          >
            Locations
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('home', 'contact')
            }}
          >
            Contact
          </a>

          {/* Mobile utility buttons inside dropdown */}
          <div className="mobile-nav-utilities">
            <button
              type="button"
              className="mobile-util-btn"
              onClick={() => {
                setMenuOpen(false)
                onOpenSearch()
              }}
            >
              <Search size={17} /> Search Products
            </button>
            <button
              type="button"
              className="mobile-util-btn"
              onClick={() => {
                setMenuOpen(false)
                handleNavClick('account')
              }}
            >
              <User size={17} /> {authUser ? (authUser.name || 'My Account') : 'Sign In / Account'}
            </button>
            <a
              className="mobile-call-btn"
              href="tel:+94718419273"
              onClick={() => setMenuOpen(false)}
            >
              <Phone size={17} /> (071) 841 9273
            </a>
          </div>
        </nav>

        {/* Right Utility Cluster: Search | Account | Cart | Hamburger */}
        <div className="header-utilities-cluster">
          <button
            type="button"
            className="header-icon-btn search-trigger-btn"
            onClick={onOpenSearch}
            aria-label="Open search"
            title="Search products"
          >
            <Search size={19} />
          </button>

          <button
            type="button"
            className={`header-account-btn ${activeView === 'account' || activeView === 'admin' ? 'account-nav-active' : ''} ${authUser ? 'user-logged-in' : ''}`}
            onClick={() => {
              if (onNavigate) {
                onNavigate('account')
              } else if (onOpenAccount) {
                onOpenAccount()
              }
            }}
            aria-label="Open account or login portal"
            title={authUser ? `Logged in as ${authUser.name}` : 'Sign In / Account'}
          >
            <User size={18} />
            <span className="account-btn-label">
              {authUser ? (authUser.name?.split(' ')[0] || 'Account') : 'Account'}
            </span>
            {authUser && <span className="auth-logged-dot" title="Active Session" />}
          </button>

          <span className="header-util-divider" aria-hidden="true" />

          <button
            type="button"
            className="header-cart-btn"
            onClick={onOpenCart}
            aria-label={`View Cart, ${cartCount} items`}
            title="View Cart"
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="cart-badge-pill">{cartCount}</span>}
          </button>

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}
