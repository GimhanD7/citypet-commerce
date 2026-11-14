import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Heart, Maximize2, Play, Video, Volume2, X } from 'lucide-react'
import ProductVisual from '../common/ProductVisual'

export default function ProductGallery({ product }) {
  const [active, setActive] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // Reset active index when product changes
  useEffect(() => {
    setActive(0)
  }, [product.id, product.mainImage])

  // Build the media array: Slot 1 is Main Image, followed by up to 4 gallery items
  const rawGallery = Array.isArray(product.gallery) ? product.gallery : []
  const media = [
    { type: 'image', url: product.mainImage || '', isMain: true },
    ...rawGallery.slice(0, 4).map((item) => {
      if (typeof item === 'string') {
        const isVid = /\.(mp4|webm|mov|ogg)($|\?)/i.test(item)
        return { type: isVid ? 'video' : 'image', url: item }
      }
      return item
    }),
  ]

  // If no main image or gallery, provide placeholder visual
  const totalSlots = media.length
  const selected = media[active] || media[0]

  const handlePrev = () => {
    setActive((prev) => (prev > 0 ? prev - 1 : totalSlots - 1))
  }

  const handleNext = () => {
    setActive((prev) => (prev < totalSlots - 1 ? prev + 1 : 0))
  }

  return (
    <div className="pdp-gallery-wrap">
      {/* ── Left Vertical Thumbnail Strip ───────────────────────── */}
      <div className="pdp-thumb-strip">
        {media.map((item, index) => {
          const isActive = active === index
          const isVideo = item.type === 'video'
          return (
            <button
              key={`${index}-${item.url}`}
              type="button"
              className={`pdp-thumb-btn ${isActive ? 'active' : ''} ${isVideo ? 'pdp-thumb-video-btn' : ''}`}
              aria-label={index === 0 ? 'Main product image' : `${isVideo ? 'Video' : 'Image'} ${index + 1}`}
              aria-pressed={isActive}
              onClick={() => setActive(index)}
            >
              {isVideo ? (
                <div className="thumb-video-preview">
                  {item.url ? (
                    <video src={item.url} muted preload="metadata" className="pdp-thumb-video-el" />
                  ) : null}
                  <div className="thumb-play-overlay">
                    <Play size={18} fill="#ffffff" />
                  </div>
                  <span className="thumb-video-caption">VIDEO</span>
                </div>
              ) : item.url ? (
                <img
                  className="pdp-thumb-img"
                  src={item.url}
                  alt={`${product.name} visual ${index + 1}`}
                />
              ) : (
                <ProductVisual type={product.imageType} name={product.name} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Main Showcase Stage ─────────────────────────────────── */}
      <div className="pdp-main-stage">
        {/* Wishlist floating button */}
        <button
          type="button"
          className={`pdp-wishlist-fab ${isLiked ? 'liked' : ''}`}
          onClick={() => setIsLiked(!isLiked)}
          aria-label="Add to wishlist"
        >
          <Heart size={20} fill={isLiked ? '#ed7f72' : 'none'} />
        </button>

        {/* Counter Badge */}
        <span className="pdp-stage-counter-pill">
          {selected.type === 'video' ? 'Video • ' : 'Image • '}
          {active + 1} / {totalSlots}
        </span>

        {/* Previous & Next Navigation Buttons */}
        {totalSlots > 1 && (
          <>
            <button
              type="button"
              className="pdp-stage-arrow-btn prev-arrow"
              onClick={handlePrev}
              aria-label="Previous visual"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="pdp-stage-arrow-btn next-arrow"
              onClick={handleNext}
              aria-label="Next visual"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Stage Content */}
        {selected.type === 'video' ? (
          <div className="pdp-stage-video-wrap">
            <video
              key={selected.url}
              className="pdp-uploaded-video"
              src={selected.url}
              controls
              playsInline
              preload="metadata"
            />
            <div className="pdp-video-tag-badge">
              <Video size={13} />
              <span>Product Video Demo</span>
            </div>
          </div>
        ) : (
          <div className="pdp-stage-img-wrap">
            {selected.url ? (
              <img
                className="pdp-uploaded-image pdp-stage-main-img"
                src={selected.url}
                alt={product.name}
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <ProductVisual type={product.imageType} name={product.name} />
            )}

            {selected.url && (
              <button
                type="button"
                className="pdp-stage-zoom-btn"
                onClick={() => setLightboxOpen(true)}
                title="Expand image"
              >
                <Maximize2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox Modal for Full-res View ─────────────────────── */}
      {lightboxOpen && selected.type === 'image' && selected.url && (
        <div className="pdp-lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <button
            type="button"
            className="pdp-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close zoomed view"
          >
            <X size={24} />
          </button>
          <img
            src={selected.url}
            alt={product.name}
            className="pdp-lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
