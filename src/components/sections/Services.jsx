import React, { useState, useMemo } from 'react'
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Phone,
  Sparkles,
  Stethoscope,
  Microscope,
  Heart,
} from 'lucide-react'
import { services } from '../../data/siteData'
import ServiceLottieVisual from './ServiceLottieVisual'

const CATEGORIES = [
  { id: 'all', label: 'All Services', icon: Sparkles },
  { id: 'clinical', label: 'Clinical & Surgery', icon: Stethoscope },
  { id: 'diagnostics', label: 'Diagnostics & Lab', icon: Microscope },
  { id: 'wellness', label: 'Wellness & Care', icon: Heart },
]

export default function Services() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [showAllServices, setShowAllServices] = useState(false)

  const filteredServices = useMemo(() => {
    if (activeCategory === 'all') return services
    return services.filter((s) => s.category === activeCategory)
  }, [activeCategory])

  const visibleServices = useMemo(() => {
    if (activeCategory !== 'all') return filteredServices
    return showAllServices ? services : services.slice(0, 8)
  }, [activeCategory, showAllServices, filteredServices])

  return (
    <section id="services" className="section services-section modern-services-section">
      {/* Luminous Ambient Background Glow */}
      <div className="modern-services-bg-glow" aria-hidden="true" />

      <div className="container">
        {/* Modern Section Header */}
        <div className="modern-services-header">
          <div className="modern-services-header-left">
            <div className="modern-services-eyebrow">
              <span className="services-pulse-dot" />
              <span>WHAT WE DO</span>
            </div>
            <h2 className="modern-services-title">
              Everything your pet may need, in one{' '}
              <span className="services-title-script">caring place.</span>
            </h2>
            <p className="modern-services-subtitle">
              City Pet Animal Hospital offers a comprehensive spectrum of preventive, clinical, surgical and modern diagnostic veterinary care.
            </p>

            {/* Category Filter Pills */}
            <div className="modern-services-categories">
              {CATEGORIES.map(({ id, label, icon: CatIcon }) => {
                const isActive = activeCategory === id
                const count = id === 'all' ? services.length : services.filter((s) => s.category === id).length
                return (
                  <button
                    key={id}
                    type="button"
                    className={`modern-services-cat-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveCategory(id)
                      setShowAllServices(false)
                    }}
                  >
                    <CatIcon size={14} className="cat-btn-icon" />
                    <span>{label}</span>
                    <span className="cat-btn-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Contact & Hotline Quick Callout Card */}
          <div className="modern-service-callout-card">
            <div className="service-callout-badge">
              <span className="service-live-dot" />
              <span>Emergency 24/7 Available</span>
            </div>
            <div className="service-callout-main">
              <div className="service-callout-icon-box">
                <Phone size={20} />
              </div>
              <div className="service-callout-texts">
                <span className="service-callout-label">Need service information?</span>
                <a href="tel:+94718419273" className="service-callout-link">
                  Call the hospital &rarr;
                </a>
                <small className="service-callout-phone">+94 71 841 9273</small>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Interactive Services Grid */}
        <div className="modern-services-grid">
          {visibleServices.map((service, index) => {
            const serviceIndex = services.findIndex((s) => s.id === service.id)
            const numberFormatted = String(serviceIndex + 1).padStart(2, '0')

            return (
              <article
                className="modern-service-card"
                key={service.title}
                style={{ '--delay': `${index * 45}ms` }}
              >
                {/* Top Row: Lottie Animation Visual & Pill Meta */}
                <div className="modern-service-card-top">
                  <div className="modern-service-visual" style={{ background: service.bg, color: service.color }}>
                    <div className="service-visual-glow" style={{ background: service.color }} aria-hidden="true" />
                    <ServiceLottieVisual id={service.id} color={service.color} bg={service.bg} />
                  </div>
                  <div className="modern-service-meta">
                    <span className="modern-service-num">{numberFormatted}</span>
                    {service.tag && (
                      <span className="modern-service-tag" style={{ color: service.color, background: service.bg }}>
                        {service.tag}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="modern-service-card-body">
                  <h3 className="modern-service-name">{service.title}</h3>
                  <p className="modern-service-desc">{service.text}</p>
                </div>

                {/* Footer Action */}
                <div className="modern-service-card-footer">
                  <a
                    href="tel:+94718419273"
                    className="modern-service-action-link"
                    title={`Inquire about ${service.title}`}
                  >
                    <span>Inquire / Book</span>
                    <ArrowRight size={14} className="service-link-arrow" />
                  </a>
                </div>
              </article>
            )
          })}
        </div>

        {/* View All / Show Fewer Button (when showing All category) */}
        {activeCategory === 'all' && services.length > 8 && (
          <div className="modern-services-footer-action">
            <button
              type="button"
              className="modern-show-services-btn"
              onClick={() => setShowAllServices((prev) => !prev)}
              aria-expanded={showAllServices}
            >
              {showAllServices ? (
                <>
                  <span>Show fewer services</span>
                  <ChevronUp size={18} />
                </>
              ) : (
                <>
                  <span>View all {services.length} services</span>
                  <ChevronDown size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
