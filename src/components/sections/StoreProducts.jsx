import React, { useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Filter,
  Heart,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import { storeCategories, storeProducts as fallbackProducts } from '../../data/storeData'
import useStoreProducts from '../../services/useStoreProducts'
import ProductVisual from '../common/ProductVisual'

export default function StoreProducts({
  selectedCategory = 'all',
  onSelectCategory,
  onAddToCart,
  onViewAllProducts,
  onSelectProduct,
  savedItems = [],
  onToggleWishlist,
}) {
  const liveProducts = useStoreProducts()
  const products = useMemo(() => {
    return Array.isArray(liveProducts) && liveProducts.length > 0 ? liveProducts : fallbackProducts
  }, [liveProducts])

  // Local interaction states
  const [localWishlist, setLocalWishlist] = useState({})
  const [addedAnimation, setAddedAnimation] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPetType, setSelectedPetType] = useState('all')
  const [sortBy, setSortBy] = useState('featured')
  const [visibleCount, setVisibleCount] = useState(24)

  const isProductSaved = (id) => {
    if (savedItems && savedItems.length > 0) {
      return savedItems.some((item) => (item.id || item) === id)
    }
    return !!localWishlist[id]
  }

  const toggleWishlist = (product) => {
    if (onToggleWishlist) {
      onToggleWishlist(product)
    } else {
      setLocalWishlist((prev) => ({ ...prev, [product.id]: !prev[product.id] }))
    }
  }

  const handleAdd = (product) => {
    onAddToCart(product)
    setAddedAnimation((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [product.id]: false }))
    }, 1200)
  }

  // Filter & Search & Sort pipeline
  const filteredProducts = useMemo(() => {
    let list = [...products]

    // 1. Category Filter
    if (selectedCategory && selectedCategory !== 'all') {
      list = list.filter((p) => {
        const cat = p.category || p.category_id
        if (cat === selectedCategory) return true
        if (selectedCategory === 'foods' && (cat === 'food' || cat === 'treats')) return true
        if (selectedCategory === 'shampoo' && cat === 'grooming') return true
        if (selectedCategory === 'accessories' && cat === 'toys') return true
        return false
      })
    }

    // 2. Pet Type Filter
    if (selectedPetType && selectedPetType !== 'all') {
      list = list.filter((p) => {
        const pet = p.petType || p.pet_type
        if (pet === selectedPetType || pet === 'all') return true
        const lower = (p.name || '').toLowerCase()
        if (selectedPetType === 'dogs' && (lower.includes('dog') || lower.includes('puppy'))) return true
        if (selectedPetType === 'cats' && (lower.includes('cat') || lower.includes('kitten') || lower.includes('kitty'))) return true
        return false
      })
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((p) => {
        return (
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.id && p.id.toLowerCase().includes(q))
        )
      })
    }

    // 4. Sorting
    if (sortBy === 'price-low') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
    } else if (sortBy === 'rating') {
      list.sort((a, b) => Number(b.rating || 5) - Number(a.rating || 5))
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    return list
  }, [products, selectedCategory, selectedPetType, searchQuery, sortBy])

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount)
  }, [filteredProducts, visibleCount])

  const activeCategoryObj = storeCategories.find((c) => c.id === selectedCategory) || storeCategories[0]

  return (
    <section id="store-products" className="section modern-store-products-section">
      <div className="container">
        {/* Header & Title */}
        <div className="modern-store-header-box">
          <div className="modern-store-header-left">
            <span className="modern-store-eyebrow">
              <Sparkles size={13} style={{ display: 'inline', marginRight: '6px' }} />
              CITY PET INVENTORY
            </span>
            <h2 className="modern-store-title">
              {selectedCategory === 'all'
                ? 'All Products'
                : activeCategoryObj?.name || 'Selected Category'}
            </h2>
            <p className="modern-store-subtitle">
              Browse genuine veterinary essentials, premium foods, grooming shampoos & accessories.
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="modern-store-search-bar">
            <Search size={17} className="modern-store-search-icon" />
            <input
              type="text"
              placeholder="Search 600+ items (e.g. shampoo, collar, royal canin)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setVisibleCount(24)
              }}
              className="modern-store-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="modern-store-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Simplified Category Selector Pills */}
        <div className="modern-cat-pill-strip">
          {storeCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                className={`modern-cat-pill-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(cat.id)
                  }
                  setVisibleCount(24)
                }}
              >
                <span className="cat-pill-icon">{cat.icon}</span>
                <span className="cat-pill-title">{cat.name}</span>
                <span className="cat-pill-count">{cat.count}</span>
              </button>
            )
          })}
        </div>

        {/* Controls Bar: Pet Type Pills + Sort Dropdown */}
        <div className="modern-store-controls-bar">
          <div className="modern-pet-filter-pills">
            {[
              { id: 'all', label: 'All Pets' },
              { id: 'dogs', label: 'Dogs 🐶' },
              { id: 'cats', label: 'Cats 🐱' },
            ].map((pt) => (
              <button
                key={pt.id}
                type="button"
                className={`modern-pet-pill ${selectedPetType === pt.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedPetType(pt.id)
                  setVisibleCount(24)
                }}
              >
                {pt.label}
              </button>
            ))}
          </div>

          <div className="modern-store-right-controls">
            <span className="modern-store-results-stat">
              Showing <strong>{displayedProducts.length}</strong> of <strong>{filteredProducts.length}</strong> items
            </span>

            <div className="modern-store-sort-wrap">
              <label htmlFor="store-sort-select" className="modern-sort-label">Sort:</label>
              <select
                id="store-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="modern-store-sort-select"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(selectedCategory !== 'all' || selectedPetType !== 'all' || searchQuery) && (
          <div className="modern-active-chips-strip">
            <span className="active-chips-label">Active Filters:</span>
            {selectedCategory !== 'all' && (
              <span className="modern-filter-chip">
                Category: {activeCategoryObj?.name}
                <button type="button" onClick={() => onSelectCategory && onSelectCategory('all')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {selectedPetType !== 'all' && (
              <span className="modern-filter-chip">
                Pet: {selectedPetType}
                <button type="button" onClick={() => setSelectedPetType('all')}>
                  <X size={12} />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="modern-filter-chip">
                "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              </span>
            )}
            <button
              type="button"
              className="modern-clear-all-chips"
              onClick={() => {
                if (onSelectCategory) onSelectCategory('all')
                setSelectedPetType('all')
                setSearchQuery('')
                setVisibleCount(24)
              }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        {displayedProducts.length === 0 ? (
          <div className="modern-store-empty-state">
            <div className="empty-state-icon">🐾</div>
            <h3 className="empty-state-title">No products match your selection</h3>
            <p className="empty-state-text">
              Try adjusting your category, pet filter or search keywords.
            </p>
            <button
              type="button"
              className="button modern-empty-btn"
              onClick={() => {
                if (onSelectCategory) onSelectCategory('all')
                setSelectedPetType('all')
                setSearchQuery('')
              }}
            >
              <RotateCcw size={15} /> Show All Products
            </button>
          </div>
        ) : (
          <div className="modern-products-grid">
            {displayedProducts.map((product) => {
              const isWishlisted = isProductSaved(product.id)
              const isJustAdded = !!addedAnimation[product.id]
              const stockCount = product.stockCount !== undefined ? product.stockCount : 25
              const isOut = !product.inStock || stockCount === 0

              return (
                <article
                  className="modern-product-card"
                  key={product.id}
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                >
                  {/* Card Top: Badges & Wishlist */}
                  <div className="modern-card-top-bar">
                    <span className="modern-brand-tag">{product.brand || 'City Pet'}</span>
                    <button
                      type="button"
                      className={`modern-wishlist-btn ${isWishlisted ? 'liked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(product)
                      }}
                      aria-label="Add to wishlist"
                    >
                      <Heart
                        size={16}
                        fill={isWishlisted ? '#ef4444' : 'none'}
                        color={isWishlisted ? '#ef4444' : '#94a3b8'}
                      />
                    </button>
                  </div>

                  {/* Card Center: Visual */}
                  <div className="modern-card-visual-wrap">
                    <ProductVisual
                      type={product.imageType || product.category_id || product.category}
                      name={product.name}
                      category={product.category_id || product.category}
                    />
                    {product.badge && (
                      <span className="modern-card-promo-badge">{product.badge}</span>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className="modern-card-details">
                    <h3 className="modern-card-title" title={product.name}>
                      {product.name}
                    </h3>

                    {/* Rating & Review */}
                    <div className="modern-card-rating">
                      <div className="modern-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < Math.floor(product.rating || 5) ? '#f59e0b' : 'none'}
                            color="#f59e0b"
                          />
                        ))}
                      </div>
                      <span className="modern-review-text">({product.reviews_count || product.reviews || 12})</span>
                    </div>

                    {/* Price & Stock Row */}
                    <div className="modern-card-price-row">
                      <div className="modern-price-group">
                        <strong className="modern-main-price">
                          LKR {Number(product.price || 0).toLocaleString()}
                        </strong>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="modern-orig-price">
                            LKR {Number(product.originalPrice).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className={`modern-stock-tag ${isOut ? 'out' : 'in'}`}>
                        {isOut ? 'Out of Stock' : 'In Stock'}
                      </span>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      type="button"
                      className={`modern-add-btn ${isJustAdded ? 'added' : ''} ${isOut ? 'disabled' : ''}`}
                      disabled={isOut}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isOut) return
                        handleAdd(product)
                      }}
                    >
                      {isOut ? (
                        <>
                          <X size={15} /> Out of Stock
                        </>
                      ) : isJustAdded ? (
                        <>
                          <Check size={15} /> Added to Cart!
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={15} /> Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Load More Button */}
        {filteredProducts.length > displayedProducts.length && (
          <div className="modern-load-more-wrap">
            <button
              type="button"
              className="modern-load-more-btn"
              onClick={() => setVisibleCount((prev) => prev + 24)}
            >
              <span>Load More Products ({filteredProducts.length - displayedProducts.length} remaining)</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
