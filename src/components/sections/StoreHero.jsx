import React from 'react'
import {
  ArrowRight,
  Heart,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react'
import storeHeroImg from '../../assets/store-hero-exact.png'

export default function StoreHero({ onShopNow, onBrowseCategories }) {
  return (
    <section className="store-hero-section">
      <div className="store-hero-bg-glow" aria-hidden="true" />
      <div className="container store-hero-grid">
        {/* Left Typography & CTAs */}
        <div className="store-hero-copy">
          <div className="store-hero-eyebrow-pill">
            <span className="eyebrow-pulse-dot" />
            <Sparkles size={13} className="eyebrow-sparkle" />
            <span>CITY PET ONLINE STORE</span>
          </div>

          <h1 className="store-hero-title">
            <span className="store-title-line">Everything your pet</span>
            <span className="store-title-line">needs, in one</span>
            <span className="store-title-script-wrap">
              <span className="store-title-script">caring place.</span>
            </span>
          </h1>

          <p className="store-hero-desc">
            Veterinary-approved nutrition, authentic pharmaceuticals, and premium everyday essentials — curated directly by City Pet Animal Hospital.
          </p>

          <div className="store-hero-actions">
            <button className="button store-btn-shop-now" onClick={onShopNow}>
              <ShoppingCart size={18} className="btn-icon-cart" />
              <span>Shop All Products</span>
              <ArrowRight size={18} className="btn-icon-arrow" />
            </button>
            <button className="button store-btn-browse-cat" onClick={onBrowseCategories}>
              Browse Categories
            </button>
          </div>

          <div className="store-hero-trust-bar">
            <div className="store-trust-chip">
              <span className="trust-circle-pill">
                <ShieldCheck size={15} />
              </span>
              <span>100% Genuine Brands</span>
            </div>
            <div className="store-trust-chip">
              <span className="trust-circle-pill">
                <Heart size={15} />
              </span>
              <span>Vet Recommended</span>
            </div>
            <div className="store-trust-chip">
              <span className="trust-circle-pill">
                <Truck size={15} />
              </span>
              <span>Islandwide Delivery</span>
            </div>
          </div>
        </div>

        {/* Right Stage Visual with Modern Glass Badges */}
        <div className="store-hero-stage">
          <div className="store-hero-stage-inner">
            {/* Ambient Back Glow Ring */}
            <div className="store-hero-backdrop-circle" aria-hidden="true" />

            {/* Modern Floating Glass Badge: Rating */}
            <div className="store-modern-glass-badge badge-top">
              <div className="badge-glass-icon gold">
                <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
              </div>
              <div className="badge-glass-text">
                <strong>4.9 / 5.0 Rating</strong>
                <small>1,200+ Pet Parents</small>
              </div>
            </div>

            {/* Modern Floating Glass Badge: Stock & Authenticity */}
            <div className="store-modern-glass-badge badge-bottom">
              <div className="badge-glass-icon teal">
                <Sparkles size={16} />
              </div>
              <div className="badge-glass-text">
                <strong>610+ Hospital Items</strong>
                <small>Fresh & Genuine Stock</small>
              </div>
            </div>

            {/* Main Stage Image */}
            <div className="store-hero-image-wrapper">
              <img
                src={storeHeroImg}
                alt="Happy Golden Retriever with Royal Canin dog food, City Pet food bowl and toys"
                className="store-hero-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
