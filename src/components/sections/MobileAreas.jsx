import React from 'react'
import { ArrowRight, Phone } from 'lucide-react'
import SectionTitle from '../common/SectionTitle'
import { areas } from '../../data/siteData'

export default function MobileAreas() {
  return (
    <section className="section mobile-area-section">
      <div className="container mobile-area-grid">
        <div>
          <SectionTitle
            eyebrow="Mobile service areas"
            title="Pet care that can come closer to home."
            text="City Pet lists mobile veterinary service across Colombo and selected areas outside Colombo. Call the hospital to check current availability for your location."
          />
          <a className="text-link" href="tel:+94718419273">
            <Phone size={17} /> Check mobile service availability <ArrowRight size={17} />
          </a>
        </div>
        <div className="area-cloud">
          {areas.map((area, index) => (
            <span className={index % 5 === 0 ? 'featured' : ''} key={area}>
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
