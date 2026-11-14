import React from 'react'
import { X } from 'lucide-react'

export default function CreateOrderModal({
  recentOrders,
  setRecentOrders,
  onClose,
  showToast,
}) {
  const handleSubmit = (e) => {
    e.preventDefault()
    const newId = `#CP${Math.floor(75822 + Math.random() * 50)}`
    setRecentOrders([
      {
        id: newId,
        date: 'Apr 30, 2024',
        customer: 'Sunil Wickramasinghe',
        items: '2 items',
        total: 'LKR 9,200',
        status: 'Processing',
        statusType: 'info',
      },
      ...recentOrders,
    ])
    onClose()
    showToast(`Order ${newId} created successfully!`)
  }

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Hospital Rx / Store Order</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form-body">
          <div className="modal-form-group">
            <label>Customer Name</label>
            <input type="text" required placeholder="Customer Full Name" defaultValue="Sunil Wickramasinghe" />
          </div>
          <div className="modal-form-row">
            <div className="modal-form-group">
              <label>Contact Phone</label>
              <input type="tel" defaultValue="+94 77 123 4567" />
            </div>
            <div className="modal-form-group">
              <label>Delivery Area</label>
              <select defaultValue="Colombo 07">
                <option>Colombo 03</option>
                <option>Colombo 07</option>
                <option>Rajagiriya</option>
                <option>Nugegoda</option>
                <option>Mount Lavinia</option>
              </select>
            </div>
          </div>
          <div className="modal-form-group">
            <label>Select Items</label>
            <input type="text" defaultValue="Royal Canin Mini Adult 2kg (x1), Vet's Best Omega-3 (x1)" />
          </div>
          <div className="modal-footer-actions">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="quick-action-btn primary-teal">
              <span>Create & Print Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
