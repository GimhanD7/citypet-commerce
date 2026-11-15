import React, { useEffect, useState } from 'react'
import { orderService } from '../../services/api'
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import ProductVisual from './ProductVisual'

const cartItemKey = (product) =>
  `${product?.id || ''}::${product?.selectedSize || product?.size || ''}`

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems = [],
  onUpdateQty,
  onRemoveItem,
  onOpenCheckout,
  savedItems = [],
  onSaveForLater,
  onMoveToCart,
  onRemoveSaved,
}) {
  const [delivery, setDelivery] = useState(null)
  useEffect(() => {
    if (!isOpen) return
    let active = true
    setDelivery(null)
    orderService.getDeliverySettings()
      .then(([method]) => { if (active) setDelivery(method ?? null) })
      .catch(() => { /* Checkout loads rates again before accepting an order. */ })
    return () => { active = false }
  }, [isOpen])

  if (!isOpen) return null

  const isProductOut = (product) => {
    if (!product) return true
    if (product.stockCount !== undefined && product.stockCount !== null && product.stockCount !== '') {
      return Number(product.stockCount) <= 0
    }
    return !product.inStock
  }

  const hasOutOfStockItems = cartItems.some(({ product }) => isProductOut(product))

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const freeShippingThreshold = delivery?.freeDeliveryThreshold
  const isFreeShipping = delivery && (delivery.fee === 0 || Math.round(subtotal * 100) / 100 >= freeShippingThreshold)
  const shippingFee = subtotal > 0 && delivery && !isFreeShipping ? delivery.fee : 0
  const total = subtotal + shippingFee

  return (
    <div className="cart-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Shopping Cart">
      <div className="cart-drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title">
            <ShoppingBag size={20} className="cart-title-icon" />
            <h3>Your Shopping Cart</h3>
            <span className="cart-items-count">
              ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)
            </span>
          </div>
          <button className="drawer-close-btn" onClick={onClose} aria-label="Close cart drawer">
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        {delivery && cartItems.length > 0 && (
          <div className="shipping-progress-banner">
            <div className="shipping-progress-text">
              <Truck size={16} />
              {isFreeShipping ? (
                <span>
                  🎉 You unlocked <strong>FREE Islandwide Delivery!</strong>
                </span>
              ) : (
                <span>
                  Add <strong>LKR {(freeShippingThreshold - subtotal).toLocaleString()}</strong> more for <strong>FREE Delivery</strong>
                </span>
              )}
            </div>
            <div className="shipping-progress-track">
              <div
                className="shipping-progress-fill"
                style={{
                  width: `${isFreeShipping ? 100 : Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Cart Item List */}
        <div className="cart-drawer-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <div className="empty-cart-circle">
                <ShoppingBag size={48} />
              </div>
              <h4>Your cart is empty</h4>
              <p>Looks like you haven't added any pet food or wellness products yet.</p>
              <button
                className="button primary"
                onClick={onClose}
              >
                Browse Pet Store <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cartItems.map(({ product, quantity }) => {
                const isItemOut = isProductOut(product)
                const itemKey = cartItemKey(product)

                return (
                  <div className={`cart-item-row ${isItemOut ? 'cart-item-out-of-stock' : ''}`} key={itemKey}>
                    <div className="cart-item-visual">
                      <ProductVisual type={product.imageType} name={product.name} />
                    </div>
                    <div className="cart-item-details">
                      <div className="cart-item-top">
                        <div className="flex items-center gap-2">
                          <span className="cart-item-brand">{product.brand}</span>
                          {isItemOut && (
                            <span className="cart-out-badge">Out of Stock</span>
                          )}
                        </div>
                        <div className="cart-item-actions-top">
                          <button
                            type="button"
                            className="cart-item-save-btn"
                            onClick={() => onSaveForLater && onSaveForLater(product)}
                            aria-label={`Save ${product.name} for later`}
                            title="Save for Later"
                          >
                            <Bookmark size={14} />
                          </button>
                          <button
                            type="button"
                            className="cart-item-remove-btn"
                            onClick={() => onRemoveItem(itemKey)}
                            aria-label={`Remove ${product.name}`}
                            title="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <h5 className="cart-item-name">{product.name}</h5>
                      {product.selectedSize && (
                        <span className="cart-item-variant">Size: {product.selectedSize}</span>
                      )}
                      <div className="cart-item-bottom">
                        <div className="qty-control-pill">
                          <button
                            onClick={() => onUpdateQty(itemKey, quantity - 1)}
                            aria-label="Decrease quantity"
                            disabled={quantity <= 1}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="qty-value">{quantity}</span>
                          <button
                            onClick={() => onUpdateQty(itemKey, quantity + 1)}
                            aria-label="Increase quantity"
                            disabled={isItemOut}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <div className="cart-item-price-block">
                          <span className="cart-item-total-price">
                            LKR {(product.price * quantity).toLocaleString()}
                          </span>
                          {quantity > 1 && (
                            <small className="cart-item-unit-price">
                              (LKR {product.price.toLocaleString()} each)
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Saved for Later Section */}
          {savedItems && savedItems.length > 0 && (
            <div className="cart-saved-section">
              <div className="cart-saved-header">
                <h5>
                  <Bookmark size={15} color="#04959d" />
                  <span>Saved for Later ({savedItems.length})</span>
                </h5>
              </div>
              <div className="cart-saved-list">
                {savedItems.map((item) => (
                  <div key={item.id} className="cart-saved-item">
                    <div className="cart-saved-item-visual">
                      <ProductVisual type={item.imageType} name={item.name} />
                    </div>
                    <div className="cart-saved-item-info">
                      <h6 className="cart-saved-item-name">{item.name}</h6>
                      <strong className="cart-saved-item-price">
                        LKR {Number(item.price || 0).toLocaleString()}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="cart-move-btn"
                        onClick={() => onMoveToCart && onMoveToCart(item)}
                      >
                        Move to Cart
                      </button>
                      <button
                        type="button"
                        className="cart-saved-del-btn"
                        onClick={() => onRemoveSaved && onRemoveSaved(item)}
                        title="Remove from saved"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Drawer Footer */}
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            {hasOutOfStockItems && (
              <div className="cart-stock-warning-banner">
                <AlertCircle size={16} />
                <span>Please remove out-of-stock items before checkout.</span>
              </div>
            )}
            <div className="cart-summary-line">
              <span>Subtotal</span>
              <strong>LKR {subtotal.toLocaleString()}</strong>
            </div>
            <div className="cart-summary-line">
              <span>Islandwide Delivery</span>
              <span>{!delivery ? "Calculated at checkout" : isFreeShipping ? <strong className="text-free">FREE</strong> : `LKR ${shippingFee}`}</span>
            </div>
            <div className="cart-summary-total">
              <span>Estimated Total</span>
              <strong>LKR {total.toLocaleString()}</strong>
            </div>

            <button
              className={`checkout-action-btn ${hasOutOfStockItems ? 'disabled' : ''}`}
              disabled={hasOutOfStockItems}
              onClick={() => {
                if (!hasOutOfStockItems) {
                  onClose()
                  onOpenCheckout()
                }
              }}
            >
              <span>{hasOutOfStockItems ? 'Out of Stock Items in Cart' : 'Proceed to WhatsApp Checkout'}</span>
              <ArrowRight size={18} />
            </button>
            <div className="cart-security-badge">
              <span>🔒 100% Genuine Vet Products & Safe Order Handling</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
