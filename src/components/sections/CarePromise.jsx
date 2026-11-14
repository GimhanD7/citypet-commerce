import React from 'react'
import { PawPrint } from 'lucide-react'

export default function CarePromise() {
  return (
    <section className="section promise-section">
      <div className="container promise-panel">
        <div className="promise-decoration" aria-hidden="true">
          <PawPrint />
          <PawPrint />
          <PawPrint />
        </div>
        <div>
          <span className="eyebrow light">Our care promise</span>
          <h2>
            Good veterinary care is clinical.<br />
            Great veterinary care is clinical <em>and</em> compassionate.
          </h2>
        </div>
        <p>
          Our goal is simple: support pets and their owners with professional advice, treatment and respect at every visit.
        </p>
      </div>
    </section>
  )
}
