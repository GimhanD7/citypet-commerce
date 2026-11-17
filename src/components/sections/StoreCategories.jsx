import React from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { storeCategories } from '../../data/storeData'

export default function StoreCategories({
  selectedCategory,
  onSelectCategory,
  onViewAllCategories,
}) {
  const categoryDescriptions = {
    all: 'Complete hospital & store inventory',
    foods: 'Nutritious kibble, canned meals & treats',
    shampoo: 'Gentle cleansers, bath care & grooming tools',
    accessories: 'Comfortable collars, leashes, harnesses & toys',
    healthcare: 'Veterinary vitamins, pharmacy & tick care',
  }

  return (
    <section id="store-categories" className="section store-categories-section">
      <div className="container">
        <div className="store-section-header">
          <div>
            <span className="store-sub-eyebrow">
              <Sparkles size={13} style={{ display: 'inline', marginRight: '6px' }} />
              SIMPLE CATEGORIES
            </span>
            <h2 className="store-section-heading">Shop what your pet needs</h2>
          </div>
          <button
            className="store-text-link"
            onClick={onViewAllCategories || (() => onSelectCategory('all'))}
          >
            Browse full catalog <ArrowRight size={16} />
          </button>
        </div>

        {/* Modern Simplified Category Grid */}
        <div className="modern-store-cat-grid">
          {storeCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            const desc = categoryDescriptions[cat.id] || 'Quality pet essentials'
            return (
              <button
                key={cat.id}
                type="button"
                className={`modern-cat-card ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  if (onViewAllCategories) {
                    onViewAllCategories(cat.id)
                  } else {
                    onSelectCategory(isSelected ? 'all' : cat.id)
                  }
                }}
                style={{ '--cat-accent': cat.bg }}
              >
                <div className="modern-cat-icon-wrap" style={{ background: cat.bg }}>
                  <span className="modern-cat-emoji">{cat.icon}</span>
                </div>
                <div className="modern-cat-text-wrap">
                  <h3 className="modern-cat-name">{cat.name}</h3>
                  <p className="modern-cat-desc">{desc}</p>
                </div>
                <div className="modern-cat-footer">
                  <span className="modern-cat-badge">{cat.count} Items</span>
                  <span className="modern-cat-arrow">
                    <ArrowRight size={14} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
