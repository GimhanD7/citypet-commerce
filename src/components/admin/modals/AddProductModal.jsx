import React, { useEffect, useState } from 'react'
import { categoryService } from '../../../services/api'
import ProductMediaFields from './ProductMediaFields'
import {
  BookOpen,
  ClipboardList,
  Salad,
  ShieldCheck,
  Sliders,
  Plus,
  Trash2,
  X,
  Package,
  Sparkles,
} from 'lucide-react'

const CUSTOMER_TABS = [
  { key: 'description', label: 'Description', icon: BookOpen },
  { key: 'materials',   label: 'Materials, Safety & Specifications', icon: Salad },
  { key: 'usage',       label: 'Usage & Directions', icon: ClipboardList },
]

export default function AddProductModal({
  editingProduct,
  productForm,
  setProductForm,
  handleSaveProduct,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('description')
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')
  const [categoryLoadAttempt, setCategoryLoadAttempt] = useState(0)

  useEffect(() => {
    let mounted = true
    setCategoriesLoading(true)
    setCategoriesError('')
    async function loadCategories() {
      try {
        const data = await categoryService.getCategories({ allowFallback: false })
        if (!Array.isArray(data?.categories)) {
          throw new Error('Invalid categories response')
        }
        if (mounted) setCategories(data.categories)
      } catch (err) {
        if (mounted) {
          setCategories([])
          setCategoriesError('Unable to load categories. Please try again.')
        }
      } finally {
        if (mounted) setCategoriesLoading(false)
      }
    }
    loadCategories()
    return () => { mounted = false }
  }, [categoryLoadAttempt])

  const hasValidCategory = categories.some((category) => category.id === productForm.category)
  const canSaveCategory = !categoriesLoading && !categoriesError && hasValidCategory

  const set = (field) => (e) =>
    setProductForm({ ...productForm, [field]: e.target.value })

  // Stock status calculation
  const stockQty = Number(productForm.stockCount !== undefined ? productForm.stockCount : 15)
  const isOut = stockQty === 0 || !productForm.inStock
  const isLow = !isOut && stockQty <= 5

  // Preview tags
  const previewTags = (productForm.tags || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="apm-backdrop" onClick={() => { if (!uploading) onClose() }}>
      <div
        className="apm-card apm-card-pdp"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="apm-header">
          <div className="apm-header-left">
            <span className="apm-header-icon">
              <Package size={20} />
            </span>
            <div>
              <h3 className="apm-title">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="apm-subtitle">
                {editingProduct
                  ? editingProduct.name
                  : 'Customer Storefront Design Mode — Layout matches your live product detail page'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="apm-close-btn"
            disabled={uploading}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form Body ───────────────────────────────────────── */}
        <form
          onSubmit={(e) => {
            if (!canSaveCategory || uploading) {
              e.preventDefault()
              return
            }
            handleSaveProduct(e)
          }}
          className="apm-form"
        >
          <div className="apm-pdp-scroll">

            {/* ========================================================
                TOP SECTION: 2-Column Hero Grid (Customer PDP Style)
               ======================================================== */}
            <div className="apm-pdp-hero">

              {/* ── Left Column: Media Showcase ──────────────────── */}
              <div className="apm-pdp-media-col">
                <ProductMediaFields
                  form={productForm}
                  setForm={setProductForm}
                  onUploading={setUploading}
                />
              </div>

              {/* ── Right Column: Purchase Panel ─────────────────── */}
              <div className="apm-pdp-panel">

                {/* Brand Eyebrow */}
                <div className="apm-field-full">
                  <label className="apm-label" htmlFor="apm-brand">Brand</label>
                  <input
                    id="apm-brand"
                    type="text"
                    className="apm-pdp-brand-input"
                    placeholder="BRAND NAME"
                    value={productForm.brand || ''}
                    onChange={set('brand')}
                  />
                </div>

                {/* Product Title */}
                <div className="apm-field-full">
                  <label className="apm-label" htmlFor="apm-name">
                    Product Title <span className="apm-required">*</span>
                  </label>
                  <input
                    id="apm-name"
                    type="text"
                    required
                    className="apm-pdp-title-input"
                    placeholder="e.g. Royal Canin Mini Adult Dry Dog Food 2kg"
                    value={productForm.name || ''}
                    onChange={set('name')}
                  />
                </div>

                {/* Category & Pet Type Selectors */}
                <div className="apm-field-row">
                  <div className="apm-field">
                    <label className="apm-label" htmlFor="apm-category">
                      Category <span className="apm-required">*</span>
                    </label>
                    <select
                      id="apm-category"
                      className="apm-select"
                      value={hasValidCategory ? productForm.category : ''}
                      onChange={set('category')}
                      required
                      disabled={categoriesLoading || Boolean(categoriesError) || categories.length === 0}
                    >
                      <option value="" disabled>
                        {categoriesLoading ? 'Loading categories…' : 'Select a category'}
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="apm-field">
                    <label className="apm-label" htmlFor="apm-pettype">Pet Type</label>
                    <select
                      id="apm-pettype"
                      className="apm-select"
                      value={productForm.petType || 'dogs'}
                      onChange={set('petType')}
                    >
                      <option value="dogs">Dogs</option>
                      <option value="cats">Cats</option>
                      <option value="small-pets">Small Pets</option>
                      <option value="birds">Birds</option>
                    </select>
                  </div>
                </div>

                {/* Price & Original Price Row */}
                <div className="apm-pdp-price-row">
                  <div className="apm-pdp-price-box">
                    <span className="apm-pdp-price-currency">LKR</span>
                    <input
                      id="apm-price"
                      type="number"
                      required
                      min="0.01"
                      step="any"
                      className="apm-pdp-price-input"
                      placeholder="7950"
                      value={productForm.price || ''}
                      onChange={set('price')}
                    />
                  </div>
                  <div className="apm-pdp-price-box">
                    <span style={{ fontSize: '13px', color: '#7aa39e', fontWeight: 600 }}>Original LKR:</span>
                    <input
                      id="apm-orig-price"
                      type="number"
                      min="0"
                      step="any"
                      className="apm-pdp-orig-price-input"
                      placeholder="8500 (optional)"
                      value={productForm.originalPrice || ''}
                      onChange={set('originalPrice')}
                    />
                  </div>
                </div>

                {/* Short Summary Description */}
                <div className="apm-field-full">
                  <label className="apm-label" htmlFor="apm-short-desc">Short Tagline Summary</label>
                  <input
                    id="apm-short-desc"
                    type="text"
                    className="apm-pdp-short-desc-input"
                    placeholder="One-line summary tagline shown in catalog cards and under price..."
                    value={productForm.shortDescription || ''}
                    onChange={set('shortDescription')}
                  />
                </div>

                {/* Product Highlights / Badges */}
                <div className="apm-field-full">
                  <label className="apm-label" htmlFor="apm-tags">
                    <Sparkles size={13} className="apm-label-icon" />
                    Feature Highlights &amp; Badges
                  </label>
                  <textarea
                    id="apm-tags"
                    className="apm-textarea"
                    rows={2}
                    placeholder="One highlight per line (e.g. Vet Approved, 100% Genuine, Premium Quality)"
                    value={productForm.tags || ''}
                    onChange={set('tags')}
                  />
                  {previewTags.length > 0 && (
                    <div className="apm-pdp-pills-row" style={{ marginTop: '4px' }}>
                      {previewTags.map((tag, idx) => (
                        <span key={idx} className="pdp-feature-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Size / Variant Options */}
                <div className="apm-variants-card">
                  <div className="apm-variants-header">
                    <div className="apm-variants-title-block">
                      <label className="apm-variants-title">
                        <Sliders size={15} className="apm-label-icon" />
                        Size Variants &amp; Pricing
                      </label>
                      <p className="apm-variants-subtitle">
                        Add size options with custom pricing and individual stock units.
                      </p>
                    </div>
                    {(productForm.sizes || []).length > 0 && (
                      <div className="apm-variants-summary-chips">
                        <span className="apm-chip-variants">
                          {(productForm.sizes || []).length} Variant{(productForm.sizes || []).length > 1 ? 's' : ''}
                        </span>
                        <span className="apm-chip-stock">
                          {(productForm.sizes || []).reduce((sum, s) => sum + (parseInt(s.stockCount, 10) || 0), 0)} Total Units
                        </span>
                      </div>
                    )}
                  </div>

                  {(productForm.sizes || []).length === 0 ? (
                    <div className="apm-variants-empty">
                      <Package size={28} className="apm-variants-empty-icon" />
                      <p>No size variants defined yet.</p>
                      <span className="apm-variants-empty-hint">
                        This product uses single general pricing and top-level inventory below.
                      </span>
                    </div>
                  ) : (
                    <div className="apm-variants-table-wrap">
                      <div className="apm-variants-thead">
                        <span className="col-variant">Size / Variant</span>
                        <span className="col-price">Price (LKR)</span>
                        <span className="col-stock">Stock Units</span>
                        <span className="col-default" title="Pre-selected default option for customer">Default</span>
                        <span className="col-action"></span>
                      </div>
                      <div className="apm-variants-tbody">
                        {(productForm.sizes || []).map((size, index) => (
                          <div className="apm-variant-row" key={index}>
                            <div className="col-variant">
                              <input
                                className="apm-variant-input input-size"
                                aria-label={`Size variant ${index + 1}`}
                                placeholder="e.g. 500g, 2 kg, Large"
                                value={size.size || ''}
                                onChange={(e) => {
                                  const updated = (productForm.sizes || []).map((s, i) =>
                                    i === index ? { ...s, size: e.target.value } : s
                                  )
                                  setProductForm({ ...productForm, sizes: updated })
                                }}
                              />
                            </div>
                            <div className="col-price">
                              <div className="apm-variant-input-prefix-wrap">
                                <span className="apm-currency-tag">LKR</span>
                                <input
                                  className="apm-variant-input input-price"
                                  aria-label={`Price for variant ${index + 1}`}
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={size.price || ''}
                                  onChange={(e) => {
                                    const updated = (productForm.sizes || []).map((s, i) =>
                                      i === index ? { ...s, price: e.target.value } : s
                                    )
                                    setProductForm({ ...productForm, sizes: updated })
                                  }}
                                />
                              </div>
                            </div>
                            <div className="col-stock">
                              <div className="apm-variant-stock-input-wrap">
                                <input
                                  className="apm-variant-input input-stock"
                                  aria-label={`Stock units for variant ${index + 1}`}
                                  type="number"
                                  min="0"
                                  step="1"
                                  placeholder="Units"
                                  value={size.stockCount !== undefined ? size.stockCount : ''}
                                  onChange={(e) => {
                                    const newQty = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0)
                                    const updated = (productForm.sizes || []).map((s, i) =>
                                      i === index ? { ...s, stockCount: newQty } : s
                                    )
                                    // Auto-sync top-level stockCount to sum of all variant stocks
                                    const totalStock = updated.reduce(
                                      (sum, s) => sum + (parseInt(s.stockCount, 10) || 0),
                                      0
                                    )
                                    setProductForm({
                                      ...productForm,
                                      sizes: updated,
                                      stockCount: totalStock,
                                      inStock: totalStock > 0,
                                    })
                                  }}
                                />
                                <span className="apm-variant-unit-tag">units</span>
                              </div>
                            </div>
                            <div className="col-default">
                              <label className="apm-variant-radio-label" title="Set as default selected size">
                                <input
                                  type="radio"
                                  name="default_size_variant"
                                  checked={!!size.default}
                                  onChange={() => {
                                    const updated = (productForm.sizes || []).map((s, i) => ({
                                      ...s,
                                      default: i === index,
                                    }))
                                    setProductForm({ ...productForm, sizes: updated })
                                  }}
                                />
                                <span className="apm-variant-radio-custom" />
                              </label>
                            </div>
                            <div className="col-action">
                              <button
                                type="button"
                                className="apm-variant-delete-btn"
                                title="Remove variant"
                                onClick={() => {
                                  const updated = (productForm.sizes || []).filter((_, i) => i !== index)
                                  if (updated.length > 0 && !updated.some((s) => s.default)) {
                                    updated[0].default = true
                                  }
                                  const totalStock = updated.reduce(
                                    (sum, s) => sum + (parseInt(s.stockCount, 10) || 0),
                                    0
                                  )
                                  setProductForm({
                                    ...productForm,
                                    sizes: updated,
                                    stockCount: updated.length > 0 ? totalStock : (productForm.stockCount || 15),
                                    inStock: (updated.length > 0 ? totalStock : (productForm.stockCount || 15)) > 0,
                                  })
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="apm-variants-footer">
                    <button
                      type="button"
                      className="apm-add-variant-btn"
                      onClick={() => {
                        const currentSizes = productForm.sizes || []
                        const isFirst = currentSizes.length === 0
                        const updated = [
                          ...currentSizes,
                          {
                            size: '',
                            price: productForm.price || '',
                            stockCount: 10,
                            default: isFirst,
                          },
                        ]
                        const totalStock = updated.reduce(
                          (sum, s) => sum + (parseInt(s.stockCount, 10) || 0),
                          0
                        )
                        setProductForm({
                          ...productForm,
                          sizes: updated,
                          stockCount: totalStock,
                          inStock: totalStock > 0,
                        })
                      }}
                    >
                      <Plus size={15} />
                      Add Size Variant
                    </button>
                    {(productForm.sizes || []).length > 0 && (
                      <span className="apm-variants-note">
                        💡 Total product inventory is automatically calculated from variants ({stockQty} units total).
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Real-Time Inventory Panel Card */}
                <div className={`apm-pdp-stock-card ${isOut ? 'out-stock' : isLow ? 'low-stock' : 'in-stock'}`}>
                  <div className="apm-pdp-stock-header">
                    <div className="apm-pdp-stock-status-chip">
                      <span className="inventory-pulse-dot" />
                      <span>
                        {isOut
                          ? 'Out of Stock'
                          : isLow
                          ? `Low Stock Alert (${stockQty} left)`
                          : `In Stock (${stockQty} Available)`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#597370' }}>Total Units:</span>
                      <input
                        id="apm-stock-qty"
                        type="number"
                        min="0"
                        className="apm-pdp-stock-qty-input"
                        value={productForm.stockCount !== undefined ? productForm.stockCount : 15}
                        onChange={(e) => {
                          const qty = Math.max(0, parseInt(e.target.value, 10) || 0)
                          setProductForm({ ...productForm, stockCount: qty, inStock: qty > 0 })
                        }}
                        title={(productForm.sizes || []).length > 0 ? "Automatically summed from Size Variants" : "Total inventory units"}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="apm-label" style={{ fontSize: '11px', marginBottom: '4px' }}>
                      Pharmacy / Branch Location
                    </label>
                    <input
                      id="apm-location"
                      type="text"
                      className="apm-pdp-stock-loc-input"
                      placeholder="Colombo 07 Central Pharmacy"
                      value={productForm.stockLocation || 'Colombo 07 Central Pharmacy'}
                      onChange={set('stockLocation')}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* ========================================================
                BOTTOM SECTION: Customer Tabs (Matching PDP Tabs)
               ======================================================== */}
            <div className="apm-pdp-tabs-section">
              {/* Tab Navigation */}
              <div className="apm-pdp-tabs-nav">
                {CUSTOMER_TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    className={`apm-pdp-tab-nav-btn ${activeTab === key ? 'active' : ''}`}
                    onClick={() => setActiveTab(key)}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Description */}
              {activeTab === 'description' && (
                <div className="apm-pdp-tab-pane">
                  <div className="apm-textarea-label-row">
                    <label className="apm-label" htmlFor="apm-description">
                      <BookOpen size={14} className="apm-label-icon" />
                      Product Description
                    </label>
                    <span className="apm-char-count">{(productForm.description || '').length} chars</span>
                  </div>
                  <textarea
                    id="apm-description"
                    className="apm-textarea"
                    rows={6}
                    placeholder="Write the full product description shown under the Description tab on the customer page..."
                    value={productForm.description || ''}
                    onChange={set('description')}
                  />
                </div>
              )}

              {/* Tab 2: Materials, Safety & Specifications */}
              {activeTab === 'materials' && (
                <div className="apm-pdp-tab-pane">
                  {/* Construction & Materials */}
                  <div className="apm-field-full">
                    <div className="apm-textarea-label-row">
                      <label className="apm-label" htmlFor="apm-ingredients">
                        <Salad size={14} className="apm-label-icon" />
                        Construction &amp; Materials / Key Ingredients
                      </label>
                      <span className="apm-char-count">{(productForm.ingredients || '').length} chars</span>
                    </div>
                    <textarea
                      id="apm-ingredients"
                      className="apm-textarea"
                      rows={3}
                      placeholder="e.g. Soft plush textile, non-toxic reinforced inner core, or poultry protein, rice, beet pulp..."
                      value={productForm.ingredients || ''}
                      onChange={set('ingredients')}
                    />
                  </div>

                  {/* Quality & Safety Standards */}
                  <div className="apm-field-full">
                    <div className="apm-textarea-label-row">
                      <label className="apm-label" htmlFor="apm-additives">
                        <ShieldCheck size={14} className="apm-label-icon" />
                        Quality &amp; Safety Standards
                      </label>
                      <span className="apm-char-count">{(productForm.additives || '').length} chars</span>
                    </div>
                    <textarea
                      id="apm-additives"
                      className="apm-textarea"
                      rows={3}
                      placeholder="e.g. 100% genuine import. Formulated without harsh chemicals, toxic binders, or hazardous materials."
                      value={productForm.additives || ''}
                      onChange={set('additives')}
                    />
                  </div>

                  {/* Guaranteed Specifications */}
                  <div className="apm-field-full">
                    <div className="apm-textarea-label-row">
                      <label className="apm-label">
                        <Sliders size={14} className="apm-label-icon" />
                        Guaranteed Specifications Table
                      </label>
                      <span className="apm-char-count">
                        {(productForm.analysis || []).length} spec{(productForm.analysis || []).length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="apm-field-hint" style={{ marginBottom: '8px' }}>
                      Values displayed in the Guaranteed Specifications table on the customer page.
                    </p>

                    <div className="apm-feeding-table-wrap">
                      <table className="apm-feeding-table">
                        <thead>
                          <tr>
                            <th className="apm-ft-th" style={{ width: '45%' }}>Specification / Metric</th>
                            <th className="apm-ft-th" style={{ width: '45%' }}>Value / Standard</th>
                            <th className="apm-ft-th apm-ft-th-action" style={{ width: '10%' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(Array.isArray(productForm.analysis) ? productForm.analysis : []).map((row, idx) => (
                            <tr key={idx} className="apm-ft-row">
                              <td className="apm-ft-td">
                                <input
                                  className="apm-input apm-ft-input"
                                  placeholder="e.g. Material Grade"
                                  value={row.nutrient || ''}
                                  onChange={(e) => {
                                    const rows = [...(productForm.analysis || [])]
                                    rows[idx] = { ...rows[idx], nutrient: e.target.value }
                                    setProductForm({ ...productForm, analysis: rows })
                                  }}
                                />
                              </td>
                              <td className="apm-ft-td">
                                <input
                                  className="apm-input apm-ft-input"
                                  placeholder="e.g. Reinforced Plush Textile"
                                  value={row.value || ''}
                                  onChange={(e) => {
                                    const rows = [...(productForm.analysis || [])]
                                    rows[idx] = { ...rows[idx], value: e.target.value }
                                    setProductForm({ ...productForm, analysis: rows })
                                  }}
                                />
                              </td>
                              <td className="apm-ft-td apm-ft-td-action">
                                <button
                                  type="button"
                                  className="apm-ft-remove-btn"
                                  title="Remove specification"
                                  onClick={() => {
                                    const rows = (productForm.analysis || []).filter((_, i) => i !== idx)
                                    setProductForm({ ...productForm, analysis: rows })
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {(productForm.analysis || []).length === 0 && (
                        <div className="apm-ft-empty">
                          <Sliders size={20} />
                          <span>No custom specifications added yet. (Customer page will display default brand &amp; pet origin).</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="apm-ft-add-btn"
                      onClick={() => {
                        const rows = [...(Array.isArray(productForm.analysis) ? productForm.analysis : [])]
                        rows.push({ nutrient: '', value: '' })
                        setProductForm({ ...productForm, analysis: rows })
                      }}
                    >
                      <Plus size={14} />
                      Add Specification
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Usage & Directions */}
              {activeTab === 'usage' && (
                <div className="apm-pdp-tab-pane">
                  <div className="apm-textarea-label-row">
                    <label className="apm-label">
                      <ClipboardList size={14} className="apm-label-icon" />
                      Daily Recommended Usage &amp; Directions
                    </label>
                    <span className="apm-char-count">
                      {(productForm.feedingGuide || []).length} row{(productForm.feedingGuide || []).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="apm-field-hint" style={{ marginBottom: '8px' }}>
                    Follow recommended guidelines below. For clinical questions, speak with our City Pet hospital team anytime.
                  </p>

                  <div className="apm-feeding-table-wrap">
                    <table className="apm-feeding-table">
                      <thead>
                        <tr>
                          <th className="apm-ft-th">Pet Size / Weight</th>
                          <th className="apm-ft-th">Standard Guideline</th>
                          <th className="apm-ft-th">Notes / Activity</th>
                          <th className="apm-ft-th apm-ft-th-action"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(productForm.feedingGuide) ? productForm.feedingGuide : []).map((row, idx) => (
                          <tr key={idx} className="apm-ft-row">
                            <td className="apm-ft-td">
                              <input
                                className="apm-input apm-ft-input"
                                placeholder="e.g. Small (1–4 kg)"
                                value={row.petSize || row.dogWeight || ''}
                                onChange={(e) => {
                                  const rows = [...(productForm.feedingGuide || [])]
                                  rows[idx] = { ...rows[idx], petSize: e.target.value, dogWeight: e.target.value }
                                  setProductForm({ ...productForm, feedingGuide: rows })
                                }}
                              />
                            </td>
                            <td className="apm-ft-td">
                              <input
                                className="apm-input apm-ft-input"
                                placeholder="e.g. 35–80 g per day"
                                value={row.standardGuideline || row.normalActivity || ''}
                                onChange={(e) => {
                                  const rows = [...(productForm.feedingGuide || [])]
                                  rows[idx] = { ...rows[idx], standardGuideline: e.target.value, normalActivity: e.target.value }
                                  setProductForm({ ...productForm, feedingGuide: rows })
                                }}
                              />
                            </td>
                            <td className="apm-ft-td">
                              <input
                                className="apm-input apm-ft-input"
                                placeholder="e.g. Active dogs +10%"
                                value={row.notesActivity || row.highActivity || ''}
                                onChange={(e) => {
                                  const rows = [...(productForm.feedingGuide || [])]
                                  rows[idx] = { ...rows[idx], notesActivity: e.target.value, highActivity: e.target.value }
                                  setProductForm({ ...productForm, feedingGuide: rows })
                                }}
                              />
                            </td>
                            <td className="apm-ft-td apm-ft-td-action">
                              <button
                                type="button"
                                className="apm-ft-remove-btn"
                                title="Remove row"
                                onClick={() => {
                                  const rows = (productForm.feedingGuide || []).filter((_, i) => i !== idx)
                                  setProductForm({ ...productForm, feedingGuide: rows })
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {(productForm.feedingGuide || []).length === 0 && (
                      <div className="apm-ft-empty">
                        <ClipboardList size={20} />
                        <span>No guidelines added yet. Click "Add Row" to start.</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="apm-ft-add-btn"
                    onClick={() => {
                      const rows = [...(Array.isArray(productForm.feedingGuide) ? productForm.feedingGuide : [])]
                      rows.push({
                        petSize: '',
                        standardGuideline: '',
                        notesActivity: '',
                        dogWeight: '',
                        normalActivity: '',
                        highActivity: '',
                      })
                      setProductForm({ ...productForm, feedingGuide: rows })
                    }}
                  >
                    <Plus size={14} />
                    Add Guideline Row
                  </button>
                </div>
              )}

            </div>

          </div>

          {/* ── Footer Actions ──────────────────────────────────── */}
          <div className="apm-footer">
            <button
              type="button"
              className="apm-cancel-btn"
              disabled={uploading}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="apm-submit-btn"
              disabled={!canSaveCategory || uploading}
            >
              <Package size={15} />
              {editingProduct ? 'Save Product Changes' : 'Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
