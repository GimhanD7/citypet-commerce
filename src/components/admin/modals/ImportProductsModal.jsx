import React, { useEffect, useRef, useState } from 'react'
import { Download, FileSpreadsheet, X } from 'lucide-react'
import { categoryService, productService } from '../../../services/api'
import { storeCategories } from '../../../data/storeData'
import { createProductTemplate, maxProducts, readProductWorkbook } from '../../../services/productWorkbook'

export default function ImportProductsModal({ onClose, onImported }) {
  const dialog = useRef(null)
  const [categories, setCategories] = useState(null)
  const [categoryError, setCategoryError] = useState('')
  const [filename, setFilename] = useState('')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])

  useEffect(() => {
    let active = true
    categoryService.getCategories({ allowFallback: true }).then((data) => {
      const cats = Array.isArray(data?.categories) && data.categories.length > 0
        ? data.categories.filter((c) => c.id !== 'all')
        : storeCategories.filter((c) => c.id !== 'all')
      if (active) setCategories(cats)
    }).catch(() => {
      if (active) setCategories(storeCategories.filter((c) => c.id !== 'all'))
    })
    return () => { active = false }
  }, [])

  async function download() {
    setBusy('download')
    setError('')
    try {
      const buffer = await createProductTemplate(categories)
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'CityPet-product-import.xlsx'
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      setError('Could not download the template. Please try again.')
    } finally {
      setBusy('')
    }
  }

  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setFilename(file.name)
    setPreview(null)
    setResult(null)
    setError('')
    if (!/\.xlsx$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
      setError('Choose an Excel .xlsx file no larger than 5 MB.')
      return
    }
    setBusy('read')
    try {
      setPreview(await readProductWorkbook(await file.arrayBuffer(), categories))
    } catch {
      setError('Could not read this Excel workbook. Save a fresh copy as .xlsx or use the template.')
    } finally {
      setBusy('')
    }
  }

  async function save() {
    if (busy || result || !preview?.rows.length || preview.errors.length) return
    setBusy('save')
    setProgress(0)
    const created = []
    const failed = []
    try {
      for (const { number, payload } of preview.rows) {
        try {
          const response = await productService.createProduct(payload)
          if (response?.id !== payload.id) throw new Error('Save could not be confirmed. Check the catalog for this SKU.')
          created.push({ ...payload, imageType: payload.mainImage, rating: 0, reviews: 0 })
        } catch (err) {
          const message = err.status ? err.message : 'Save could not be confirmed. Check the catalog for this SKU before retrying.'
          failed.push({ number, id: payload.id, message })
        }
        setProgress((value) => value + 1)
      }
      setResult({ saved: created.length, failed })
      if (created.length) onImported(created)
    } finally {
      setBusy('')
    }
  }

  return (
    <dialog
      className="apm-card product-import-dialog"
      ref={dialog}
      aria-labelledby="product-import-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}
    >
      <div className="apm-header">
        <div className="apm-header-left">
          <span className="apm-header-icon"><FileSpreadsheet size={20} /></span>
          <div>
            <h3 id="product-import-title" className="apm-title">Import Products from Excel</h3>
            <p className="apm-subtitle">Add up to {maxProducts} products at once.</p>
          </div>
        </div>
        <button type="button" className="apm-close-btn" disabled={!!busy} onClick={onClose} aria-label="Close"><X size={18} /></button>
      </div>

      <div className="product-import-body">
        <p>Download the template, complete the Products tab and any optional detail tabs, then upload your <strong>.xlsx</strong> file. Existing SKUs won’t be overwritten.</p>
        {categoryError && <p role="alert">{categoryError}</p>}
        {!categories && !categoryError && <p role="status">Loading product categories…</p>}
        <div className="product-import-actions">
          <button type="button" className="apm-cancel-btn" disabled={!categories || !!busy} onClick={download}>
            <Download size={16} /> Download Excel Template
          </button>
          <label>
            <span>Choose Excel file</span>
            <input type="file" accept=".xlsx" disabled={!categories || !!busy} onChange={upload} />
          </label>
        </div>
        {filename && <p><strong>Workbook:</strong> {filename}</p>}
        {busy === 'read' && <p role="status">Checking workbook…</p>}
        {error && <p role="alert">{error}</p>}
        {preview?.errors.length > 0 && (
          <div role="alert" className="product-import-report">
            <strong>Fix {preview.errors.length} workbook issue(s) before importing:</strong>
            <ul>{preview.errors.map((message, index) => <li key={index}>{message}</li>)}</ul>
          </div>
        )}
        {preview && !preview.errors.length && !result && (
          <div className="product-import-report">
            <strong>{preview.rows.length} product(s) ready to import</strong>
            <ul>{preview.rows.map(({ payload }) => (
              <li key={payload.id}>{payload.name} ({payload.id}) · LKR {payload.price.toLocaleString()} · {payload.stockCount} in stock</li>
            ))}</ul>
          </div>
        )}
        {busy === 'save' && <p role="status">Processed {progress} of {preview.rows.length} products…</p>}
        {result && (
          <div className="product-import-report" role="status">
            <strong>Imported {result.saved} product(s). {result.failed.length} not confirmed.</strong>
            {result.failed.length > 0 && <>
              <p>Review these rows and upload a workbook containing only the products you still need to add.</p>
              <ul>{result.failed.map(({ number, id, message }) => <li key={number}>Products row {number} ({id}): {message}</li>)}</ul>
            </>}
          </div>
        )}
      </div>

      <div className="apm-footer">
        <button type="button" className="apm-cancel-btn" disabled={!!busy} onClick={onClose}>{result ? 'Done' : 'Close'}</button>
        {!result && <button type="button" className="apm-submit-btn" disabled={!!busy || !preview?.rows.length || !!preview.errors.length} onClick={save}>
          {busy === 'save' ? 'Importing…' : 'Import Products'}
        </button>}
      </div>
    </dialog>
  )
}
