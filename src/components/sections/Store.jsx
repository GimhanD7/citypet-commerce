import React, { useState } from 'react'
import StoreHero from './StoreHero'
import StoreCategories from './StoreCategories'
import StoreProducts from './StoreProducts'
import StoreVetBanner from './StoreVetBanner'
import StoreTrustBadges from './StoreTrustBadges'

export default function Store({
  onAddToCart,
  onNavigateToCatalog,
  onSelectProduct,
  savedItems = [],
  onToggleWishlist,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleBrowseCategories = () => {
    if (onNavigateToCatalog) {
      onNavigateToCatalog({ category: 'all' })
    } else {
      scrollToSection('store-categories')
    }
  }

  const handleViewAllCategories = (catId) => {
    if (onNavigateToCatalog) {
      onNavigateToCatalog({ category: catId || 'all' })
    } else {
      setSelectedCategory(catId || 'all')
      scrollToSection('store-products')
    }
  }

  const handleViewAllProducts = () => {
    if (onNavigateToCatalog) {
      onNavigateToCatalog({ category: 'all' })
    } else {
      scrollToSection('store-products')
    }
  }

  return (
    <div id="store-page" className="store-page-wrap">
      {/* Store Hero */}
      <StoreHero
        onShopNow={() => {
          if (onNavigateToCatalog) {
            onNavigateToCatalog({ category: 'all' })
          } else {
            scrollToSection('store-products')
          }
        }}
        onBrowseCategories={handleBrowseCategories}
      />

      {/* Categories Bar */}
      <StoreCategories
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat)
          scrollToSection('store-products')
        }}
        onViewAllCategories={handleViewAllCategories}
      />

      {/* Featured / Popular Products */}
      <StoreProducts
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onAddToCart={onAddToCart}
        onViewAllProducts={handleViewAllProducts}
        onSelectProduct={onSelectProduct}
        savedItems={savedItems}
        onToggleWishlist={onToggleWishlist}
      />

      {/* Vet Selected Promo Banner */}
      <StoreVetBanner
        onShopVetRecommended={() => {
          if (onNavigateToCatalog) {
            onNavigateToCatalog({ category: 'healthcare' })
          } else {
            setSelectedCategory('healthcare')
            scrollToSection('store-products')
          }
        }}
      />

      {/* Value Proposition Badges */}
      <StoreTrustBadges />
    </div>
  )
}
