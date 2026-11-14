import React from 'react'
export default function ProductExtraFields({ form, setForm }) {
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))
  return <>
    <div className="apm-field-full">
      <label className="apm-label" htmlFor="product-extra-tags">Product Highlights</label>
      <textarea
        id="product-extra-tags"
        className="apm-textarea"
        rows={2}
        value={form.tags || ''}
        placeholder="One highlight per line (e.g. Vet Approved, 100% Genuine, Premium Quality)"
        onChange={(e) => set('tags', e.target.value)}
      />
    </div>
    <div className="apm-field-full"><label className="apm-label">Sizes &amp; Prices</label>
      <p className="apm-field-hint">Optional. The first size is selected by default.</p>
      {(form.sizes || []).map((size, index) => <div className="product-size-row" key={index}>
        <input className="apm-input" aria-label={`Size ${index + 1}`} placeholder="2 kg" value={size.size} onChange={(e) => set('sizes', form.sizes.map((s, i) => i === index ? { ...s, size: e.target.value } : s))} />
        <input className="apm-input" aria-label={`Price for size ${index + 1}`} type="number" min="0.01" step="0.01" placeholder="Price (LKR)" value={size.price} onChange={(e) => set('sizes', form.sizes.map((s, i) => i === index ? { ...s, price: e.target.value } : s))} />
        <button type="button" className="apm-nav-btn" onClick={() => set('sizes', form.sizes.filter((_, i) => i !== index))}>Remove</button>
      </div>)}
      <button type="button" className="apm-nav-btn" onClick={() => set('sizes', [...(form.sizes || []), { size: '', price: '', default: !(form.sizes || []).length }])}>Add Size</button>
    </div>
  </>
}
