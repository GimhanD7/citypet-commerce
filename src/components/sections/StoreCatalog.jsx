import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Grid,
  Heart,
  HelpCircle,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
  X,
} from 'lucide-react'
import {
  filterBrands,
  filterCategories,
  filterPetTypes,
  storeProducts,
} from '../../data/storeData'
import { productService } from '../../services/api'
import ProductVisual from '../common/ProductVisual'
import catalogHeaderPets from '../../assets/catalog-header-pets.jpg'
import catalogBrandsPets from '../../assets/catalog-brands-pets.jpg'

export default function StoreCatalog({
  initialCategory = 'all',
  initialPetType = 'dogs',
  onAddToCart,
  onNavigate,
  onSelectProduct,
}) {
  const [productsList, setProductsList] = useState(storeProducts)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    async function fetchCatalog() {
      setLoading(true)
      try {
        const data = await productService.getProducts()
        if (mounted && Array.isArray(data) && data.length > 0) {
          setProductsList(data)
        }
      } catch (e) {
        console.warn('Error loading products from API:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchCatalog()

    const onUpdate = (e) => {
      if (e.detail?.productId) {
        setProductsList((prev) =>
          prev.map((p) =>
            p.id === e.detail.productId
              ? {
                  ...p,
                  stockCount: e.detail.stockCount !== undefined ? e.detail.stockCount : p.stockCount,
                  inStock: e.detail.inStock !== undefined ? e.detail.inStock : p.inStock,
                }
              : p
          )
        )
      }
      fetchCatalog()
    }
    window.addEventListener('citypet_products_updated', onUpdate)

    return () => {
      mounted = false
      window.removeEventListener('citypet_products_updated', onUpdate)
    }
  }, [])

  // Filter states matching the reference design
  const [selectedPetTypes, setSelectedPetTypes] = useState(() => {
    return initialPetType && initialPetType !== 'all' ? [initialPetType] : ['dogs']
  })
  const [selectedCategories, setSelectedCategories] = useState(() => {
    return initialCategory && initialCategory !== 'all' ? [initialCategory] : []
  })
  const [selectedBrands, setSelectedBrands] = useState([])
  const [priceRange, setPriceRange] = useState([0, 25000])
  const [inStockOnly, setInStockOnly] = useState(true)
  const [outOfStock, setOutOfStock] = useState(false)

  // Search & Sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  // Sidebar accordions collapse state
  const [openSections, setOpenSections] = useState({
    petType: true,
    category: true,
    brand: true,
    price: true,
    availability: true,
  })

  // Mobile filter drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Show more brands toggle
  const [showMoreBrands, setShowMoreBrands] = useState(false)

  // Wishlist & Add to cart animation tracking
  const [wishlist, setWishlist] = useState({})
  const [addedAnimation, setAddedAnimation] = useState({})

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleWishlist = (id) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleAddToCart = (product) => {
    onAddToCart(product)
    setAddedAnimation((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [product.id]: false }))
    }, 1200)
  }

  const togglePetType = (id) => {
    setSelectedPetTypes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleBrand = (brandName) => {
    setSelectedBrands((prev) =>
      prev.includes(brandName)
        ? prev.filter((b) => b !== brandName)
        : [...prev, brandName]
    )
  }

  const clearAllFilters = () => {
    setSelectedPetTypes([])
    setSelectedCategories([])
    setSelectedBrands([])
    setPriceRange([0, 25000])
    setInStockOnly(false)
    setOutOfStock(false)
    setSearchQuery('')
    setSortBy('featured')
  }

  // Filter & Sort Logic matching reference UI
  const filteredProducts = useMemo(() => {
    let list = [...productsList]

    // Pet Type filter
    if (selectedPetTypes.length > 0) {
      list = list.filter((p) => selectedPetTypes.includes(p.petType))
    }

    // Category filter
    if (selectedCategories.length > 0) {
      list = list.filter((p) => selectedCategories.includes(p.category))
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      list = list.filter((p) => selectedBrands.includes(p.brand))
    }

    // Price range filter
    list = list.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    )

    // Stock availability filter
    if (inStockOnly && !outOfStock) {
      list = list.filter((p) => p.inStock)
    } else if (!inStockOnly && outOfStock) {
      list = list.filter((p) => !p.inStock)
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (p) =>
          String(p.name || '').toLowerCase().includes(q) ||
          String(p.brand || '').toLowerCase().includes(q) ||
          String(p.category || '').toLowerCase().includes(q) ||
          (p.description && String(Array.isArray(p.description) ? p.description.join(' ') : p.description).toLowerCase().includes(q))
      )
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        list.sort((a, b) => (b.badge === 'New' ? 1 : 0) - (a.badge === 'New' ? 1 : 0))
        break
      default:
        // 'featured' maintains natural array order
        break
    }

    return list
  }, [
    selectedPetTypes,
    selectedCategories,
    selectedBrands,
    priceRange,
    inStockOnly,
    outOfStock,
    searchQuery,
    sortBy,
  ])

  const visibleBrands = showMoreBrands ? filterBrands : filterBrands.slice(0, 5)

  const activeFiltersCount =
    selectedPetTypes.length +
    selectedCategories.length +
    selectedBrands.length +
    (priceRange[1] < 25000 || priceRange[0] > 0 ? 1 : 0) +
    (outOfStock ? 1 : 0)

  return (
    <div className="catalog-page">
      <div className="container catalog-container">
        {/* Breadcrumbs */}
        <nav className="catalog-breadcrumbs" aria-label="Breadcrumb">
          <button
            className="breadcrumb-link"
            onClick={() => onNavigate && onNavigate('home')}
          >
            Home
          </button>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <button
            className="breadcrumb-link current"
            onClick={() => onNavigate && onNavigate('store')}
          >
            Store
          </button>
        </nav>

        {/* Hero Header Section */}
        <header className="catalog-header-banner">
          <div className="catalog-header-text">
            <h1 className="catalog-main-title">Shop for your pet</h1>
            <p className="catalog-main-subtitle">
              Premium pet products, trusted brands and vet-approved essentials, all in one caring place.
            </p>
          </div>

          <div className="catalog-header-visual">
            <img
              src={catalogHeaderPets}
              alt="Happy golden dog and cat together"
              className="catalog-header-img"
            />
            {/* Script Text: Healthy pets happier tomorrows ♡ */}
            <div className="catalog-header-script">
              <span>Healthy pets</span>
              <span>happier tomorrows. <span className="script-heart">♡</span></span>
            </div>

            {/* Pill Badge: Same love. Better lives. */}
            <div className="catalog-header-pill-badge">
              <span>Same</span>
              <span>love. Better</span>
              <span>lives.</span>
            </div>
          </div>
        </header>

        {/* 4 Trust Value Proposition Badges */}
        <section className="catalog-trust-strip">
          <div className="catalog-trust-pill">
            <span className="trust-pill-icon">
              <ShieldCheck size={18} />
            </span>
            <span className="trust-pill-text">Vet recommended products</span>
          </div>
          <div className="catalog-trust-pill">
            <span className="trust-pill-icon">
              <Sparkles size={18} />
            </span>
            <span className="trust-pill-text">100% genuine brands</span>
          </div>
          <div className="catalog-trust-pill">
            <span className="trust-pill-icon">
              <Truck size={18} />
            </span>
            <span className="trust-pill-text">Islandwide delivery</span>
          </div>
          <div className="catalog-trust-pill">
            <span className="trust-pill-icon">
              <Heart size={18} />
            </span>
            <span className="trust-pill-text">Caring for pets, building healthier tomorrows.</span>
          </div>
        </section>

        {/* Main 2-Column Catalog Layout */}
        <div className="catalog-main-layout">
          {/* Mobile Overlay */}
          {mobileFiltersOpen && (
            <div
              className="catalog-mobile-overlay"
              onClick={() => setMobileFiltersOpen(false)}
            />
          )}

          {/* ========================================================
              LEFT COLUMN: Filter Products Sidebar
             ======================================================== */}
          <aside className={`catalog-sidebar ${mobileFiltersOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
              <h2 className="sidebar-heading">Filter Products</h2>
              <div className="sidebar-header-actions">
                <button className="sidebar-clear-btn" onClick={clearAllFilters}>
                  Clear All
                </button>
                <button
                  type="button"
                  className="sidebar-mobile-close-btn"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Accordion 1: Pet Type */}
            <div className="filter-group">
              <button
                className="filter-group-header"
                onClick={() => toggleSection('petType')}
              >
                <span>Pet Type</span>
                {openSections.petType ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections.petType && (
                <div className="filter-group-content">
                  {filterPetTypes.map((pt) => {
                    const isChecked = selectedPetTypes.includes(pt.id)
                    return (
                      <label key={pt.id} className="filter-checkbox-row">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePetType(pt.id)}
                        />
                        <span className="custom-checkbox" />
                        <span className="filter-label-text">
                          {pt.name} <span className="filter-item-count">({pt.count})</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Accordion 2: Category */}
            <div className="filter-group">
              <button
                className="filter-group-header"
                onClick={() => toggleSection('category')}
              >
                <span>Category</span>
                {openSections.category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections.category && (
                <div className="filter-group-content">
                  {filterCategories.map((cat) => {
                    const isChecked = selectedCategories.includes(cat.id)
                    return (
                      <label key={cat.id} className="filter-checkbox-row">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat.id)}
                        />
                        <span className="custom-checkbox" />
                        <span className="filter-label-text">
                          {cat.name} <span className="filter-item-count">({cat.count})</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Accordion 3: Brand */}
            <div className="filter-group">
              <button
                className="filter-group-header"
                onClick={() => toggleSection('brand')}
              >
                <span>Brand</span>
                {openSections.brand ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections.brand && (
                <div className="filter-group-content">
                  {visibleBrands.map((b) => {
                    const isChecked = selectedBrands.includes(b.id)
                    return (
                      <label key={b.id} className="filter-checkbox-row">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBrand(b.id)}
                        />
                        <span className="custom-checkbox" />
                        <span className="filter-label-text">
                          {b.name} <span className="filter-item-count">({b.count})</span>
                        </span>
                      </label>
                    )
                  })}
                  {filterBrands.length > 5 && (
                    <button
                      className="filter-show-more-btn"
                      onClick={() => setShowMoreBrands(!showMoreBrands)}
                    >
                      {showMoreBrands ? 'Show less ∧' : 'Show more ∨'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 4: Price Range */}
            <div className="filter-group">
              <button
                className="filter-group-header"
                onClick={() => toggleSection('price')}
              >
                <span>Price Range</span>
                {openSections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections.price && (
                <div className="filter-group-content">
                  <div className="price-slider-track">
                    <input
                      type="range"
                      min="0"
                      max="25000"
                      step="250"
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], Number(e.target.value)])
                      }
                      className="price-slider-input"
                    />
                  </div>
                  <div className="price-range-label">
                    LKR {priceRange[0].toLocaleString()} - LKR {priceRange[1].toLocaleString()}
                  </div>
                  <div className="price-inputs-row">
                    <div className="price-input-box">
                      <span className="price-prefix">LKR</span>
                      <input
                        type="number"
                        min="0"
                        max="25000"
                        value={priceRange[0]}
                        onChange={(e) =>
                          setPriceRange([Number(e.target.value) || 0, priceRange[1]])
                        }
                      />
                    </div>
                    <div className="price-input-box">
                      <span className="price-prefix">LKR</span>
                      <input
                        type="number"
                        min="0"
                        max="25000"
                        value={priceRange[1]}
                        onChange={(e) =>
                          setPriceRange([priceRange[0], Number(e.target.value) || 25000])
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 5: Availability */}
            <div className="filter-group">
              <button
                className="filter-group-header"
                onClick={() => toggleSection('availability')}
              >
                <span>Availability</span>
                {openSections.availability ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {openSections.availability && (
                <div className="filter-group-content">
                  <label className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                    />
                    <span className="custom-checkbox" />
                    <span className="filter-label-text">
                      In Stock <span className="filter-item-count">(132)</span>
                    </span>
                  </label>
                  <label className="filter-checkbox-row">
                    <input
                      type="checkbox"
                      checked={outOfStock}
                      onChange={(e) => setOutOfStock(e.target.checked)}
                    />
                    <span className="custom-checkbox" />
                    <span className="filter-label-text">
                      Out of Stock <span className="filter-item-count">(6)</span>
                    </span>
                  </label>
                </div>
              )}
            </div>
          </aside>

          {/* ========================================================
              RIGHT COLUMN: Brands Banner, Toolbar, & Product Grid
             ======================================================== */}
          <main className="catalog-content">
            {/* Trusted Brands Banner */}
            <div className="catalog-brands-banner">
              <div className="brands-banner-left">
                <h3 className="brands-banner-title">
                  Trusted brands <br />
                  for brighter, healthier lives.
                </h3>
                <p className="brands-banner-subtitle">Vet approved. Pet loved.</p>
                <button
                  className="brands-banner-btn"
                  onClick={() => {
                    setSelectedBrands([])
                    setShowMoreBrands(true)
                  }}
                >
                  <span>Shop All Brands</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Brand Logos Strip */}
              <div className="brands-banner-logos">
                <span className="brand-logo-pill rc-logo">ROYAL CANIN</span>
                <span className="brand-logo-pill hills-logo">Hill's</span>
                <span className="brand-logo-pill vets-logo">
                  <span className="vets-cross">✚</span> Vet's Best
                </span>
                <span className="brand-logo-pill kong-logo">KONG</span>
              </div>

              {/* Banner Pets Graphic */}
              <div className="brands-banner-visual">
                <div className="brands-script-wrap">
                  <span className="brands-script-text">Good Pets</span>
                  <span className="brands-script-text">Great Days <span className="script-heart">♡</span></span>
                </div>
                <img
                  src={catalogBrandsPets}
                  alt="Dog and cat looking up cheerfully"
                  className="brands-banner-pets-img"
                />
              </div>
            </div>

            {/* Search & Sort Toolbar */}
            <div className="catalog-toolbar">
              <button
                type="button"
                className="catalog-mobile-filter-trigger"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal size={16} />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="mobile-filter-count-pill">{activeFiltersCount}</span>
                )}
              </button>

              <div className="catalog-search-box">
                <Search size={18} className="search-icon-inside" />
                <input
                  type="text"
                  placeholder="Search for products, brands or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="catalog-search-input"
                />
                {searchQuery && (
                  <button
                    className="catalog-search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <div className="catalog-sort-box">
                <span className="sort-label">Sort by</span>
                <div className="sort-select-wrapper">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="catalog-sort-select"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                    <option value="newest">New Arrivals</option>
                  </select>
                  <ChevronDown size={15} className="sort-select-arrow" />
                </div>
              </div>
            </div>

            {/* Results Count & View Toggle */}
            <div className="catalog-results-bar">
              <span className="catalog-count-text">
                Showing 1 – {Math.min(filteredProducts.length, 8)} of {filteredProducts.length} products
              </span>

              <div className="catalog-view-switcher">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {/* Product Grid / List */}
            {filteredProducts.length === 0 ? (
              <div className="catalog-empty-state">
                <div className="empty-icon-wrap">
                  <Search size={36} />
                </div>
                <h3>No products match your filters</h3>
                <p>Try resetting some filters or searching for something else.</p>
                <button className="button button-primary" onClick={clearAllFilters}>
                  <RotateCcw size={16} /> Reset All Filters
                </button>
              </div>
            ) : (
              <div className={`catalog-products-${viewMode}`}>
                {filteredProducts.map((product) => {
                  const isWishlisted = !!wishlist[product.id]
                  const isJustAdded = !!addedAnimation[product.id]
                  const stockCount = product.stockCount !== undefined ? product.stockCount : (product.inStock ? 15 : 0)
                  const isLow = stockCount > 0 && stockCount <= 5
                  const isOut = stockCount === 0 || !product.inStock

                  return (
                    <article
                      className="catalog-product-card clickable-product-card"
                      key={product.id}
                      onClick={() => onSelectProduct && onSelectProduct(product)}
                    >
                      <div className="catalog-card-header">
                        {product.badge ? (
                          <span
                            className={`catalog-badge ${
                              product.badge === 'Best Seller'
                                ? 'badge-bestseller'
                                : product.badge === 'Vet Pick'
                                ? 'badge-vetpick'
                                : product.badge === 'New'
                                ? 'badge-new'
                                : 'badge-default'
                            }`}
                          >
                            {product.badge}
                          </span>
                        ) : (
                          <span className="catalog-badge-placeholder" />
                        )}

                        <button
                          className={`catalog-wishlist-btn ${isWishlisted ? 'liked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleWishlist(product.id)
                          }}
                          aria-label={`Save ${product.name} to wishlist`}
                        >
                          <Heart
                            size={16}
                            fill={isWishlisted ? '#ed7f72' : 'none'}
                            color={isWishlisted ? '#ed7f72' : '#8fa8a5'}
                          />
                        </button>
                      </div>

                      {/* Product Visual */}
                      <div className="catalog-card-image-wrap">
                        <ProductVisual type={product.imageType} name={product.name} />
                      </div>

                      {/* Product Info */}
                      <div className="catalog-card-body">
                        <h4 className="catalog-card-title">{product.name}</h4>

                        {/* Star Ratings & Inventory Pill Row */}
                        <div className="catalog-rating-row">
                          <div className="catalog-stars">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={13}
                                fill={i < Math.floor(product.rating) ? '#f59e0b' : 'none'}
                                color="#f59e0b"
                              />
                            ))}
                          </div>
                          <span className="catalog-review-count">({product.reviews})</span>
                        </div>

                        {/* Live Inventory Stock Badge */}
                        <div className={`catalog-inventory-badge ${isOut ? 'out' : isLow ? 'low' : 'available'}`}>
                          <span className="inventory-dot-pulse" />
                          <span className="inventory-text">
                            {isOut ? 'Out of Stock' : isLow ? `Low Stock (${stockCount} left)` : `In Stock (${stockCount} available)`}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="catalog-price-row">
                          <strong className="catalog-main-price">
                            LKR {product.price.toLocaleString()}
                          </strong>
                          {product.originalPrice && (
                            <span className="catalog-orig-price">
                              LKR {product.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          className={`catalog-add-btn ${isJustAdded ? 'just-added' : ''} ${isOut ? 'disabled' : ''}`}
                          disabled={isOut}
                          title={isOut ? 'Out of Stock' : 'Add to Cart'}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isOut) return
                            handleAddToCart(product)
                          }}
                        >
                          {isOut ? (
                            <>
                              <X size={15} /> Out of Stock
                            </>
                          ) : isJustAdded ? (
                            <>
                              <Check size={16} /> Added!
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={16} /> Add to Cart
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
