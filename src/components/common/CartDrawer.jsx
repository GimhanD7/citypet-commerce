import React from 'react'
import {
  AlertCircle,
  ArrowRight,
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
}) {
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
  const freeShippingThreshold = 10000
  const isFreeShipping = subtotal >= freeShippingThreshold
  const shippingFee = subtotal > 0 && !isFreeShipping ? 450 : 0
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
        {cartItems.length > 0 && (
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
                  width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
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
                        <button
                          className="cart-item-remove-btn"
                          onClick={() => onRemoveItem(itemKey)}
                          aria-label={`Remove ${product.name}`}
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
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
              <span>{isFreeShipping ? <strong className="text-free">FREE</strong> : `LKR ${shippingFee}`}</span>
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
