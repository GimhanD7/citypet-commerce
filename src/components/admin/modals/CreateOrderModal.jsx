import React, { useState } from 'react'
import { X } from 'lucide-react'
import { orderService } from '../../../services/api'

export default function CreateOrderModal({ products, onClose, onCreated }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const available = products.filter((product) => product.inStock && Number(product.stockCount ?? 1) > 0)

  async function submit(event) {
    event.preventDefault()
    if (saving) return

    const fields = new FormData(event.currentTarget)
    const product = available.find((item) => item.id === fields.get('productId'))
    const quantity = Number(fields.get('quantity'))
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > Number(product.stockCount ?? 1)) {
      setError('Select an available product and enter a quantity within its stock.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const order = await orderService.createOrder({
        source: 'counter',
        fullName: String(fields.get('name')).trim(),
        email: String(fields.get('email')).trim(),
        phone: String(fields.get('phone')).trim(),
        cartItems: [{ product, quantity }],
      })
      onCreated(order)
    } catch (failure) {
      setError(failure.message || 'Unable to create the order.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={saving ? undefined : onClose}>
      <div className="admin-modal-card" role="dialog" aria-modal="true" aria-labelledby="counter-order-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3 id="counter-order-title">Create a counter order</h3>
          <button type="button" className="modal-close-btn" aria-label="Close" disabled={saving} onClick={onClose}><X size={18} /></button>
        </div>
        <form className="modal-form-body" onSubmit={submit}>
          <fieldset disabled={saving} className="counter-order-fields">
            <div className="modal-form-group"><label htmlFor="counter-name">Customer name</label><input id="counter-name" name="name" required maxLength={120} /></div>
            <div className="modal-form-row">
              <div className="modal-form-group"><label htmlFor="counter-email">Email</label><input id="counter-email" name="email" type="email" required maxLength={150} /></div>
              <div className="modal-form-group"><label htmlFor="counter-phone">Phone</label><input id="counter-phone" name="phone" type="tel" required maxLength={30} /></div>
            </div>
            <div className="modal-form-row">
              <div className="modal-form-group">
                <label htmlFor="counter-product">Product</label>
                <select id="counter-product" name="productId" required defaultValue="">
                  <option value="">Select an in-stock product</option>
                  {available.map((product) => <option key={product.id} value={product.id}>{product.name} · LKR {product.price}</option>)}
                </select>
              </div>
              <div className="modal-form-group"><label htmlFor="counter-quantity">Quantity</label><input id="counter-quantity" name="quantity" type="number" min="1" step="1" defaultValue="1" required /></div>
            </div>
          </fieldset>
          {error && <p className="operations-error" role="alert">{error}</p>}
          <div className="modal-footer-actions">
            <button type="button" className="modal-cancel-btn" disabled={saving} onClick={onClose}>Cancel</button>
            <button type="submit" className="quick-action-btn primary-teal" disabled={saving || !available.length}>
              {saving ? 'Creating…' : 'Create order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
