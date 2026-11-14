import React, { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Filter,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  Trash2,
  User,
  UserRound,
  X,
} from 'lucide-react'
import { apiFetch } from '../../../config/api'
import { activityService } from '../../../services/api'
import './users.css'
import './reviews.css'

export default function ReviewsView({ adminProducts = [], showToast }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'admin' | 'user'

  // Edit Review Modal State
  const [editingReview, setEditingReview] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const editDialogRef = useRef(null)

  // Add Review Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [addError, setAddError] = useState('')
  const [reviewForm, setReviewForm] = useState({
    productId: '',
    authorName: 'Dr. Sanjeewa (Hospital Director)',
    rating: 5,
    title: '',
    comment: '',
    role: 'admin',
  })

  // Synchronize dialog ref with editingReview state
  useEffect(() => {
    const dialog = editDialogRef.current
    if (!dialog) return
    if (editingReview && !dialog.open) {
      dialog.showModal()
    } else if (!editingReview && dialog.open) {
      dialog.close()
    }
  }, [editingReview])

  // Load reviews from API or fallback
  const loadReviews = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('reviews.php?all=1')
      setReviews(Array.isArray(res?.reviews) ? res.reviews : [])
      setCsrfToken(res?.csrfToken || '')
    } catch (err) {
      console.warn('Could not fetch all reviews from server:', err)
      setReviews([])
      setCsrfToken('')
      if (showToast) showToast(err.message || 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  // Keep the table in step with the latest server response.
  const persistReviews = (updated) => {
    setReviews(updated)
  }

  // Delete Review
  const handleDeleteReview = async (review) => {
    if (!window.confirm(`Are you sure you want to delete review "${review.title}" by ${review.author}?`)) {
      return
    }

    try {
      await apiFetch(`reviews.php?id=${encodeURIComponent(review.id)}`, { method: 'DELETE' })
      const filtered = reviews.filter((r) => r.id !== review.id)
      persistReviews(filtered)
      activityService.logActivity({
        action: 'REVIEW_DELETE',
        description: `Removed review ID #${review.id} for "${review.product_name || review.product_id}".`,
        entityType: 'review',
        entityId: String(review.id),
      })
      if (showToast) showToast('Review deleted successfully.')
    } catch (err) {
      if (showToast) showToast(err.message || 'Unable to delete review.')
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (rev) => {
    setEditingReview({
      id: rev.id,
      productId: rev.product_id || '',
      productName: rev.product_name || rev.product_id || '',
      author: rev.author || '',
      role: rev.author_role || (rev.is_admin ? 'admin' : 'user'),
      rating: Number(rev.rating) || 5,
      title: rev.title || '',
      comment: rev.comment || '',
      date: rev.date || 'Today',
    })
    setEditError('')
  }

  // Save Edited Review
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingReview) return

    if (!editingReview.author.trim()) {
      setEditError('Reviewer name is required.')
      return
    }
    if (!editingReview.title.trim() || !editingReview.comment.trim()) {
      setEditError('Please provide both a title and review comment.')
      return
    }

    setEditSaving(true)
    setEditError('')

    const selectedProd = adminProducts.find((p) => p.id === editingReview.productId)
    const updatedReview = {
      ...editingReview,
      product_id: editingReview.productId,
      product_name: selectedProd ? selectedProd.name : editingReview.productName,
      author: editingReview.author.trim(),
      author_role: editingReview.role,
      is_admin: editingReview.role === 'admin',
      rating: Number(editingReview.rating),
      title: editingReview.title.trim(),
      comment: editingReview.comment.trim(),
    }

    try {
      await apiFetch(`reviews.php?id=${encodeURIComponent(editingReview.id)}`, {
        method: 'PUT',
        body: {
          id: editingReview.id,
          productId: editingReview.productId,
          author: editingReview.author.trim(),
          rating: Number(editingReview.rating),
          title: editingReview.title.trim(),
          comment: editingReview.comment.trim(),
          csrfToken,
        },
      })
      const list = reviews.map((r) => (r.id === editingReview.id ? updatedReview : r))
      persistReviews(list)
      activityService.logActivity({
        action: 'REVIEW_UPDATE',
        description: `Updated review #${editingReview.id} for "${updatedReview.product_name}".`,
        entityType: 'review',
        entityId: String(editingReview.id),
      })
      if (showToast) showToast(`Review #${editingReview.id} updated successfully!`)
      setEditingReview(null)
    } catch (err) {
      setEditError(err.message || 'Unable to update review.')
    } finally {
      setEditSaving(false)
    }
  }

  // Create New Admin Review
  const handleCreateAdminReview = async (e) => {
    e.preventDefault()
    if (!reviewForm.productId) {
      alert('Please select a target product.')
      return
    }
    if (!reviewForm.authorName.trim() || !reviewForm.title.trim() || !reviewForm.comment.trim()) {
      alert('Please fill out reviewer name, headline and review content.')
      return
    }

    setAddSaving(true)
    setAddError('')
    const selectedProd = adminProducts.find((p) => p.id === reviewForm.productId)
    const newRev = {
      id: Date.now(),
      product_id: reviewForm.productId,
      product_name: selectedProd ? selectedProd.name : reviewForm.productId,
      author: reviewForm.authorName.trim(),
      author_role: reviewForm.role,
      is_admin: reviewForm.role === 'admin',
      rating: Number(reviewForm.rating),
      title: reviewForm.title.trim(),
      comment: reviewForm.comment.trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }

    try {
      const created = await apiFetch('reviews.php', {
        method: 'POST',
        body: {
          productId: reviewForm.productId,
          rating: Number(reviewForm.rating),
          title: reviewForm.title.trim(),
          comment: reviewForm.comment.trim(),
          authorName: reviewForm.authorName.trim(),
          role: reviewForm.role,
          csrfToken,
        },
      })
      await loadReviews()
      activityService.logActivity({
        action: 'REVIEW_ADD',
        description: `Added review for "${newRev.product_name}" by "${newRev.author}".`,
        entityType: 'review',
        entityId: String(created?.id || newRev.id),
      })
      if (showToast) showToast('Review published successfully!')
      setIsAddModalOpen(false)
      setReviewForm({
        productId: '',
        authorName: 'Dr. Sanjeewa (Hospital Director)',
        rating: 5,
        title: '',
        comment: '',
        role: 'admin',
      })
    } catch (err) {
      setAddError(err.message || 'Unable to publish review.')
    } finally {
      setAddSaving(false)
    }
  }

  // Filter logic
  const filteredReviews = reviews.filter((r) => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch =
      !q ||
      [r.title, r.comment, r.author, r.product_name, String(r.id), r.product_id].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )

    const matchesProduct = productFilter === 'all' || r.product_id === productFilter
    const matchesRating = ratingFilter === 'all' || r.rating === Number(ratingFilter)
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'admin' && (r.is_admin || r.author_role === 'admin')) ||
      (typeFilter === 'user' && !r.is_admin && r.author_role !== 'admin')

    return matchesSearch && matchesProduct && matchesRating && matchesType
  })

  // KPI calculations
  const totalReviewsCount = reviews.length
  const avgRating = totalReviewsCount
    ? (reviews.reduce((s, r) => s + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '0.0'
  const adminReviewsCount = reviews.filter((r) => r.is_admin || r.author_role === 'admin').length
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length

  return (
    <div className="pm-page reviews-admin-page">
      {/* ── Page Header matching UsersView & ProductsManagement ── */}
      <div className="pm-page-header">
        <div>
          <span className="pm-eyebrow">Customer Ratings &amp; Clinical Feedback</span>
          <h2 className="pm-page-title">Reviews Management</h2>
          <p className="pm-page-desc">
            Manage registered customer feedback, reviewer identities, ratings, and publish official veterinary endorsements.
          </p>
        </div>
        <div className="pm-header-actions">
          <button
            type="button"
            className="pm-add-btn"
            onClick={() => {
              setAddError('')
              setIsAddModalOpen(true)
            }}
          >
            <Plus size={16} /> Add Review
          </button>
        </div>
      </div>

      {/* ── KPI Cards Strip matching other pages ─────────────── */}
      <div className="pm-kpi-strip reviews-kpis">
        <div className="pm-kpi-card">
          <div className="pm-kpi-row">
            <span className="pm-kpi-label">Total Reviews</span>
            <span className="pm-kpi-icon-bubble pm-bubble-mint">
              <MessageSquare size={18} />
            </span>
          </div>
          <strong className="pm-kpi-value">{loading ? '—' : totalReviewsCount}</strong>
          <small className="pm-kpi-sub">Verified community feedback</small>
        </div>

        <div className="pm-kpi-card">
          <div className="pm-kpi-row">
            <span className="pm-kpi-label">Hospital Rating</span>
            <span className="pm-kpi-icon-bubble pm-bubble-teal">
              <Star size={18} />
            </span>
          </div>
          <strong className="pm-kpi-value">{loading ? '—' : `${avgRating} / 5.0`}</strong>
          <small className="pm-kpi-sub">{fiveStarCount} five-star evaluations</small>
        </div>

        <div className="pm-kpi-card">
          <div className="pm-kpi-row">
            <span className="pm-kpi-label">Veterinary Staff</span>
            <span className="pm-kpi-icon-bubble pm-bubble-blue">
              <Stethoscope size={18} />
            </span>
          </div>
          <strong className="pm-kpi-value">{loading ? '—' : adminReviewsCount}</strong>
          <small className="pm-kpi-sub">Official clinical endorsements</small>
        </div>

        <div className="pm-kpi-card">
          <div className="pm-kpi-row">
            <span className="pm-kpi-label">Satisfaction Rate</span>
            <span className="pm-kpi-icon-bubble pm-bubble-gold">
              <Award size={18} />
            </span>
          </div>
          <strong className="pm-kpi-value">
            {loading ? '—' : `${totalReviewsCount ? Math.round((fiveStarCount / totalReviewsCount) * 100) : 100}%`}
          </strong>
          <small className="pm-kpi-sub">Positive recommendations</small>
        </div>
      </div>

      {/* ── Toolbar matching UsersView & ProductsManagement ───── */}
      <div className="pm-toolbar">
        <div className="pm-search-box">
          <Search size={16} className="pm-search-icon" />
          <input
            className="pm-search-input"
            aria-label="Search reviews"
            placeholder="Search by reviewer name, product, headline or review ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="pm-search-clear"
              aria-label="Clear search"
              onClick={() => setSearchTerm('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Product Filter */}
        <div className="pm-filter-pill">
          <Filter size={14} />
          <select
            className="pm-filter-select"
            aria-label="Filter reviews by product"
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
          >
            <option value="all">All products</option>
            {adminProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Rating Filter */}
        <div className="pm-filter-pill">
          <Star size={14} />
          <select
            className="pm-filter-select"
            aria-label="Filter reviews by rating"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="all">All ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="pm-filter-pill">
          <select
            className="pm-filter-select"
            aria-label="Filter reviews by type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All reviewer types</option>
            <option value="admin">Veterinary staff</option>
            <option value="user">Registered customers</option>
          </select>
        </div>

        <button
          type="button"
          className="pm-btn pm-btn-secondary"
          title="Reload reviews from server"
          onClick={loadReviews}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        <span className="pm-result-badge">
          {loading ? '—' : `${filteredReviews.length} of ${reviews.length}`}
        </span>
      </div>

      {/* ── Table Card matching UsersView & ProductsManagement ─── */}
      <div className="pm-table-card">
        <div className="users-table-heading reviews-table-heading">
          <div>
            <h3>Reviews &amp; Ratings Directory</h3>
            <span>Verified pet parent feedback &amp; clinical ratings</span>
          </div>
          <span className="reviews-footer-note">
            <ShieldCheck size={14} /> Certified Authenticated Reviews
          </span>
        </div>

        <div className="pm-table-scroll">
          <table className="pm-table reviews-table">
            <thead>
              <tr>
                <th scope="col" className="pm-th">Review ID</th>
                <th scope="col" className="pm-th">Reviewer Name</th>
                <th scope="col" className="pm-th">Product</th>
                <th scope="col" className="pm-th">Rating</th>
                <th scope="col" className="pm-th">Headline &amp; Feedback</th>
                <th scope="col" className="pm-th">Date</th>
                <th scope="col" className="pm-th pm-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="pm-td">
                    <div className="users-empty">
                      <RefreshCw size={28} className="animate-spin" />
                      <p>Loading reviews directory…</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pm-td">
                    <div className="users-empty">
                      <MessageSquare size={32} />
                      <p>
                        {reviews.length === 0
                          ? 'No reviews found in catalog.'
                          : 'No reviews match your search or filter criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((rev) => {
                  const isVet = rev.is_admin || rev.author_role === 'admin'
                  const authorInitials = (rev.author || 'User')
                    .replace(/Dr\./i, '')
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase() || 'CP'

                  return (
                    <tr key={rev.id} className="pm-row">
                      {/* Review ID */}
                      <td className="pm-td">
                        <span className="users-id">#REV-{rev.id}</span>
                      </td>

                      {/* Reviewer Name with Avatar & Role */}
                      <td className="pm-td">
                        <div className="reviewer-identity">
                          <span
                            className={`reviewer-avatar ${isVet ? 'reviewer-avatar-admin' : ''}`}
                            aria-hidden="true"
                          >
                            {isVet ? <Stethoscope size={16} /> : authorInitials}
                          </span>
                          <div className="reviewer-details">
                            <strong className="reviewer-name">{rev.author}</strong>
                            <span
                              className={`reviewer-role-badge ${
                                isVet ? 'reviewer-role-admin' : 'reviewer-role-user'
                              }`}
                            >
                              {isVet ? <ShieldCheck size={11} /> : <User size={11} />}
                              {isVet ? 'Veterinary Staff' : 'Pet Parent'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Product Name & SKU */}
                      <td className="pm-td">
                        <div className="review-prod-col">
                          <strong className="review-prod-title">
                            {rev.product_name || rev.product_id}
                          </strong>
                          <span className="review-prod-sku">ID: {rev.product_id}</span>
                        </div>
                      </td>

                      {/* Rating Stars Pill */}
                      <td className="pm-td">
                        <span className="review-rating-pill">
                          <Star size={13} fill="#f59e0b" color="#f59e0b" />
                          <span>{rev.rating}.0</span>
                        </span>
                      </td>

                      {/* Headline & Feedback Comment */}
                      <td className="pm-td">
                        <div className="review-content-col">
                          <strong className="review-headline">{rev.title}</strong>
                          <p className="review-snippet">{rev.comment}</p>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="pm-td">
                        <span className="pm-prod-meta">{rev.date}</span>
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="pm-td">
                        <div className="reviews-actions-group">
                          <button
                            type="button"
                            className="pm-btn-edit"
                            aria-label={`Edit review ${rev.id}`}
                            onClick={() => handleOpenEdit(rev)}
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            className="pm-action-btn pm-delete-btn"
                            title="Delete / Moderate Review"
                            onClick={() => handleDeleteReview(rev)}
                          >
                            <Trash2 size={13} />
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

        {/* Table Footer matching UsersView */}
        <div className="pm-table-footer">
          <span>Showing {filteredReviews.length} of {reviews.length} reviews</span>
          <span className="users-footer-note">
            <ShieldCheck size={14} /> Verified community feedback managed by City Pet Administrator
          </span>
        </div>
      </div>

      {/* ── EDIT REVIEW DIALOG (Matching UsersView Edit Dialog) ── */}
      {editingReview && (
        <dialog
          ref={editDialogRef}
          className="apm-card reviews-edit-dialog"
          aria-labelledby="edit-review-title"
          onCancel={(e) => {
            e.preventDefault()
            if (!editSaving) setEditingReview(null)
          }}
          onClick={(e) => {
            if (e.target !== e.currentTarget || editSaving) return
            const bounds = e.currentTarget.getBoundingClientRect()
            if (
              e.clientX < bounds.left ||
              e.clientX > bounds.right ||
              e.clientY < bounds.top ||
              e.clientY > bounds.bottom
            ) {
              setEditingReview(null)
            }
          }}
        >
          <div className="apm-header">
            <div className="apm-header-left">
              <span className="apm-header-icon">
                <Pencil size={20} />
              </span>
              <div>
                <h3 className="apm-title" id="edit-review-title">
                  Edit Review #{editingReview.id}
                </h3>
                <p className="apm-subtitle">
                  Modify reviewer name, rating, product attribution, and feedback content
                </p>
              </div>
            </div>
            <button
              type="button"
              className="apm-close-btn"
              aria-label="Close edit form"
              disabled={editSaving}
              onClick={() => setEditingReview(null)}
            >
              <X size={18} />
            </button>
          </div>

          <form className="reviews-edit-form" onSubmit={handleSaveEdit}>
            <fieldset disabled={editSaving} className="reviews-edit-fields">
              {/* Reviewer Name */}
              <div className="apm-field-full">
                <label className="apm-label" htmlFor="edit-reviewer-name">
                  Reviewer Name <span className="apm-required">*</span>
                </label>
                <input
                  id="edit-reviewer-name"
                  type="text"
                  required
                  maxLength={120}
                  className="apm-input"
                  placeholder="e.g. Dilshan Perera or Dr. Sanjeewa"
                  value={editingReview.author}
                  onChange={(e) =>
                    setEditingReview((prev) => ({ ...prev, author: e.target.value }))
                  }
                />
              </div>

              {/* Reviewer Role / Badge */}
              <div className="apm-field">
                <label className="apm-label" htmlFor="edit-reviewer-role">
                  Reviewer Type / Role
                </label>
                <select
                  id="edit-reviewer-role"
                  className="apm-select"
                  value={editingReview.role}
                  onChange={(e) =>
                    setEditingReview((prev) => ({ ...prev, role: e.target.value }))
                  }
                >
                  <option value="user">Registered Pet Parent (Customer)</option>
                  <option value="admin">Veterinary Specialist (Administrator)</option>
                </select>
              </div>

              {/* Star Rating */}
              <div className="apm-field">
                <label className="apm-label" htmlFor="edit-review-rating">
                  Rating (Stars) <span className="apm-required">*</span>
                </label>
                <select
                  id="edit-review-rating"
                  className="apm-select"
                  value={editingReview.rating}
                  onChange={(e) =>
                    setEditingReview((prev) => ({ ...prev, rating: Number(e.target.value) }))
                  }
                >
                  <option value={5}>5 Stars - Outstanding</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Dissatisfied</option>
                </select>
              </div>

              {/* Target Product */}
              <div className="apm-field-full field-full">
                <label className="apm-label" htmlFor="edit-review-product">
                  Attributed Product
                </label>
                <select
                  id="edit-review-product"
                  className="apm-select"
                  value={editingReview.productId}
                  onChange={(e) =>
                    setEditingReview((prev) => ({ ...prev, productId: e.target.value }))
                  }
                >
                  {adminProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.brand || 'City Pet'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Review Headline / Title */}
              <div className="apm-field-full field-full">
                <label className="apm-label" htmlFor="edit-review-title">
                  Review Headline / Title <span className="apm-required">*</span>
                </label>
                <input
                  id="edit-review-title"
                  type="text"
                  required
                  maxLength={160}
                  className="apm-input"
                  placeholder="Review title or headline…"
                  value={editingReview.title}
                  onChange={(e) =>
                    setEditingReview((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              {/* Review Comment Text */}
              <div className="apm-field-full field-full">
                <label className="apm-label" htmlFor="edit-review-comment">
                  Review Content &amp; Experience <span className="apm-required">*</span>
                </label>
                <textarea
                  id="edit-review-comment"
                  className="apm-textarea"
                  rows={4}
                  required
                  maxLength={5000}
                  placeholder="Detailed customer feedback or clinical evaluation…"
                  value={editingReview.comment}
                  onChange={(e) =>
                    setEditingReview((prev) => ({ ...prev, comment: e.target.value }))
                  }
                />
              </div>

              {editError && (
                <p className="users-error" role="alert">
                  <AlertCircle size={16} />
                  {editError}
                </p>
              )}

              <div className="apm-footer-actions reviews-edit-actions">
                <button
                  type="button"
                  className="apm-cancel-btn"
                  onClick={() => setEditingReview(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="apm-submit-btn">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </fieldset>
          </form>
        </dialog>
      )}

      {/* ── ADD NEW REVIEW MODAL ──────────────────────────────── */}
      {isAddModalOpen && (
        <div className="apm-backdrop" onClick={() => {
          setAddError('')
          setIsAddModalOpen(false)
        }}>
          <div
            className="apm-card reviews-edit-dialog"
            style={{ display: 'block' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="apm-header">
              <div className="apm-header-left">
                <span className="apm-header-icon">
                  <Plus size={20} />
                </span>
                <div>
                  <h3 className="apm-title">Add Verified Product Review</h3>
                  <p className="apm-subtitle">
                    Create an official veterinary endorsement or registered customer evaluation
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="apm-close-btn"
                onClick={() => {
                  setAddError('')
                  setIsAddModalOpen(false)
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdminReview} className="reviews-edit-form">
              <div className="reviews-edit-fields">
                {addError && (
                  <div className="users-error-banner field-full" role="alert">
                    <AlertCircle size={16} />
                    <span>{addError}</span>
                  </div>
                )}
                {/* Target Product */}
                <div className="apm-field-full field-full">
                  <label className="apm-label" htmlFor="add-rev-product">
                    Target Product <span className="apm-required">*</span>
                  </label>
                  <select
                    id="add-rev-product"
                    className="apm-select"
                    required
                    value={reviewForm.productId}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, productId: e.target.value })
                    }
                  >
                    <option value="" disabled>
                      Select product to review…
                    </option>
                    {adminProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.brand || 'City Pet'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reviewer Name */}
                <div className="apm-field-full">
                  <label className="apm-label" htmlFor="add-rev-author">
                    Reviewer Name <span className="apm-required">*</span>
                  </label>
                  <input
                    id="add-rev-author"
                    type="text"
                    required
                    className="apm-input"
                    placeholder="e.g. Dr. Sanjeewa (Senior Vet Surgeon) or Pet Parent Name"
                    value={reviewForm.authorName}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, authorName: e.target.value })
                    }
                  />
                </div>

                {/* Reviewer Role */}
                <div className="apm-field">
                  <label className="apm-label" htmlFor="add-rev-role">
                    Reviewer Type / Role
                  </label>
                  <select
                    id="add-rev-role"
                    className="apm-select"
                    value={reviewForm.role}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, role: e.target.value })
                    }
                  >
                    <option value="admin">Veterinary Specialist (Official Endorsement)</option>
                    <option value="user">Registered Pet Parent (Customer Review)</option>
                  </select>
                </div>

                {/* Star Rating */}
                <div className="apm-field">
                  <label className="apm-label" htmlFor="add-rev-rating">
                    Rating (Stars)
                  </label>
                  <select
                    id="add-rev-rating"
                    className="apm-select"
                    value={reviewForm.rating}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, rating: Number(e.target.value) })
                    }
                  >
                    <option value={5}>5 Stars - Outstanding / Highly Recommended</option>
                    <option value={4}>4 Stars - Very Good</option>
                    <option value={3}>3 Stars - Average</option>
                    <option value={2}>2 Stars - Poor</option>
                    <option value={1}>1 Star - Critical</option>
                  </select>
                </div>

                {/* Headline */}
                <div className="apm-field-full field-full">
                  <label className="apm-label" htmlFor="add-rev-headline">
                    Review Headline / Title <span className="apm-required">*</span>
                  </label>
                  <input
                    id="add-rev-headline"
                    type="text"
                    required
                    className="apm-input"
                    placeholder="e.g. Clinically Verified Formula for Sensitive Digestion"
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                  />
                </div>

                {/* Content */}
                <div className="apm-field-full field-full">
                  <label className="apm-label" htmlFor="add-rev-comment">
                    Review Content &amp; Clinical Notes <span className="apm-required">*</span>
                  </label>
                  <textarea
                    id="add-rev-comment"
                    className="apm-textarea"
                    rows={4}
                    required
                    placeholder="Provide detailed clinical notes, patient experiences, dietary benefits or customer feedback…"
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                  />
                </div>

                <div className="apm-footer-actions reviews-edit-actions">
                  <button
                    type="button"
                    className="apm-cancel-btn"
                    onClick={() => {
                      setAddError('')
                      setIsAddModalOpen(false)
                    }}
                    disabled={addSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="apm-submit-btn"
                    disabled={addSaving || !reviewForm.productId}
                  >
                    {addSaving ? 'Publishing…' : 'Publish Review'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
