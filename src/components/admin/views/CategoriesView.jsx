import React, { useEffect, useState } from 'react'
import {
  Edit2,
  Grid3X3,
  Layers,
  Package,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react'

import { categoryService } from '../../../services/api'
import { apiFetch } from '../../../config/api'

// ─── Default data ──────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['🥣','🦴','🪮','🦮','➕','🎾','🐶','🐱','🐾','🐠','🐦','🐹','🌿','💊','🛁','🎀','🧸','🏆','⭐','🌟']

const COLOR_PRESETS = [
  { bg: '#fdf2e9', accent: '#d97706' },
  { bg: '#fbf0f3', accent: '#e91e8c' },
  { bg: '#f0f5fa', accent: '#2563eb' },
  { bg: '#eefaf7', accent: '#0d8a4d' },
  { bg: '#e9f7f4', accent: '#0e5d59' },
  { bg: '#f5f0fb', accent: '#7c3aed' },
  { bg: '#fff0e6', accent: '#ea580c' },
  { bg: '#eef8f6', accent: '#04959d' },
  { bg: '#fff5f5', accent: '#d93838' },
  { bg: '#f8f0ff', accent: '#9333ea' },
]

// ─── Category Modal ────────────────────────────────────────────────────────────

function CategoryModal({ category, allProducts, onSave, onClose, saving }) {
  const isEdit = Boolean(category)
  const [form, setForm] = useState({
    name:        category?.name        || '',
    slug:        category?.slug        || '',
    emoji:       category?.emoji       || '📦',
    color:       category?.color       || '#eefaf7',
    accent:      category?.accent      || '#0e5d59',
    description: category?.description || '',
  })

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const autoSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleNameChange = (e) => {
    const name = e.target.value
    setForm((p) => ({ ...p, name, slug: isEdit ? p.slug : autoSlug(name) }))
  }

  const prodCount = allProducts.filter((p) => p.category === form.slug || p.id === form.slug).length

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.slug.trim()) return
    onSave({
      id:          isEdit ? category.id : form.slug,
      ...form,
      slug:        form.slug || autoSlug(form.name),
    })
  }

  return (
    <div className="cat-modal-backdrop" onClick={onClose}>
      <div className="cat-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">

        {/* Header */}
        <div className="cat-modal-header">
          <div className="cat-modal-header-left">
            <span className="cat-modal-icon-wrap" style={{ background: form.color, color: form.accent }}>
              <Layers size={20} />
            </span>
            <div>
              <h3 className="cat-modal-title">{isEdit ? 'Edit Category' : 'Add New Category'}</h3>
              {isEdit && <p className="cat-modal-sub">{category.name}</p>}
            </div>
          </div>
          <button type="button" className="cat-modal-close" onClick={onClose}><X size={17} /></button>
        </div>

        <form onSubmit={handleSubmit} className="cat-modal-form">

          {/* Preview card */}
          <div className="cat-preview-row">
            <div className="cat-preview-card" style={{ background: form.color }}>
              <span className="cat-preview-emoji">{form.emoji}</span>
              <div className="cat-preview-texts">
                <strong style={{ color: form.accent }}>{form.name || 'Category Name'}</strong>
                <small>{prodCount} product{prodCount !== 1 ? 's' : ''}</small>
              </div>
            </div>
            <p className="cat-preview-hint">Live preview of the category card</p>
          </div>

          {/* Name & Slug */}
          <div className="cat-field-row">
            <div className="cat-field">
              <label className="cat-label">Category Name *</label>
              <input
                type="text" required
                className="cat-input"
                placeholder="e.g. Pet Food"
                value={form.name}
                onChange={handleNameChange}
              />
            </div>
            <div className="cat-field">
              <label className="cat-label">URL Slug *</label>
              <input
                type="text" required
                className="cat-input"
                placeholder="e.g. pet-food"
                value={form.slug}
                readOnly={isEdit}
                onChange={set('slug')}
              />
            </div>
          </div>

          {/* Description */}
          <div className="cat-field-full">
            <label className="cat-label">Description</label>
            <textarea
              className="cat-textarea"
              rows={2}
              placeholder="Short description shown under the category name..."
              value={form.description}
              onChange={set('description')}
            />
          </div>

          {/* Emoji picker */}
          <div className="cat-field-full">
            <label className="cat-label">Icon / Emoji</label>
            <div className="cat-emoji-grid">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e} type="button"
                  className={`cat-emoji-btn ${form.emoji === e ? 'active' : ''}`}
                  style={form.emoji === e ? { background: form.color, outline: `2px solid ${form.accent}` } : {}}
                  onClick={() => setForm((p) => ({ ...p, emoji: e }))}
                >
                  {e}
                </button>
              ))}
              {/* Custom emoji input */}
              <input
                type="text" maxLength={2}
                className="cat-emoji-custom"
                placeholder="✏️"
                value={EMOJI_OPTIONS.includes(form.emoji) ? '' : form.emoji}
                onChange={(e) => setForm((p) => ({ ...p, emoji: e.target.value || p.emoji }))}
                title="Type a custom emoji"
              />
            </div>
          </div>

          {/* Color presets */}
          <div className="cat-field-full">
            <label className="cat-label">Colour Theme</label>
            <div className="cat-color-row">
              {COLOR_PRESETS.map((c, i) => (
                <button
                  key={i} type="button"
                  className={`cat-color-swatch ${form.color === c.bg ? 'active' : ''}`}
                  style={{ background: c.bg, outline: form.color === c.bg ? `2.5px solid ${c.accent}` : '2px solid transparent' }}
                  onClick={() => setForm((p) => ({ ...p, color: c.bg, accent: c.accent }))}
                  title={c.accent}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="cat-modal-footer">
            <button type="button" className="cat-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving} className="cat-submit-btn" style={{ background: form.accent }}>
              <Layers size={14} />
              {isEdit ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Category Card ─────────────────────────────────────────────────────────────

function CategoryCard({ cat, productCount, onEdit, onDelete }) {
  return (
    <div className="cat-card" style={{ background: cat.color }}>
      {/* Top row: emoji + actions */}
      <div className="cat-card-top">
        <span className="cat-card-emoji">{cat.emoji}</span>
        <div className="cat-card-actions">
          <button type="button" className="cat-card-edit-btn" title="Edit" onClick={() => onEdit(cat)}
            style={{ color: cat.accent }}>
            <Edit2 size={14} />
          </button>
          <button type="button" className="cat-card-del-btn" title="Delete" onClick={() => onDelete(cat)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Name */}
      <strong className="cat-card-name" style={{ color: cat.accent }}>{cat.name}</strong>

      {/* Description */}
      {cat.description && (
        <p className="cat-card-desc">{cat.description}</p>
      )}

      {/* Footer pill */}
      <div className="cat-card-foot">
        <span className="cat-card-count-pill" style={{ background: cat.accent + '18', color: cat.accent }}>
          <Package size={11} />
          {productCount} product{productCount !== 1 ? 's' : ''}
        </span>
        <span className="cat-card-slug">/{cat.slug}</span>
      </div>
    </div>
  )
}

// ─── Main View ─────────────────────────────────────────────────────────────────

export default function CategoriesView({ adminProducts = [], showToast }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState(null)   // null | 'add' | category object

  const filtered = categories.filter((c) =>
    !search.trim() ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  const productCountFor = (category) => Number(category.count || 0)

  const totalProducts = categories.reduce((total, category) => total + productCountFor(category), 0)

  async function loadCategories() {
    setLoading(true)
    setError('')
    try {
      const data = await categoryService.getCategories({ allowFallback: false })
      setCategories(data.categories.map((category) => ({
        ...category,
        slug: category.id,
        emoji: category.emoji ?? category.icon ?? '',
        color: category.color ?? category.bg ?? '#eefaf7',
        accent: category.accent || '#0e5d59',
        description: category.description || '',
      })))
    } catch (failure) {
      setError(failure.message || 'Unable to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCategories() }, [])

  async function handleSave(data) {
    if (saving) return
    setSaving(true)
    setError('')
    try {
      const session = await apiFetch('auth.php?action=session')
      const editing = modal !== 'add'
      await apiFetch(`categories.php?id=${encodeURIComponent(data.id)}`, {
        method: editing ? 'PUT' : 'POST',
        body: { ...data, icon: data.emoji, bg: data.color, csrfToken: session.csrfToken },
      })
      await loadCategories()
      setModal(null)
      showToast?.('Category saved.')
    } catch (failure) {
      setError(failure.message)
      showToast?.(failure.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(category) {
    if (saving || !window.confirm(`Delete category "${category.name}"?`)) return
    setSaving(true)
    setError('')
    try {
      const session = await apiFetch('auth.php?action=session')
      await apiFetch(`categories.php?id=${encodeURIComponent(category.id)}`, {
        method: 'DELETE', body: { csrfToken: session.csrfToken },
      })
      await loadCategories()
      showToast?.('Category deleted.')
    } catch (failure) {
      setError(failure.message)
      showToast?.(failure.message)
    } finally {
      setSaving(false)
    }
  }

  // Summary KPIs
  const totalCats     = categories.length
  const mostPopular   = [...categories].sort((a, b) => productCountFor(b) - productCountFor(a))[0]
  const emptyCats     = categories.filter((c) => productCountFor(c) === 0).length

  return (
    <div className="cat-page">
      {loading && <p role="status">Loading categories…</p>}
      {error && <p role="alert">{error}</p>}

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="cat-page-header">
        <div className="cat-header-text">
          <span className="cat-eyebrow">Store Organisation</span>
          <h2 className="cat-page-title">Categories</h2>
          <p className="cat-page-desc">
            Organise your product catalogue into categories displayed in the online store.
          </p>
        </div>
        <button type="button" className="cat-add-btn" onClick={() => setModal('add')}>
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────── */}
      <div className="cat-kpi-strip">
        <div className="cat-kpi-card">
          <div className="cat-kpi-top">
            <span className="cat-kpi-label">Total Categories</span>
            <span className="cat-kpi-icon cat-kpi-mint"><Layers size={16} /></span>
          </div>
          <strong className="cat-kpi-value">{totalCats}</strong>
          <small className="cat-kpi-sub">Active store sections</small>
        </div>
        <div className="cat-kpi-card">
          <div className="cat-kpi-top">
            <span className="cat-kpi-label">Total Products</span>
            <span className="cat-kpi-icon cat-kpi-mint"><Package size={16} /></span>
          </div>
          <strong className="cat-kpi-value">{totalProducts}</strong>
          <small className="cat-kpi-sub">Across all categories</small>
        </div>
        <div className="cat-kpi-card">
          <div className="cat-kpi-top">
            <span className="cat-kpi-label">Most Popular</span>
            <span className="cat-kpi-icon cat-kpi-mint"><Tag size={16} /></span>
          </div>
          <strong className="cat-kpi-value">{mostPopular?.emoji} {mostPopular?.name || '—'}</strong>
          <small className="cat-kpi-sub">{mostPopular ? `${productCountFor(mostPopular)} products` : 'No data'}</small>
        </div>
        <div className="cat-kpi-card">
          <div className="cat-kpi-top">
            <span className="cat-kpi-label">Empty Categories</span>
            <span className={`cat-kpi-icon ${emptyCats > 0 ? 'cat-kpi-warn' : 'cat-kpi-mint'}`}><Grid3X3 size={16} /></span>
          </div>
          <strong className="cat-kpi-value">{emptyCats}</strong>
          <small className="cat-kpi-sub">{emptyCats > 0 ? 'No products assigned' : 'All have products'}</small>
        </div>
      </div>

      {/* ── Search toolbar ──────────────────────────────────── */}
      <div className="cat-toolbar">
        <div className="cat-search-box">
          <Search size={14} className="cat-search-icon" />
          <input
            type="text"
            placeholder="Search categories by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="cat-search-input"
          />
          {search && (
            <button type="button" className="cat-search-clear" onClick={() => setSearch('')}>
              <X size={12} />
            </button>
          )}
        </div>
        <span className="cat-result-badge">
          {filtered.length} of {categories.length} categories
        </span>
      </div>

      {/* ── Category Card Grid ──────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="cat-empty-state">
          <Layers size={40} />
          <strong>No categories found</strong>
          <p>Try a different search term or add a new category.</p>
        </div>
      ) : (
        <div className="cat-grid">
          {filtered.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              productCount={productCountFor(cat)}
              onEdit={(c) => setModal(c)}
              onDelete={handleDelete}
            />
          ))}

          {/* Add-new shortcut card */}
          <button type="button" className="cat-add-card-btn" onClick={() => setModal('add')}>
            <Plus size={28} />
            <span>Add Category</span>
          </button>
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────── */}
      {modal && (
        <CategoryModal
          saving={saving}
          category={modal === 'add' ? null : modal}
          allProducts={adminProducts}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
