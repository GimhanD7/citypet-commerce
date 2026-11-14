import React, { useMemo, useState } from 'react'
import {
  ArrowRight,
  Plus,
  Search,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react'
import { storeCategories } from '../../data/storeData'
import useStoreProducts from '../../services/useStoreProducts'
import ProductVisual from './ProductVisual'

export default function SearchModal({
  isOpen,
  onClose,
  onAddToCart,
  onSelectCategory,
  onSelectProduct,
}) {
  const storeProducts = useStoreProducts()
  const [query, setQuery] = useState('')
  const [selectedCat, setSelectedCat] = useState('all')

  const results = useMemo(() => {
    let filtered = storeProducts
    if (selectedCat !== 'all') {
      filtered = filtered.filter(
        (p) => p.category === selectedCat || p.petType === selectedCat
      )
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          String(p.name || '').toLowerCase().includes(q) ||
          String(p.brand || '').toLowerCase().includes(q) ||
          (p.description && String(Array.isArray(p.description) ? p.description.join(' ') : p.description).toLowerCase().includes(q)) ||
          String(p.tag || '').toLowerCase().includes(q)
      )
    }
    return filtered
  }, [query, selectedCat, storeProducts])

  if (!isOpen) return null

  return (
    <div className="search-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Search Pet Store">
      <div className="search-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Search Header */}
        <div className="search-modal-header">
          <div className="search-input-wrap">
            <Search size={20} className="search-icon-input" />
            <input
              type="text"
              autoFocus
              placeholder="Search dog food, cat vitamins, shampoos, toys..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                className="clear-search-btn"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button className="search-close-icon-btn" onClick={onClose} aria-label="Close search">
            <X size={22} />
          </button>
        </div>

        {/* Categories Quick Filter Chips */}
        <div className="search-categories-bar">
          <button
            className={`search-cat-chip ${selectedCat === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCat('all')}
          >
            All Items
          </button>
          {storeCategories.map((cat) => (
            <button
              key={cat.id}
              className={`search-cat-chip ${selectedCat === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.id)}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="search-results-area">
          <div className="search-results-count">
            <span>Found <strong>{results.length}</strong> items</span>
          </div>

          {results.length === 0 ? (
            <div className="no-search-results">
              <Search size={40} />
              <h4>No products matched "{query}"</h4>
              <p>Try searching for brand names like <em>Royal Canin</em>, <em>Hill's</em>, <em>Frontline</em>, or categories like <em>Food</em>.</p>
            </div>
          ) : (
            <div className="search-results-grid">
              {results.map((product) => {
                const stockCount = product.stockCount !== undefined ? product.stockCount : (product.inStock ? 15 : 0)
                const isOut = stockCount === 0 || !product.inStock

                return (
                  <div
                    className="search-product-card clickable-product-card"
                    key={product.id}
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(product)
                        onClose()
                      }
                    }}
                  >
                    <div className="search-product-visual">
                      <ProductVisual type={product.imageType} name={product.name} />
                    </div>
                    <div className="search-product-info">
                      <div className="search-product-meta">
                        <span className="search-product-brand">{product.brand}</span>
                        {product.badge && <span className="search-product-badge">{product.badge}</span>}
                      </div>
                      <h5>{product.name}</h5>
                      <div className="search-product-price-row">
                        <strong className="search-product-price">
                          LKR {product.price.toLocaleString()}
                        </strong>
                        <div className="search-product-stars">
                          <Star size={13} fill="#f59e0b" color="#f59e0b" />
                          <span>{product.rating} ({product.reviews})</span>
                        </div>
                      </div>
                      <button
                        className={`search-add-btn ${isOut ? 'disabled' : ''}`}
                        disabled={isOut}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!isOut) {
                            onAddToCart(product)
                          }
                        }}
                      >
                        {isOut ? (
                          <>
                            <X size={15} /> Out of Stock
                          </>
                        ) : (
                          <>
                            <Plus size={15} /> Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
