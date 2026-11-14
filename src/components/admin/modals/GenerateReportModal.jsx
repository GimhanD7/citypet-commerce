import React from 'react'
import { Download, FileSpreadsheet, FileText, X } from 'lucide-react'

export default function GenerateReportModal({ onClose, showToast }) {
  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Generate Hospital Performance Report</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-form-body">
          <p className="modal-desc">
            Download comprehensive veterinary performance, revenue breakdown, and pharmacy metrics for <strong>April 2024</strong>.
          </p>
          <div className="report-options-grid">
            <div className="report-option-card active">
              <FileSpreadsheet size={24} className="report-icon" />
              <strong>Executive Summary (PDF)</strong>
              <small>Includes revenue charts, clinical logs, and inventory</small>
            </div>
            <div className="report-option-card">
              <FileText size={24} className="report-icon" />
              <strong>Sales & Tax Report (CSV)</strong>
              <small>Line-item transaction records and payment gateway fees</small>
            </div>
          </div>
          <div className="modal-footer-actions">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="quick-action-btn primary-teal"
              onClick={() => {
                onClose()
                showToast('PDF Report generated and ready for download!')
              }}
            >
              <Download size={15} />
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
