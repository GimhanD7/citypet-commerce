import React from 'react'
import { ArrowRight } from 'lucide-react'
import { storeCategories } from '../../data/storeData'

export default function StoreCategories({
  selectedCategory,
  onSelectCategory,
  onViewAllCategories,
}) {
  return (
    <section id="store-categories" className="section store-categories-section">
      <div className="container">
        <div className="store-section-header">
          <div>
            <span className="store-sub-eyebrow">SHOP BY CATEGORY</span>
            <h2 className="store-section-heading">Find what your pet loves</h2>
          </div>
          <button
            className="store-text-link"
            onClick={onViewAllCategories || (() => onSelectCategory('all'))}
          >
            View all categories <ArrowRight size={16} />
          </button>
        </div>

        <div className="store-categories-grid">
          {storeCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                className={`store-category-card ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  if (onViewAllCategories) {
                    onViewAllCategories(cat.id)
                  } else {
                    onSelectCategory(isSelected ? 'all' : cat.id)
                  }
                }}
                style={{ '--cat-bg': cat.bg }}
              >
                <div className="store-category-avatar">
                  <span className="cat-icon-emoji">{cat.icon}</span>
                </div>
                <span className="store-category-label">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
