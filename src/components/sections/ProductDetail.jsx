import React, { useEffect, useState } from 'react'
import {
  ArrowRight,
  Award,
  Check,
  ChevronRight,
  Heart,
  Minus,
  Play,
  Plus,
  Scale,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Truck,
  X,
} from 'lucide-react'
import { storeProducts } from '../../data/storeData'
import ProductVisual from '../common/ProductVisual'
import ProductGallery from './ProductGallery'
import ProductReviews from './ProductReviews'
import { apiFetch } from '../../config/api'
import '../admin/modals/product-media.css'

// High-res assets
import pdpJackRussell from '../../assets/pdp-jack-russell.jpg'

export default function ProductDetail({
  product: initialProduct = null,
  authUser,
  onAddToCart,
  onBuyNow,
  onNavigate,
  onOpenAccount,
  onSelectProduct,
  savedItems = [],
  onToggleWishlist,
}) {
  const [liveProduct, setLiveProduct] = useState(null)
  const [productError, setProductError] = useState('')
  const fallbackProduct = storeProducts.find((p) => p.id === initialProduct?.id) || initialProduct
  const product = (liveProduct?.id === initialProduct?.id && liveProduct) ? liveProduct : fallbackProduct

  const isCurrentSaved = (savedItems || []).some((item) => (item.id || item) === product?.id)

  useEffect(() => {
    if (!initialProduct?.id) return
    let mounted = true
    setLiveProduct(null)
    setProductError('')
    apiFetch(`products.php?id=${encodeURIComponent(initialProduct.id)}`)
      .then((result) => { if (mounted && result) setLiveProduct(result) })
      .catch((err) => { if (mounted) setProductError(err.message) })

    const handleSync = (e) => {
      const { productId, stockCount, inStock, product: updatedProd } = e.detail || {}
      if (productId === initialProduct.id || productId === product?.id) {
        if (updatedProd) {
          setLiveProduct(updatedProd)
        } else {
          setLiveProduct((prev) => {
            const base = prev || initialProduct
            const newCount = stockCount !== undefined ? stockCount : base.stockCount
            const newInStock = inStock !== undefined ? inStock : (newCount > 0)
            return {
              ...base,
              stockCount: newCount,
              inStock: newInStock,
            }
          })
        }
        apiFetch(`products.php?id=${encodeURIComponent(initialProduct.id)}`)
          .then((fresh) => { if (mounted && fresh) setLiveProduct(fresh) })
          .catch(() => {})
      }
    }
    window.addEventListener('citypet_products_updated', handleSync)

    return () => {
      mounted = false
      window.removeEventListener('citypet_products_updated', handleSync)
    }
  }, [initialProduct?.id])
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description') // 'description' | 'ingredients' | 'feeding' | 'reviews'

  const [isAdded, setIsAdded] = useState(false)


  // Reset state when product prop changes
  useEffect(() => {
    if (!product) return
    if (product.sizes && product.sizes.length > 0) {
      const defIdx = product.sizes.findIndex((s) => s.default)
      setSelectedSizeIndex(defIdx !== -1 ? defIdx : 0)
    } else {
      setSelectedSizeIndex(0)
    }
    setQuantity(1)

    setActiveTab('description')
  }, [product?.id, product?.sizes])

  if (!product) {
    return (
      <section className="section" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <h2>No product selected</h2>
          <p style={{ margin: '12px 0 24px', color: '#5b7a76' }}>
            Please select a product from the store catalog.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate && onNavigate('catalog')}
          >
            Browse Store Catalog
          </button>
        </div>
      </section>
    )
  }

  // Current price based on selected size variant
  const selectedSizeObj = product.sizes && product.sizes[selectedSizeIndex]
  const rawPrice =
    selectedSizeObj && selectedSizeObj.price !== undefined
      ? selectedSizeObj.price
      : (product.price !== undefined ? product.price : 0)

  const currentPrice = Number(rawPrice) || 0

  const currentSizeName =
    product.sizes && product.sizes[selectedSizeIndex]
      ? product.sizes[selectedSizeIndex].size
      : ''

  // Check variant-level stock or fallback to overall product stock
  const hasVariantStock = selectedSizeObj && selectedSizeObj.stockCount !== undefined && selectedSizeObj.stockCount !== null
  const stockCount = hasVariantStock
    ? Number(selectedSizeObj.stockCount)
    : (product.stockCount !== undefined ? product.stockCount : (product.inStock ? 15 : 0))

  const isOut = stockCount <= 0 || !product.inStock
  const isLow = stockCount > 0 && stockCount <= 5

  const handleQtyChange = (delta) => {
    if (isOut) return
    setQuantity((prev) => Math.max(1, Math.min(prev + delta, stockCount > 0 ? stockCount : 1)))
  }

  const handleAddToCart = () => {
    if (isOut) return
    const itemToAdd = {
      ...product,
      price: currentPrice,
      selectedSize: currentSizeName,
      name: currentSizeName ? `${product.name} (${currentSizeName})` : product.name,
      stockCount: stockCount,
      inStock: stockCount > 0,
    }
    onAddToCart(itemToAdd, quantity)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1200)
  }

  const handleBuyNow = () => {
    if (isOut) return
    const itemToAdd = {
      ...product,
      price: currentPrice,
      selectedSize: currentSizeName,
      name: currentSizeName ? `${product.name} (${currentSizeName})` : product.name,
      stockCount: stockCount,
      inStock: stockCount > 0,
    }
    if (onBuyNow) {
      onBuyNow(itemToAdd, quantity)
    } else {
      onAddToCart(itemToAdd, quantity)
    }
  }

  // Dynamic category breadcrumb text
  const categoryBreadcrumb =
    product.category === 'food'
      ? product.petType === 'cats'
        ? 'Cat Food'
        : 'Dog Food'
      : product.category === 'treats'
      ? 'Treats'
      : product.category === 'grooming'
      ? 'Grooming'
      : product.category === 'healthcare'
      ? 'Healthcare'
      : product.category === 'toys'
      ? 'Pet Toys'
      : 'Accessories'

  // Dynamic Related products (prefer same petType or category)
  const relatedProducts = storeProducts
    .filter((p) => p.id !== product.id)
    .sort((a, b) => {
      const aScore = (a.petType === product.petType ? 2 : 0) + (a.category === product.category ? 2 : 0)
      const bScore = (b.petType === product.petType ? 2 : 0) + (b.category === product.category ? 2 : 0)
      return bScore - aScore
    })
    .slice(0, 4)

  const renderBenefitIcon = (iconName) => {
    switch (iconName) {
      case 'scale':
        return <Scale size={18} />
      case 'stomach':
      case 'shield':
        return <ShieldCheck size={18} />
      case 'heart':
        return <Heart size={18} />
      case 'sparkles':
      default:
        return <Sparkles size={18} />
    }
  }


  return (
    <div className="pdp-page">
      {productError && <p role="alert">Unable to refresh product details: {productError}</p>}
      <div className="container pdp-container">
        {/* Breadcrumb Trail */}
        <nav className="pdp-breadcrumbs" aria-label="Breadcrumb">
          <button className="breadcrumb-link" onClick={() => onNavigate('home')}>
            Home
          </button>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <button className="breadcrumb-link" onClick={() => onNavigate('store')}>
            Store
          </button>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <button
            className="breadcrumb-link"
            onClick={() =>
              onNavigate('catalog', {
                category: product.category,
                petType: product.petType,
              })
            }
          >
            {categoryBreadcrumb}
          </button>
          <ChevronRight size={14} className="breadcrumb-separator" />
          <span className="breadcrumb-current">{product.name}</span>
        </nav>

        {/* Main Product Showcase Section (2-Column) */}
        <section className="pdp-hero-grid">
          {/* ========================================================
              LEFT COLUMN: Thumbnails & Big Showcase Image
             ======================================================== */}
<ProductGallery product={product} />
          <div className="pdp-purchase-panel">
            {/* Brand Eyebrow */}
            <span className="pdp-brand-eyebrow">{product.brand || 'CITY PET'}</span>

            {/* Product Title */}
            <h1 className="pdp-title">{product.fullName || product.name}</h1>

            {/* Ratings Line */}
            <div className="pdp-rating-line">
              <div className="pdp-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.floor(product.rating ?? 0) ? '#f59e0b' : 'none'}
                    color="#f59e0b"
                  />
                ))}
              </div>
              <button
                className="pdp-reviews-link"
                onClick={() => {
                  setActiveTab('reviews')
                  document.getElementById('pdp-tabs-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {product.rating ?? 0} ({product.reviews ?? 0} reviews)
              </button>
            </div>

            {/* Main Price */}
            <div className="pdp-price-row">
              <strong className="pdp-main-price">
                LKR {Number(currentPrice || 0).toLocaleString()}
              </strong>
              {product.originalPrice ? (
                <span className="pdp-orig-price">
                  LKR {Number(product.originalPrice || Math.round((currentPrice || 0) * 1.08)).toLocaleString()}
                </span>
              ) : null}
            </div>

            {/* Short Summary Description */}
            <p className="pdp-short-desc">
              {product.shortDescription || product.description?.[0] || ''}
            </p>

            {/* Feature Attribute Badges */}
            <div className="pdp-feature-pills-row">
              {(product.tags || ['Vet Approved', '100% Genuine', 'Premium Quality']).map(
                (tag, idx) => (
                  <span key={idx} className="pdp-feature-pill">
                    {tag}
                  </span>
                )
              )}
            </div>

            {/* Size Variant Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="pdp-size-selector-wrap">
                <span className="pdp-section-label">Options / Size</span>
                <div className="pdp-sizes-grid">
                  {product.sizes.map((s, idx) => {
                    const isSelected = selectedSizeIndex === idx
                    const variantIsOut = s.stockCount !== undefined && Number(s.stockCount) <= 0
                    return (
                      <button
                        key={idx}
                        className={`pdp-size-card ${isSelected ? 'active' : ''} ${variantIsOut ? 'size-out' : ''}`}
                        onClick={() => setSelectedSizeIndex(idx)}
                      >
                        <strong className="size-label">{s.size}</strong>
                        <span className="size-price">LKR {Number(s.price || 0).toLocaleString()}</span>
                        {variantIsOut && <span className="size-out-pill">Out of Stock</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity Counter & Stock Status */}
            <div className="pdp-qty-stock-row">
              <div className="pdp-qty-box">
                <button
                  className="qty-btn"
                  onClick={() => handleQtyChange(-1)}
                  disabled={quantity <= 1 || isOut}
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="qty-value">{isOut ? 0 : quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => handleQtyChange(1)}
                  disabled={quantity >= stockCount || isOut}
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>

              {isOut && (
                <span className="pdp-out-badge">Out of Stock</span>
              )}
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="pdp-actions-row">
              <button
                className={`pdp-add-cart-btn ${isAdded ? 'just-added' : ''} ${isOut ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={isOut}
                title={isOut ? 'This product is currently out of stock' : 'Add to Cart'}
              >
                {isOut ? (
                  <>
                    <X size={18} /> Out of Stock
                  </>
                ) : isAdded ? (
                  <>
                    <Check size={18} /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to Cart
                  </>
                )}
              </button>
              <button
                className={`pdp-buy-now-btn ${isOut ? 'disabled' : ''}`}
                onClick={handleBuyNow}
                disabled={isOut}
                title={isOut ? 'This product is currently out of stock' : 'Buy Now'}
              >
                <span>{isOut ? 'Unavailable' : 'Buy Now'}</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                className={`pdp-wishlist-action-btn ${isCurrentSaved ? 'liked' : ''}`}
                onClick={() => onToggleWishlist && onToggleWishlist(product)}
                title={isCurrentSaved ? 'Saved in Wishlist' : 'Save to Wishlist'}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  border: isCurrentSaved ? '1.5px solid #fecdd3' : '1.5px solid #d4ece7',
                  background: isCurrentSaved ? '#fff1f2' : '#ffffff',
                  color: isCurrentSaved ? '#e11d48' : '#648984',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  flexShrink: 0,
                }}
              >
                <Heart size={20} fill={isCurrentSaved ? '#e11d48' : 'none'} color={isCurrentSaved ? '#e11d48' : '#648984'} />
              </button>
            </div>

            {/* 3 Guarantee Badges in a Horizontal Strip */}
            <div className="pdp-trust-strip">
              <div className="pdp-trust-card">
                <span className="pdp-trust-icon-circle">
                  <Award size={18} />
                </span>
                <div className="pdp-trust-info">
                  <strong className="trust-title">Genuine Product</strong>
                  <span className="trust-sub">100% authentic, trusted brands</span>
                </div>
              </div>

              <div className="pdp-trust-card">
                <span className="pdp-trust-icon-circle">
                  <Stethoscope size={18} />
                </span>
                <div className="pdp-trust-info">
                  <strong className="trust-title">Vet Recommended</strong>
                  <span className="trust-sub">Chosen by our veterinary team</span>
                </div>
              </div>

              <div className="pdp-trust-card">
                <span className="pdp-trust-icon-circle">
                  <Truck size={18} />
                </span>
                <div className="pdp-trust-info">
                  <strong className="trust-title">Islandwide Delivery</strong>
                  <span className="trust-sub">Fast and reliable service</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================
            TABS SECTION: Description, Ingredients, Feeding, Reviews
           ======================================================== */}
        <section id="pdp-tabs-section" className="pdp-tabs-container">
          {/* Tab Navigation Headers */}
          <div className="pdp-tabs-nav">
            <button
              className={`pdp-tab-nav-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`pdp-tab-nav-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => setActiveTab('ingredients')}
            >
              {product.category === 'accessories' || product.category === 'toys'
                ? 'Materials & Specs'
                : 'Ingredients'}
            </button>
            <button
              className={`pdp-tab-nav-btn ${activeTab === 'feeding' ? 'active' : ''}`}
              onClick={() => setActiveTab('feeding')}
            >
              {product.category === 'food' || product.category === 'treats'
                ? 'Feeding Guide'
                : 'Usage & Directions'}
            </button>
            <button
              className={`pdp-tab-nav-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({product.reviews ?? 0})
            </button>
          </div>

          {/* Tab 1: Description */}
          {activeTab === 'description' && (
            <div className="pdp-tab-pane description-pane">
              <div className="description-left-text">
                <h3 className="pane-heading">Product Description</h3>
                {(
                  product.description || [
                    `${product.name} is specially formulated and veterinary approved for happy, healthy pets. It provides a precise balance of nutrients to help maintain optimal wellness.`,
                    'Crafted from high-grade, authentic ingredients that meet strict global veterinary safety standards.',
                  ]
                ).map((paragraph, idx) => (
                  <p key={idx} className="description-paragraph">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Promo Card with Jack Russell & Key Benefits */}
              <div className="description-promo-card">
                <div className="promo-dog-spotlight">
                  <img
                    src={pdpJackRussell}
                    alt="Happy pet"
                    className="promo-dog-img"
                  />
                  <div className="promo-dog-script">
                    <span>Happier</span>
                    <span>Brighter</span>
                    <span>Days <span className="script-heart">♡</span></span>
                  </div>
                </div>

                <div className="promo-benefits-list">
                  {(
                    product.keyBenefits || [
                      {
                        title: 'Optimal Health Support',
                        desc: 'Promotes complete vitality and wellness.',
                        icon: 'shield',
                      },
                      {
                        title: 'Digestive & Gut Care',
                        desc: 'Easy to digest and gentle on stomachs.',
                        icon: 'stomach',
                      },
                      {
                        title: 'Shiny Coat & Skin',
                        desc: 'Enriched with nourishing essential nutrients.',
                        icon: 'sparkles',
                      },
                    ]
                  ).map((benefit, idx) => (
                    <div key={idx} className="benefit-item">
                      <span className="benefit-icon-circle">
                        {renderBenefitIcon(benefit.icon)}
                      </span>
                      <span className="benefit-text">{benefit.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Ingredients / Specs */}
          {activeTab === 'ingredients' && (
            <div className="pdp-tab-pane ingredients-pane">
              <h3 className="pane-heading">
                {product.category === 'accessories' || product.category === 'toys'
                  ? 'Materials, Safety & Specifications'
                  : 'Composition & Guaranteed Analysis'}
              </h3>
              <div className="ingredients-grid">
                <div className="ingredients-box">
                  <h4>
                    {product.category === 'accessories' || product.category === 'toys'
                      ? 'Construction & Materials'
                      : 'Key Ingredients'}
                  </h4>
                  <p>
                    {product.ingredients?.composition ||
                      'Premium grade, veterinarian-tested components designed for maximum pet safety and comfort.'}
                  </p>

                  <h4>Quality & Safety Standards</h4>
                  <p>
                    {product.ingredients?.additives ||
                      '100% genuine import. Formulated without harsh chemicals, toxic binders, or hazardous materials.'}
                  </p>
                </div>

                <div className="analysis-box">
                  <h4>Guaranteed Specifications</h4>
                  <table className="analysis-table">
                    <tbody>
                      {(
                        product.ingredients?.analysis || [
                          { nutrient: 'Brand Origin', value: product.brand },
                          { nutrient: 'Target Pet', value: product.petType },
                          { nutrient: 'Packaging Type', value: 'Original Sealed Pack' },
                        ]
                      ).map((item, idx) => (
                        <tr key={idx}>
                          <td className="nutrient-name">{item.nutrient}</td>
                          <td className="nutrient-val">{item.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Feeding Guide / Usage */}
          {activeTab === 'feeding' && (
            <div className="pdp-tab-pane feeding-pane">
              <h3 className="pane-heading">
                {product.category === 'food' || product.category === 'treats'
                  ? 'Daily Recommended Feeding Guide'
                  : 'Usage & Application Directions'}
              </h3>
              <p className="feeding-intro">
                Follow recommended guidelines below. For clinical questions, speak with our City Pet hospital team anytime.
              </p>
              <div className="feeding-table-wrap">
                <table className="feeding-table">
                  <thead>
                    <tr>
                      <th>Pet Size / Weight</th>
                      <th>Standard Guideline</th>
                      <th>Notes / Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      product.feedingGuide || [
                        { dogWeight: 'Small Pets (<10kg)', normalActivity: 'Standard single dose / portion', highActivity: 'Supervised routine' },
                        { dogWeight: 'Medium Pets (10-25kg)', normalActivity: 'Standard portion', highActivity: 'Daily care' },
                        { dogWeight: 'Large Pets (>25kg)', normalActivity: 'Adjusted portion', highActivity: 'Daily care' },
                      ]
                    ).map((row, idx) => (
                      <tr key={idx}>
                        <td><strong>{row.dogWeight}</strong></td>
                        <td>{row.normalActivity}</td>
                        <td>{row.highActivity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Reviews */}
          {activeTab === 'reviews' && (
            <ProductReviews
              productId={product.id}
              authUser={authUser}
              onNavigate={onNavigate}
              onOpenAccount={onOpenAccount}
              onSummary={(summary) =>
                setLiveProduct((previous) => ({ ...(previous || product), ...summary }))
              }
            />
          )}
        </section>

        {/* ========================================================
            RELATED PRODUCTS SECTION (4-Column)
           ======================================================== */}
        <section className="pdp-related-section">
          <div className="pdp-related-header">
            <h2 className="related-heading">Related Products</h2>
            <button
              className="store-text-link"
              onClick={() => onNavigate('catalog')}
            >
              View all products <ArrowRight size={16} />
            </button>
          </div>

          <div className="pdp-related-grid">
            {relatedProducts.map((relProduct) => {
              const relStockCount = relProduct.stockCount !== undefined ? relProduct.stockCount : (relProduct.inStock ? 15 : 0)
              const relIsOut = relStockCount === 0 || !relProduct.inStock

              return (
                <article
                  key={relProduct.id}
                  className="catalog-product-card pdp-rel-card clickable-product-card"
                  onClick={() => {
                    if (onSelectProduct) {
                      onSelectProduct(relProduct)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                >
                  <div className="catalog-card-header">
                    {relProduct.badge ? (
                      <span className="catalog-badge badge-default">
                        {relProduct.badge}
                      </span>
                    ) : (
                      <span className="catalog-badge-placeholder" />
                    )}
                    <button
                      className="catalog-wishlist-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      aria-label="Wishlist"
                    >
                      <Heart size={16} color="#8fa8a5" />
                    </button>
                  </div>

                  <div className="catalog-card-image-wrap">
                    <ProductVisual type={relProduct.imageType} name={relProduct.name} />
                  </div>

                  <div className="catalog-card-body">
                    <h4 className="catalog-card-title">{relProduct.name}</h4>

                    <div className="catalog-rating-row">
                      <div className="catalog-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            fill={i < Math.floor(relProduct.rating) ? '#f59e0b' : 'none'}
                            color="#f59e0b"
                          />
                        ))}
                      </div>
                      <span className="catalog-review-count">({relProduct.reviews})</span>
                    </div>

                    <div className="catalog-price-row">
                      <strong className="catalog-main-price">
                        LKR {Number(relProduct.price || 0).toLocaleString()}
                      </strong>
                    </div>

                    <button
                      className={`catalog-add-btn ${relIsOut ? 'disabled' : ''}`}
                      disabled={relIsOut}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!relIsOut) {
                          onAddToCart(relProduct)
                        }
                      }}
                    >
                      {relIsOut ? (
                        <>
                          <X size={15} /> Out of Stock
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
        </section>
      </div>

    </div>
  )
}
