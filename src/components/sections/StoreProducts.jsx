import React, { useState } from 'react'
import {
  ArrowRight,
  Check,
  Heart,
  Plus,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react'
import { storeCategories } from '../../data/storeData'
import useStoreProducts from '../../services/useStoreProducts'
import ProductVisual from '../common/ProductVisual'

export default function StoreProducts({
  selectedCategory = 'all',
  onSelectCategory,
  onAddToCart,
  onViewAllProducts,
  onSelectProduct,
}) {
  const storeProducts = useStoreProducts()
  const [wishlist, setWishlist] = useState({})
  const [addedAnimation, setAddedAnimation] = useState({})

  const toggleWishlist = (id) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleAdd = (product) => {
    onAddToCart(product)
    setAddedAnimation((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [product.id]: false }))
    }, 1200)
  }

  const filteredProducts =
    selectedCategory === 'all'
      ? storeProducts
      : storeProducts.filter(
          (p) =>
            p.category === selectedCategory ||
            p.petType === selectedCategory ||
            (selectedCategory === 'dogs' && p.petType === 'dogs') ||
            (selectedCategory === 'cats' && p.petType === 'cats')
        )

  return (
    <section id="store-products" className="section store-products-section">
      <div className="container">
        <div className="store-section-header">
          <div>
            <span className="store-sub-eyebrow">FEATURED PRODUCTS</span>
            <h2 className="store-section-heading">
              Popular picks for happy, healthy pets
            </h2>
          </div>
          <button
            className="store-text-link"
            onClick={onViewAllProducts || (() => onSelectCategory('all'))}
          >
            View all products <ArrowRight size={16} />
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="product-filters-row">
          <button
            className={`filter-pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => onSelectCategory('all')}
          >
            All Products
          </button>
          {storeCategories.map((cat) => (
            <button
              key={cat.id}
              className={`filter-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>

        {/* 4-column Product Grid */}
        <div className="store-products-grid">
          {filteredProducts.map((product) => {
            const isWishlisted = !!wishlist[product.id]
            const isJustAdded = !!addedAnimation[product.id]
            const stockCount = product.stockCount !== undefined ? product.stockCount : (product.inStock ? 15 : 0)
            const isOut = stockCount === 0 || !product.inStock

            return (
              <article
                className="store-product-card clickable-product-card"
                key={product.id}
                onClick={() => onSelectProduct && onSelectProduct(product)}
              >
                <div className="product-card-top">
                  {product.badge && (
                    <span className="product-badge-pill">{product.badge}</span>
                  )}
                  <button
                    className={`wishlist-heart-btn ${isWishlisted ? 'liked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleWishlist(product.id)
                    }}
                    aria-label={`Save ${product.name} to wishlist`}
                  >
                    <Heart size={16} fill={isWishlisted ? '#ed7f72' : 'none'} color={isWishlisted ? '#ed7f72' : '#88a3a0'} />
                  </button>
                </div>

                <div className="product-card-visual-area">
                  <ProductVisual type={product.imageType} name={product.name} />
                </div>

                <div className="product-card-info">
                  <h3 className="product-card-title">{product.name}</h3>

                  <div className="product-rating-line">
                    <div className="product-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < Math.floor(product.rating) ? '#f59e0b' : 'none'}
                          color="#f59e0b"
                        />
                      ))}
                    </div>
                    <span className="product-review-count">({product.reviews})</span>
                  </div>

                  <div className="product-price-row">
                    <strong className="product-main-price">
                      LKR {product.price.toLocaleString()}
                    </strong>
                    {product.originalPrice && (
                      <span className="product-orig-price">
                        LKR {product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <button
                    className={`product-add-cart-btn ${isJustAdded ? 'just-added' : ''} ${isOut ? 'disabled' : ''}`}
                    disabled={isOut}
                    title={isOut ? 'Out of Stock' : 'Add to Cart'}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (isOut) return
                      handleAdd(product)
                    }}
                  >
                    {isOut ? (
                      <>
                        <X size={16} /> Out of Stock
                      </>
                    ) : isJustAdded ? (
                      <>
                        <Check size={16} /> Added to Cart!
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
      </div>
    </section>
  )
}
