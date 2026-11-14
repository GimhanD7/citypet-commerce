import React, { useState } from 'react'
import {
  ArrowRight,
  Check,
  Heart,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  X,
} from 'lucide-react'
import SectionTitle from '../common/SectionTitle'
import ProductVisual from '../common/ProductVisual'
import useStoreProducts from '../../services/useStoreProducts'

export default function StoreTeaser({ onNavigateToStore, onAddToCart, onSelectProduct }) {
  const storeProducts = useStoreProducts()
  const [addedAnimation, setAddedAnimation] = useState({})
  const popularProducts = storeProducts.slice(0, 8)

  const handleAdd = (product) => {
    const stockCount = product.stockCount !== undefined ? product.stockCount : (product.inStock ? 15 : 0)
    const isOut = stockCount === 0 || !product.inStock
    if (isOut) return

    onAddToCart(product)
    setAddedAnimation((prev) => ({ ...prev, [product.id]: true }))
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [product.id]: false }))
    }, 1200)
  }

  return (
    <section id="store-teaser" className="section store-teaser-section">
      <div className="container">
        <div className="store-teaser-header-row">
          <div>
            <span className="eyebrow">CITY PET ONLINE STORE</span>
            <h2 className="section-title-custom">
              Popular picks for happy, healthy pets
            </h2>
            <p className="section-desc-custom">
              Order premium veterinary food, wellness care, and supplies directly from our hospital.
            </p>
          </div>
          <button
            className="button primary store-visit-btn"
            onClick={onNavigateToStore}
          >
            <span>Visit Online Store</span>
            <ArrowRight size={17} />
          </button>
        </div>

        {/* 8 Featured Products Cards — 4×2 grid */}
        <div className="store-products-grid mt-[38px]">
          {popularProducts.map((product) => {
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
                  <span className="product-category-tag">{product.brand}</span>
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
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isOut) {
                        handleAdd(product)
                      }
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

        {/* See All Products CTA */}
        <div className="store-teaser-see-all-row">
          <button
            className="store-teaser-see-all-btn"
            onClick={onNavigateToStore}
          >
            <ShoppingBag size={18} />
            <span>See All Products</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Banner Link to Store */}
        <div className="store-teaser-footer-banner">
          <div className="teaser-banner-copy">
            <Sparkles size={20} className="sparkle-icon" />
            <div>
              <strong>Looking for specific clinical diets, foods or pet care supplies?</strong>
              <p>Explore over 30+ vet-curated products, toys, and grooming supplies in our full store.</p>
            </div>
          </div>
          <button className="button secondary pale-teal-btn" onClick={onNavigateToStore}>
            Explore Full Store <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}
