import { mediaUrl } from '../../../config/media'
import './operations.css'
import React, { useRef, useState } from 'react'
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Filter,
  FileSpreadsheet,
  Minus,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  TrendingDown,
  Warehouse,
  X,
} from 'lucide-react'

import royalCaninImg from '../../../assets/pdp-royal-canin-main.jpg'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the best available image URL for a product.
 * Prefers the actual DB mainImage, falls back to royalCanin placeholder.
 */
function getProductImage(prod) {
  // mainImage from product_content (uploaded or URL)
  const uploaded = mediaUrl(prod.mainImage || prod.imageType)
  if (uploaded) return uploaded
  // imageType can be a URL if set from mainImage by formatProduct()
  if (prod.imageType && prod.imageType.startsWith('/')) return prod.imageType
  if (prod.imageType && prod.imageType.startsWith('http')) return prod.imageType
  return royalCaninImg
}

function getStockQty(prod) {
  return prod.stockCount !== undefined ? prod.stockCount : prod.inStock ? 15 : 0
}

function stockState(qty) {
  if (qty === 0) return 'out'
  if (qty <= 5) return 'low'
  return 'ok'
}

const CATEGORY_LABELS = {
  food: 'Pet Food',
  healthcare: 'Healthcare',
  grooming: 'Grooming',
  accessories: 'Accessories',
  treats: 'Treats',
  toys: 'Toys',
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, variant = 'mint' }) {
  return (
    <div className="pm-kpi-card">
      <div className="pm-kpi-row">
        <span className="pm-kpi-label">{label}</span>
        <span className={`pm-kpi-icon-bubble pm-bubble-${variant}`}>
          <Icon size={16} />
        </span>
      </div>
      <strong className="pm-kpi-value">{value}</strong>
      <small className="pm-kpi-sub">{sub}</small>
    </div>
  )
}

function StockPill({ qty }) {
  const state = stockState(qty)
  const map = {
    ok:  { cls: 'pm-pill-ok',  label: 'In Stock' },
    low: { cls: 'pm-pill-low', label: 'Low Stock' },
    out: { cls: 'pm-pill-out', label: 'Out of Stock' },
  }
  const { cls, label } = map[state]
  return (
    <span className={`pm-stock-pill ${cls}`}>
      <span className="pm-pill-dot" />
      {label}
    </span>
  )
}

function StockBar({ qty, max = 30 }) {
  const pct   = Math.min(100, Math.round((qty / max) * 100))
  const state = stockState(qty)
  return (
    <div className="pm-stock-bar-wrap">
      <div className="pm-stock-bar-track">
        <div
          className={`pm-stock-bar-fill pm-bar-${state}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="pm-stock-bar-label">{qty} / {max}</span>
    </div>
  )
}

function CategoryBadge({ category }) {
  return <span className="pm-cat-badge">{CATEGORY_LABELS[category] || category}</span>
}

// ─── Restock Modal ─────────────────────────────────────────────────────────────

function RestockModal({ product, currentQty, onConfirm, onClose }) {
  const [addQty, setAddQty] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(null)
  const inputRef = useRef(null)

  const hasVariants = Array.isArray(product.sizes) && product.sizes.length > 0

  // Auto-focus input when modal opens
  React.useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  // If selected variant is chosen, compute its specific stock
  const activeVariant = selectedVariantIdx !== null && hasVariants ? product.sizes[selectedVariantIdx] : null
  const activeCurrentStock = activeVariant
    ? (activeVariant.stockCount !== undefined ? activeVariant.stockCount : 0)
    : currentQty

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    const n = parseInt(addQty, 10)
    if (!n || n <= 0) return
    setIsSubmitting(true)
    try {
      await onConfirm(n, selectedVariantIdx)
    } finally {
      setIsSubmitting(false)
    }
  }

  const presets = [5, 10, 20, 50]

  return (
    <div className="pm-restock-backdrop" onClick={isSubmitting ? undefined : onClose}>
      <div
        className="pm-restock-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Restock ${product.name}`}
      >
        {/* Header */}
        <div className="pm-restock-header">
          <div className="pm-restock-header-left">
            <span className="pm-restock-icon-wrap">
              <RefreshCcw size={18} />
            </span>
            <div>
              <h3 className="pm-restock-title">Restock Inventory</h3>
              <p className="pm-restock-subtitle">{product.name}</p>
            </div>
          </div>
          <button type="button" className="pm-restock-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Size Variant Selector Strip if product has variants */}
        {hasVariants && (
          <div className="pm-restock-variant-bar">
            <div className="pm-restock-variant-bar-title">
              <span>Select Option to Restock:</span>
            </div>
            <div className="pm-restock-variant-pills">
              <button
                type="button"
                className={`pm-restock-variant-pill ${selectedVariantIdx === null ? 'active' : ''}`}
                onClick={() => setSelectedVariantIdx(null)}
              >
                <span>📦 Entire Product</span>
                <small>({currentQty} total)</small>
              </button>
              {product.sizes.map((s, idx) => {
                const isSelected = selectedVariantIdx === idx
                const vStock = s.stockCount !== undefined ? s.stockCount : 0
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`pm-restock-variant-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedVariantIdx(idx)}
                  >
                    <span>{s.size || `Size #${idx + 1}`}</span>
                    <small>({vStock} left)</small>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Current stock display */}
        <div className="pm-restock-current-row">
          <div className="pm-restock-current-block">
            <span className="pm-restock-block-label">
              {activeVariant ? `${activeVariant.size} Stock` : 'Current Total Stock'}
            </span>
            <strong className={`pm-restock-block-val ${stockState(activeCurrentStock) === 'out' ? 'val-danger' : stockState(activeCurrentStock) === 'low' ? 'val-warn' : 'val-ok'}`}>
              {activeCurrentStock} units
            </strong>
          </div>
          <span className="pm-restock-arrow">→</span>
          <div className="pm-restock-current-block">
            <span className="pm-restock-block-label">
              {activeVariant ? 'After Variant Restock' : 'After Restock'}
            </span>
            <strong className="pm-restock-block-val val-ok">
              {activeCurrentStock + (parseInt(addQty, 10) || 0)} units
            </strong>
          </div>
          <div className="pm-restock-current-block">
            <span className="pm-restock-block-label">Location</span>
            <span className="pm-restock-loc">
              <Warehouse size={11} />
              {product.stockLocation || 'Colombo 07'}
            </span>
          </div>
        </div>

        {/* Quick preset buttons */}
        <div className="pm-restock-presets">
          <span className="pm-restock-preset-label">Quick Add:</span>
          {presets.map((n) => (
            <button
              key={n}
              type="button"
              className={`pm-restock-preset-btn ${addQty === n ? 'active' : ''}`}
              onClick={() => setAddQty(n)}
            >
              +{n}
            </button>
          ))}
        </div>

        {/* Custom quantity input */}
        <form onSubmit={handleSubmit} className="pm-restock-form">
          <label className="pm-restock-form-label" htmlFor="restock-qty">
            {activeVariant ? `Units to Add to "${activeVariant.size}"` : 'Units to Add'}
          </label>
          <div className="pm-restock-input-row">
            <button
              type="button"
              className="pm-restock-spinbtn"
              onClick={() => setAddQty((v) => Math.max(1, (parseInt(v, 10) || 0) - 1))}
            >
              <Minus size={14} />
            </button>
            <input
              ref={inputRef}
              id="restock-qty"
              type="number"
              min="1"
              max="9999"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              className="pm-restock-qty-input"
            />
            <button
              type="button"
              className="pm-restock-spinbtn"
              onClick={() => setAddQty((v) => (parseInt(v, 10) || 0) + 1)}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="pm-restock-actions">
            <button type="button" className="pm-restock-cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="pm-restock-confirm-btn"
              disabled={isSubmitting || !parseInt(addQty, 10) || parseInt(addQty, 10) <= 0}
            >
              <RefreshCcw size={14} className={isSubmitting ? 'animate-spin' : ''} />
              {isSubmitting
                ? 'Restocking...'
                : `Restock +${parseInt(addQty, 10) || 0} Units${activeVariant ? ` (${activeVariant.size})` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProductsManagement({
  adminProducts,
  productSearch,
  setProductSearch,
  productCategoryFilter,
  setProductCategoryFilter,
  handleOpenAddProduct,
  handleOpenImportProducts,
  handleOpenEditProduct,
  handleDeleteProduct,
  handleUpdateStockCount,
}) {
  const [stockStatusFilter, setStockStatusFilter] = useState('all')
  // null | product object
  const [restockingProduct, setRestockingProduct] = useState(null)

  // ── KPI Calculations ──
  const totalStockUnits = adminProducts.reduce((s, p) => s + getStockQty(p), 0)
  const lowStockItems   = adminProducts.filter((p) => { const q = getStockQty(p); return q > 0 && q <= 5 })
  const outOfStockItems = adminProducts.filter((p) => getStockQty(p) === 0 || !p.inStock)
  const inStockCount    = adminProducts.length - outOfStockItems.length

  // ── Filtering ──
  const filtered = adminProducts.filter((p) => {
    const qty = getStockQty(p)
    const q   = productSearch.toLowerCase().trim()
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q)) ||
      (p.stockLocation && p.stockLocation.toLowerCase().includes(q))
    const matchCat   = productCategoryFilter === 'all' || p.category === productCategoryFilter
    const matchStock =
      stockStatusFilter === 'all'          ? true :
      stockStatusFilter === 'in_stock'     ? qty > 5 && p.inStock :
      stockStatusFilter === 'low_stock'    ? qty > 0 && qty <= 5 && p.inStock :
      stockStatusFilter === 'out_of_stock' ? qty === 0 || !p.inStock :
      true
    return matchSearch && matchCat && matchStock
  })

  // ── Restock confirm handler (supports variantIndex) ──
  const handleRestockConfirm = async (addQty, variantIndex = null) => {
    if (!restockingProduct) return
    const saved = await handleUpdateStockCount(restockingProduct.id, addQty, variantIndex)
    if (saved) setRestockingProduct(null)
  }

  return (
    <div className="pm-page admin-operations-page">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="pm-page-header">
        <div className="pm-header-text">
          <span className="pm-eyebrow">Store Inventory Control</span>
          <h2 className="pm-page-title">Products &amp; Inventory</h2>
          <p className="pm-page-desc">
            Monitor real-time stock, adjust quantities, update pricing and manage pharmacy inventory.
          </p>
        </div>
        <div className="pm-header-actions">
          <button type="button" className="apm-cancel-btn" onClick={handleOpenImportProducts}>
            <FileSpreadsheet size={16} />
            Import Excel
          </button>
          <button type="button" className="pm-add-btn" onClick={handleOpenAddProduct}>
            <PackagePlus size={16} />
            Add New Product
          </button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────── */}
      <div className="pm-kpi-strip">
        <KpiCard
          icon={Package}
          label="Total Products"
          value={`${adminProducts.length} Items`}
          sub={`${totalStockUnits.toLocaleString()} total units`}
          variant="mint"
        />
        <KpiCard
          icon={CheckCircle2}
          label="In Stock"
          value={`${inStockCount} Available`}
          sub="Ready for delivery"
          variant="mint"
        />
        <KpiCard
          icon={AlertCircle}
          label="Low Stock Alerts"
          value={`${lowStockItems.length} Items Low`}
          sub={`${outOfStockItems.length} out of stock`}
          variant="salmon"
        />
        <KpiCard
          icon={TrendingDown}
          label="Out of Stock"
          value={`${outOfStockItems.length} Items`}
          sub="Requires re-order"
          variant="danger"
        />
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="pm-toolbar">
        {/* Search */}
        <div className="pm-search-box">
          <Search size={15} className="pm-search-icon" />
          <input
            type="text"
            placeholder="Search by name, SKU, brand or location…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pm-search-input"
          />
          {productSearch && (
            <button type="button" className="pm-search-clear" onClick={() => setProductSearch('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="pm-filter-pill">
          <Filter size={14} />
          <select
            value={productCategoryFilter}
            onChange={(e) => setProductCategoryFilter(e.target.value)}
            className="pm-filter-select"
          >
            <option value="all">All Categories</option>
            <option value="food">Pet Food</option>
            <option value="healthcare">Healthcare &amp; Pharma</option>
            <option value="grooming">Grooming</option>
            <option value="accessories">Accessories</option>
            <option value="treats">Treats</option>
            <option value="toys">Toys</option>
          </select>
        </div>

        {/* Stock filter */}
        <div className="pm-filter-pill">
          <Boxes size={14} />
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="pm-filter-select"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt; 5 units)</option>
            <option value="low_stock">Low Stock (1–5 units)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Result count badge */}
        <span className="pm-result-badge">
          {filtered.length} of {adminProducts.length}
        </span>
      </div>

      {/* ── Products Table ───────────────────────────────────────────── */}
      <div className="pm-table-card">
        <div className="pm-table-scroll">
          <table className="pm-table">
            <thead>
              <tr>
                <th className="pm-th pm-th-product">Product</th>
                <th className="pm-th pm-th-cat">Category</th>
                <th className="pm-th pm-th-price">Price</th>
                <th className="pm-th pm-th-inv">Inventory</th>
                <th className="pm-th pm-th-status">Status</th>
                <th className="pm-th pm-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pm-empty-row">
                    <Package size={32} />
                    <span>No products match your filters</span>
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const qty   = getStockQty(prod)
                  const state = stockState(qty)
                  const needsRestock = state === 'out' || state === 'low'

                  return (
                    <tr key={prod.id} className={`pm-row pm-row-${state}`}>

                      {/* Product details */}
                      <td className="pm-td pm-td-product">
                        <img
                          src={getProductImage(prod)}
                          alt={prod.name}
                          className="pm-thumb"
                          onError={(e) => { e.currentTarget.src = royalCaninImg }}
                        />
                        <div className="pm-prod-info">
                          <strong className="pm-prod-name">{prod.name}</strong>
                          <span className="pm-prod-meta">
                            SKU: {prod.id} &bull; {prod.brand || 'City Pet'}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="pm-td">
                        <CategoryBadge category={prod.category} />
                      </td>

                      {/* Price */}
                      <td className="pm-td pm-td-price">
                        <strong className="pm-price-main">
                          LKR {Number(prod.price).toLocaleString()}
                        </strong>
                        {prod.originalPrice && (
                          <span className="pm-price-orig">
                            LKR {Number(prod.originalPrice).toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Inventory */}
                      <td className="pm-td pm-td-inv">
                        <div className="pm-inv-cell">
                          <span className="pm-inv-qty-txt">{qty} units</span>
                          {Array.isArray(prod.sizes) && prod.sizes.length > 0 && (
                            <span className="pm-variant-count-badge" title={prod.sizes.map(s => `${s.size}: ${s.stockCount || 0}u`).join(', ')}>
                              {prod.sizes.length} variant{prod.sizes.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Status */}
                      <td className="pm-td">
                        <StockPill qty={qty} />
                      </td>

                      {/* Actions */}
                      <td className="pm-td pm-td-actions">
                        <div className="pm-action-group">

                          {/* Restock button — always visible, pulsing when needed */}
                          <button
                            type="button"
                            className={`pm-btn-restock ${needsRestock ? 'pm-btn-restock-urgent' : ''}`}
                            title="Restock inventory"
                            onClick={() => setRestockingProduct(prod)}
                          >
                            <RefreshCcw size={13} />
                            Restock
                          </button>

                          <button
                            type="button"
                            className="pm-btn-edit"
                            title="Edit Product"
                            onClick={() => handleOpenEditProduct(prod)}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="pm-btn-delete"
                            title="Delete Product"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer summary */}
        {filtered.length > 0 && (
          <div className="pm-table-footer">
            <span>
              Showing <strong>{filtered.length}</strong> product{filtered.length !== 1 ? 's' : ''}
            </span>
            <span className="pm-footer-divider" />
            <span className="pm-footer-stock-summary">
              <span className="pm-dot-ok" /> {inStockCount} In Stock &nbsp;
              <span className="pm-dot-low" /> {lowStockItems.length} Low &nbsp;
              <span className="pm-dot-out" /> {outOfStockItems.length} Out
            </span>
          </div>
        )}
      </div>

      {/* ── Restock Modal ────────────────────────────────────────────── */}
      {restockingProduct && (
        <RestockModal
          product={restockingProduct}
          currentQty={getStockQty(restockingProduct)}
          onConfirm={handleRestockConfirm}
          onClose={() => setRestockingProduct(null)}
        />
      )}
    </div>
  )
}
