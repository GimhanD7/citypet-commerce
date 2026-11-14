import React from 'react'
import { ArrowRight, Heart, Sparkles } from 'lucide-react'
import vetCatImg from '../../assets/vet-cat-promo.jpg'

export default function StoreVetBanner({ onShopVetRecommended }) {
  return (
    <section className="section store-vet-banner-section">
      <div className="container">
        <div className="store-vet-banner-card">
          <div className="store-vet-banner-copy">
            <span className="store-vet-eyebrow">
              VET SELECTED, PET APPROVED.
            </span>
            <h2 className="store-vet-heading">
              Trusted products for brighter, healthier tomorrows.
            </h2>
            <p className="store-vet-desc">
              Carefully chosen by our veterinarians to support your pet's health, happiness and every stage of life.
            </p>
            <button
              className="button primary store-vet-btn"
              onClick={onShopVetRecommended}
            >
              Shop Vet Recommended <ArrowRight size={18} />
            </button>
          </div>

          <div className="store-vet-visual-wrap">
            <div className="store-vet-speech-bubble">
              <span>Small choices make healthier happier days</span>
              <Heart size={15} fill="#ed7f72" color="#ed7f72" />
            </div>
            <div className="store-vet-image-shell">
              <img
                src={vetCatImg}
                alt="Fluffy cat relaxing happily while being petted"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
