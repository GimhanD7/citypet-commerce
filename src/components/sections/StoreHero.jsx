import React from 'react'
import {
  ArrowRight,
  Heart,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import storeHeroImg from '../../assets/store-hero-exact.png'

export default function StoreHero({ onShopNow, onBrowseCategories }) {
  return (
    <section className="store-hero-section">
      <div className="store-hero-soft-orb" aria-hidden="true" />
      <div className="container store-hero-grid">
        {/* Left Typography & CTAs */}
        <div className="store-hero-copy">
          <span className="store-hero-eyebrow">
            CITY PET ONLINE STORE
          </span>
          <h1 className="store-hero-title">
            <span className="store-title-line">Everything your pet</span>
            <span className="store-title-line">needs, in one</span>
            <span className="store-title-script-wrap">
              <span className="store-title-script">caring place.</span>
            </span>
          </h1>
          <p className="store-hero-desc">
            Premium pet products, trusted brands and vet-approved essentials, all from the people who care for your pets.
          </p>

          <div className="store-hero-actions">
            <button className="button store-btn-shop-now" onClick={onShopNow}>
              <ShoppingCart size={18} className="btn-icon-cart" />
              <span>Shop Now</span>
              <ArrowRight size={18} className="btn-icon-arrow" />
            </button>
            <button className="button store-btn-browse-cat" onClick={onBrowseCategories}>
              Browse Categories
            </button>
          </div>

          <div className="store-hero-trust-bar">
            <div className="store-trust-item">
              <span className="trust-circle-pill">
                <Heart size={15} />
              </span>
              <span>Vet recommended products</span>
            </div>
            <div className="store-trust-item">
              <span className="trust-circle-pill">
                <ShieldCheck size={15} />
              </span>
              <span>100% genuine brands</span>
            </div>
            <div className="store-trust-item">
              <span className="trust-circle-pill">
                <Truck size={15} />
              </span>
              <span>Islandwide delivery</span>
            </div>
          </div>
        </div>

        {/* Right Stage Visual with Floating Elements */}
        <div className="store-hero-stage">
          <div className="store-hero-stage-inner">
            {/* Hand-drawn floating teal heart */}
            <div className="store-floating-heart-svg" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path
                  d="M24 38s-14-9.5-18-18a10 10 0 0 1 18-6 10 10 0 0 1 18 6c-4 8.5-18 18-18 18z"
                  stroke="#5dc4b9"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Floating Mint Egg Badge */}
            <div className="store-floating-speech-egg">
              <span className="egg-line-1">Happier</span>
              <span className="egg-line-2">Pets</span>
              <span className="egg-line-3">Healthier</span>
              <span className="egg-line-4">Lives</span>
            </div>

            {/* Decorative Ray Accents */}
            <div className="store-accent-rays" aria-hidden="true">
              <span className="ray-1" />
              <span className="ray-2" />
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
