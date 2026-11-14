import React, { useState } from 'react'
import { ImagePlus, Film, X, Link, Upload, Video, Image as ImageIcon, Plus } from 'lucide-react'
import { apiFetch } from '../../../config/api'
import './product-media.css'

export default function ProductMediaFields({ form, setForm, onUploading }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showMainUrlInput, setShowMainUrlInput] = useState(false)
  const [mainUrlText, setMainUrlText] = useState('')

  const [showGalleryUrlInput, setShowGalleryUrlInput] = useState(false)
  const [galleryUrlText, setGalleryUrlText] = useState('')
  const [galleryUrlType, setGalleryUrlType] = useState('image') // 'image' | 'video'

  const galleryItems = form.gallery || []

  // File upload handler
  async function handleFileUpload(event, isMain) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length || busy) return

    if (!isMain && files.length + galleryItems.length > 4) {
      setError('You can add up to 4 additional gallery items (5 media files total).')
      return
    }

    if (isMain && files.some((f) => !f.type.startsWith('image/'))) {
      setError('The main product visual must be an image file (JPG, PNG, WebP).')
      return
    }

    setBusy(true)
    if (onUploading) onUploading(true)
    setError('')

    try {
      const session = await apiFetch('auth.php?action=session')
      for (const file of files) {
        const isImage = file.type.startsWith('image/')
        const maxLimit = isImage ? 5 * 1024 * 1024 : 30 * 1024 * 1024
        if (file.size > maxLimit) {
          throw new Error(`${isImage ? 'Image' : 'Video'} exceeds size limit (${isImage ? '5 MB' : '30 MB'}).`)
        }

        const body = new FormData()
        body.append('file', file)
        body.append('csrfToken', session.csrfToken || '')

        const media = await apiFetch('media.php', { method: 'POST', body, timeout: 60000 })
        
        if (isMain) {
          setForm((prev) => ({ ...prev, mainImage: media.url }))
        } else {
          setForm((prev) => ({
            ...prev,
            gallery: [...(prev.gallery || []), { url: media.url, type: media.type || (isImage ? 'image' : 'video') }],
          }))
        }
      }
    } catch (err) {
      setError(err.message || 'Upload failed. You can also paste an image/video URL.')
    } finally {
      setBusy(false)
      if (onUploading) onUploading(false)
    }
  }

  // URL manual add handler for main image
  function applyMainUrl() {
    const trimmed = mainUrlText.trim()
    if (!trimmed) return
    setForm((prev) => ({ ...prev, mainImage: trimmed }))
    setMainUrlText('')
    setShowMainUrlInput(false)
    setError('')
  }

  // URL manual add handler for gallery
  function applyGalleryUrl() {
    const trimmed = galleryUrlText.trim()
    if (!trimmed) return
    if (galleryItems.length >= 4) {
      setError('Maximum 4 gallery items reached.')
      return
    }
    const detectedType = galleryUrlType === 'video' || /\.(mp4|webm|mov|ogg)($|\?)/i.test(trimmed) ? 'video' : 'image'
    setForm((prev) => ({
      ...prev,
      gallery: [...(prev.gallery || []), { url: trimmed, type: detectedType }],
    }))
    setGalleryUrlText('')
    setShowGalleryUrlInput(false)
    setError('')
  }

  function removeGalleryItem(index) {
    setForm((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="product-media-fields">
      <div className="apm-media-header">
        <div>
          <h4 className="apm-media-title">Product Media &amp; Visuals</h4>
          <p className="apm-field-hint">
            Provide <strong>1 Main Image</strong> (used on cards and hero) and up to <strong>4 additional images or videos</strong>. Total 5 media slots.
          </p>
        </div>
        <span className="apm-media-counter-pill">
          {galleryItems.length + (form.mainImage ? 1 : 0)} / 5 Media Slots Used
        </span>
      </div>

      {error && <div className="apm-media-alert" role="alert">{error}</div>}

      <div className="product-media-slots-grid">
        {/* ================= SLOT 1: MAIN IMAGE ================= */}
        <div className={`product-media-slot main-slot ${form.mainImage ? 'has-media' : ''}`}>
          <div className="slot-badge-row">
            <span className="slot-badge primary-badge">Main Image *</span>
            {form.mainImage && (
              <button
                type="button"
                className="slot-clear-btn"
                title="Remove main image"
                onClick={() => setForm((prev) => ({ ...prev, mainImage: '' }))}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="slot-preview-area">
            {form.mainImage ? (
              <img src={form.mainImage} alt="Main product preview" className="slot-media-img" />
            ) : (
              <div className="slot-empty-state">
                <ImagePlus size={36} className="empty-icon" />
                <span className="empty-text">Primary Storefront Image</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="slot-actions">
            <label className="product-upload-btn">
              <Upload size={13} />
              <span>{form.mainImage ? 'Change File' : 'Upload Image'}</span>
              <input
                aria-label="Upload main image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => handleFileUpload(e, true)}
              />
            </label>
            <button
              type="button"
              className="product-url-btn"
              onClick={() => setShowMainUrlInput(!showMainUrlInput)}
            >
              <Link size={13} />
              <span>URL</span>
            </button>
          </div>

          {showMainUrlInput && (
            <div className="slot-url-box">
              <input
                type="url"
                className="apm-input slot-url-input"
                placeholder="https://example.com/image.jpg"
                value={mainUrlText}
                onChange={(e) => setMainUrlText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyMainUrl(); } }}
              />
              <button type="button" className="slot-apply-btn" onClick={applyMainUrl}>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* ================= SLOTS 2 to 5: GALLERY ITEMS ================= */}
        {galleryItems.map((item, index) => (
          <div className="product-media-slot gallery-slot has-media" key={`${index}-${item.url}`}>
            <div className="slot-badge-row">
              <span className={`slot-badge ${item.type === 'video' ? 'video-badge' : 'gallery-badge'}`}>
                {item.type === 'video' ? <Video size={11} /> : <ImageIcon size={11} />}
                Gallery {index + 1} ({item.type.toUpperCase()})
              </span>
              <button
                type="button"
                className="slot-clear-btn"
                title="Remove gallery item"
                disabled={busy}
                onClick={() => removeGalleryItem(index)}
              >
                <X size={14} />
              </button>
            </div>

            <div className="slot-preview-area">
              {item.type === 'video' ? (
                <video src={item.url} controls preload="metadata" className="slot-media-video" />
              ) : (
                <img src={item.url} alt={`Gallery preview ${index + 1}`} className="slot-media-img" />
              )}
            </div>

            <div className="slot-meta-label">
              <span className="slot-meta-text">{item.type === 'video' ? 'Playable Video' : 'Gallery Image'}</span>
            </div>
          </div>
        ))}

        {/* ================= ADD NEW GALLERY ITEM CARD (IF < 4) ================= */}
        {galleryItems.length < 4 && (
          <div className="product-media-slot add-slot">
            <div className="slot-badge-row">
              <span className="slot-badge add-badge">Gallery Slot {galleryItems.length + 1} of 4</span>
            </div>

            <div className="slot-empty-state">
              <Film size={34} className="empty-icon" />
              <span className="empty-text">Add Additional Image or Video</span>
              <small className="empty-sub">MP4, WebM, JPG, PNG, WebP</small>
            </div>

            <div className="slot-actions">
              <label className="product-upload-btn">
                <Upload size={13} />
                <span>Upload File</span>
                <input
                  aria-label="Upload gallery images or videos"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  multiple
                  disabled={busy}
                  onChange={(e) => handleFileUpload(e, false)}
                />
              </label>
              <button
                type="button"
                className="product-url-btn"
                onClick={() => setShowGalleryUrlInput(!showGalleryUrlInput)}
              >
                <Link size={13} />
                <span>Add via URL</span>
              </button>
            </div>

            {showGalleryUrlInput && (
              <div className="slot-url-box">
                <div className="slot-type-selector">
                  <label className="slot-radio-label">
                    <input
                      type="radio"
                      name="galleryType"
                      value="image"
                      checked={galleryUrlType === 'image'}
                      onChange={() => setGalleryUrlType('image')}
                    />
                    <span>Image</span>
                  </label>
                  <label className="slot-radio-label">
                    <input
                      type="radio"
                      name="galleryType"
                      value="video"
                      checked={galleryUrlType === 'video'}
                      onChange={() => setGalleryUrlType('video')}
                    />
                    <span>Video (MP4/WebM)</span>
                  </label>
                </div>
                <input
                  type="url"
                  className="apm-input slot-url-input"
                  placeholder={galleryUrlType === 'video' ? 'https://example.com/demo.mp4' : 'https://example.com/photo.jpg'}
                  value={galleryUrlText}
                  onChange={(e) => setGalleryUrlText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyGalleryUrl(); } }}
                />
                <button type="button" className="slot-apply-btn" onClick={applyGalleryUrl}>
                  <Plus size={13} /> Add
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {busy && (
        <div className="apm-media-uploading-bar">
          <span className="media-spinner" />
          <span>Uploading media to hospital catalog storage…</span>
        </div>
      )}
    </div>
  )
}
