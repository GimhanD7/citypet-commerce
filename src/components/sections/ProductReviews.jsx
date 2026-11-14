import React, { useEffect, useState } from 'react'
import { CheckCircle2, ShieldCheck, Star, Stethoscope, User, AlertCircle } from 'lucide-react'
import { apiFetch } from '../../config/api'

export default function ProductReviews({
  productId,
  authUser,
  onNavigate,
  onOpenAccount,
  onSummary,
}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [saving, setSaving] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' })

  useEffect(() => {
    let mounted = true
    setData(null)
    setError('')

    async function loadReviews() {
      try {
        const result = await apiFetch(`reviews.php?product_id=${encodeURIComponent(productId)}`)
        if (!mounted) return

        const reviewsList = Array.isArray(result.reviews) ? result.reviews : []
        const total = reviewsList.length
        const avg = total ? Number((reviewsList.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)) : 0

        const finalData = {
          ...result,
          reviews: reviewsList,
          total,
          rating: avg,
          signedIn: Boolean(result.signedIn || authUser?.id),
          canReview: Boolean(result.canReview || authUser?.id),
        }

        setData(finalData)
        if (onSummary) {
          onSummary({ rating: avg, reviews: total })
        }
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Unable to load reviews. Please try again.')
        setData(null)
        if (onSummary) {
          onSummary({ rating: 0, reviews: 0 })
        }
      }
    }

    loadReviews()
    return () => { mounted = false }
  }, [productId, refresh, authUser?.id])

  // Submit Review Handler
  async function handleSubmitReview(e) {
    e.preventDefault()
    if (saving) return

    const trimmedTitle = form.title.trim()
    const trimmedComment = form.comment.trim()

    if (!trimmedTitle || !trimmedComment) {
      setError('Please provide a title and your review experience.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      await apiFetch('reviews.php', {
        method: 'POST',
        body: {
          productId,
          rating: Number(form.rating),
          title: trimmedTitle,
          comment: trimmedComment,
          csrfToken: data?.csrfToken,
        },
      })
      setNotice('Thank you! Your verified review has been published.')
      setForm({ rating: 5, title: '', comment: '' })
      setRefresh((v) => v + 1)
    } catch (err) {
      setError(err.message || 'Unable to publish your review. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isSignedIn = Boolean(authUser?.id || data?.signedIn)

  return (
    <div className="pdp-tab-pane reviews-pane">
      {notice && (
        <div className="pdp-review-success-banner" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="pdp-review-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" className="retry-btn" onClick={() => setRefresh((v) => v + 1)}>
            Retry
          </button>
        </div>
      )}

      {!data && !error && <p className="loading-state">Loading verified reviews…</p>}

      {data && (
        <>
          {/* ── Top Summary & Rating Breakdown Card ─────────────── */}
          <div className="reviews-summary-card">
            <div className="score-box">
              <span className="big-score">{data.rating.toFixed(1)}</span>
              <div className="score-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    fill={i < Math.round(data.rating) ? '#f59e0b' : 'none'}
                    color="#f59e0b"
                  />
                ))}
              </div>
              <span className="total-reviews">
                Based on {data.total} {data.total === 1 ? 'review' : 'reviews'} from registered pet parents &amp; veterinary staff
              </span>
            </div>

            <div className="rating-bars-box">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = data.reviews.filter((r) => r.rating === stars).length
                const percent = data.total ? Math.round((count / data.total) * 100) : 0
                return (
                  <div className="rating-bar-row" key={stars}>
                    <span className="star-label">{stars} stars</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="count-label">{count} ({percent}%)</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Write a Review Form (Registered Users & Admins) ─── */}
          <div className="product-review-form-card">
            {isSignedIn && data.hasReviewed && authUser?.role !== 'admin' ? (
              <div className="signin-to-review-prompt">
                <div className="prompt-content">
                  <ShieldCheck size={28} className="prompt-icon" />
                  <div>
                    <h4 className="prompt-title">Your review is already published</h4>
                    <p className="prompt-desc">
                      Registered customers can publish one review per product, keeping the product rating fair and easy to audit.
                    </p>
                  </div>
                </div>
              </div>
            ) : isSignedIn ? (
              <form className="product-review-form" onSubmit={handleSubmitReview}>
                <div className="form-header-line">
                  <div>
                    <h3 className="form-title">Write a Verified Customer Review</h3>
                    <p className="form-sub">
                      Logged in as <strong>{authUser?.name || 'Registered Pet Parent'}</strong> ({authUser?.role === 'admin' ? 'Veterinary Admin' : 'Registered User'})
                    </p>
                  </div>
                  {authUser?.role === 'admin' && (
                    <span className="admin-posting-pill">
                      <Stethoscope size={13} />
                      Posting as Hospital Specialist
                    </span>
                  )}
                </div>

                {/* Interactive Star Picker */}
                <div className="interactive-star-selector">
                  <label className="star-picker-label">Your Rating <span className="req">*</span></label>
                  <div className="star-buttons-row">
                    {[1, 2, 3, 4, 5].map((num) => {
                      const isFilled = (hoverRating || form.rating) >= num
                      return (
                        <button
                          key={num}
                          type="button"
                          className="star-click-btn"
                          disabled={saving}
                          onMouseEnter={() => setHoverRating(num)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setForm({ ...form, rating: num })}
                          aria-label={`Rate ${num} out of 5 stars`}
                        >
                          <Star
                            size={26}
                            fill={isFilled ? '#f59e0b' : 'none'}
                            color={isFilled ? '#f59e0b' : '#cbd5e1'}
                          />
                        </button>
                      )
                    })}
                    <span className="active-rating-text">
                      {(hoverRating || form.rating)} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Review Title */}
                <div className="form-field">
                  <label htmlFor="review-title" className="field-label">
                    Review Headline / Title <span className="req">*</span>
                  </label>
                  <input
                    id="review-title"
                    className="apm-input review-input"
                    placeholder="e.g. Excellent digestibility and noticeable coat improvement"
                    required
                    maxLength={160}
                    disabled={saving}
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                {/* Review Text */}
                <div className="form-field">
                  <label htmlFor="review-comment" className="field-label">
                    Your Review &amp; Experience <span className="req">*</span>
                  </label>
                  <textarea
                    id="review-comment"
                    className="apm-textarea review-textarea"
                    placeholder="Share specific details about your pet's reaction, feeding routine, health improvements, or delivery experience…"
                    required
                    maxLength={5000}
                    rows={4}
                    disabled={saving}
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  />
                </div>

                <button type="submit" className="review-submit-btn" disabled={saving}>
                  {saving ? 'Publishing Review…' : 'Submit Verified Review'}
                </button>
              </form>
            ) : (
              <div className="signin-to-review-prompt">
                <div className="prompt-content">
                  <User size={28} className="prompt-icon" />
                  <div>
                    <h4 className="prompt-title">Sign in to write a review</h4>
                    <p className="prompt-desc">
                      Reviews on City Pet are authenticated from registered pet parents and veterinary clinicians to ensure 100% genuine feedback.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="signin-prompt-btn"
                  onClick={() => {
                    if (onOpenAccount) onOpenAccount()
                    else if (onNavigate) onNavigate('login')
                  }}
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>

          {/* ── Reviews List ────────────────────────────────────── */}
          <div className="customer-reviews-list">
            <h4 className="reviews-section-subtitle">
              Verified Reviews &amp; Clinical Notes ({data.reviews.length})
            </h4>

            {data.reviews.length === 0 && (
              <div className="empty-reviews-card">
                <p>No customer reviews yet. Be the first registered pet parent to review this item!</p>
              </div>
            )}

            {data.reviews.map((review) => {
              const isAdminReview = review.is_admin || review.author_role === 'admin'
              return (
                <article
                  key={review.id}
                  className={`review-card ${isAdminReview ? 'admin-vet-review-card' : ''}`}
                >
                  <div className="review-top-line">
                    <div className="review-author-group">
                      <strong className="review-author">{review.author}</strong>
                      {isAdminReview ? (
                        <span className="verified-badge admin-badge">
                          <Stethoscope size={12} />
                          Verified Veterinary Team
                        </span>
                      ) : (
                        <span className="verified-badge registered-badge">
                          <ShieldCheck size={12} />
                          Registered Pet Parent
                        </span>
                      )}
                    </div>
                    <span className="review-date">{review.date}</span>
                  </div>

                  <div className="review-stars-row" aria-label={`${review.rating} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={15}
                        fill={i < review.rating ? '#f59e0b' : 'none'}
                        color="#f59e0b"
                      />
                    ))}
                    <span className="review-rating-num">{review.rating}.0</span>
                  </div>

                  <h5 className="review-title">{review.title}</h5>
                  <p className="review-comment">{review.comment}</p>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
