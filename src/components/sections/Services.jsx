import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Phone } from 'lucide-react'
import SectionTitle from '../common/SectionTitle'
import { services } from '../../data/siteData'

export default function Services() {
  const [showAllServices, setShowAllServices] = useState(false)
  const visibleServices = showAllServices ? services : services.slice(0, 8)

  return (
    <section id="services" className="section services-section">
      <div className="container">
        <div className="services-intro">
          <SectionTitle
            eyebrow="What we do"
            title="Everything your pet may need, in one caring place."
            text="City Pet offers a broad mix of everyday, clinical and diagnostic veterinary services."
          />
          <div className="service-callout">
            <Phone size={18} />
            <div>
              <span>Need service information?</span>
              <a href="tel:+94718419273">Call the hospital</a>
            </div>
          </div>
        </div>

        <div className="services-grid">
          {visibleServices.map(({ icon: Icon, title, text }, index) => (
            <article className="service-card" key={title} style={{ '--delay': `${index * 35}ms` }}>
              <div className="service-icon">
                <Icon />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="service-number">{String(index + 1).padStart(2, '0')}</span>
            </article>
          ))}
        </div>

        <button
          className="show-services"
          onClick={() => setShowAllServices((v) => !v)}
          aria-expanded={showAllServices}
        >
          {showAllServices ? (
            <>
              Show fewer services <ChevronUp size={18} />
            </>
          ) : (
            <>
              View all services <ChevronDown size={18} />
            </>
          )}
        </button>
      </div>
    </section>
  )
}
