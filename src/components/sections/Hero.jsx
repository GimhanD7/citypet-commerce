import React from 'react'
import {
  ArrowRight,
  Clock3,
  MapPin,
  PawPrint,
  Phone,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import heroDog from '../../assets/hero.png'

export default function Hero() {
  return (
    <div id="home" className="home-anchor">
      {/* Mobile Hero View */}
      <section className="mobile-hero" aria-labelledby="mobile-hero-title">
        <div className="mobile-hero-orb mobile-orb-one" aria-hidden="true" />
        <div className="mobile-hero-orb mobile-orb-two" aria-hidden="true" />
        <div className="container mobile-hero-inner">
          <div className="mobile-welcome">
            <PawPrint size={14} /> Gentle care for your best friend
          </div>
          <h1 id="mobile-hero-title">
            <span>Your pet is</span>
            <strong>our concern.</strong>
          </h1>
          <p>Professional veterinary care, delivered with a gentle touch and a whole lot of heart.</p>

          <div className="mobile-pet-card">
            <span className="mobile-heart-bubble" aria-hidden="true">♡</span>
            <img src={heroDog} alt="Happy golden retriever wearing a teal collar" />
            <div className="mobile-care-chip">
              <PawPrint size={15} />
              <span>
                <b>Gentle care</b>
                <small>For every life stage</small>
              </span>
            </div>
            <div className="mobile-hours-chip">
              <Clock3 size={15} />
              <span>
                <b>Open daily</b>
                <small>Morning & evening</small>
              </span>
            </div>
          </div>

          <div className="mobile-hero-actions">
            <a className="mobile-primary-action" href="tel:+94718419273">
              <Phone size={18} /> Call City Pet
            </a>
            <a className="mobile-secondary-action" href="#services">
              Explore Services <ArrowRight size={18} />
            </a>
          </div>

          <div className="mobile-quick-links" aria-label="Quick contact links">
            <a href="tel:+94718419273">
              <span><Phone size={17} /></span>
              <b>Call</b>
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=City+Pet+Animal+Hospital+Athurugiriya"
              target="_blank"
              rel="noreferrer"
            >
              <span><MapPin size={17} /></span>
              <b>Directions</b>
            </a>
            <a href="#locations">
              <span><Clock3 size={17} /></span>
              <b>Hours</b>
            </a>
          </div>
        </div>
      </section>

      {/* Desktop Hero View */}
      <section className="hero-section desktop-hero">
        <div className="hero-soft-shape hero-shape-a" />
        <div className="hero-soft-shape hero-shape-b" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow">Compassionate care, for a</div>
            <h1>
              <span className="hero-heading-main">Your pet is</span>
              <span className="hero-script">our concern.</span>
            </h1>
            <p>
              City Pet Animal Hospital provides trusted veterinary care with professional expertise, modern facilities and genuine compassion.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="tel:+94718419273">
                <Phone size={18} /> Call Us
              </a>
              <a className="button secondary" href="#services">
                Our Services <ArrowRight size={18} />
              </a>
            </div>
            <div className="hero-trust-row">
              <div>
                <span className="trust-dot"><Clock3 size={16} /></span>
                <span>
                  <b>Open every day</b>
                  <small>Morning & evening care</small>
                </span>
              </div>
              <div>
                <span className="trust-dot"><Stethoscope size={16} /></span>
                <span>
                  <b>Experienced vets</b>
                  <small>Professional care team</small>
                </span>
              </div>
              <div>
                <span className="trust-dot"><ShieldCheck size={16} /></span>
                <span>
                  <b>Modern facilities</b>
                  <small>Diagnostics & treatment</small>
                </span>
              </div>
            </div>
          </div>
          <div className="hero-dog-stage">
            <div className="hero-dog-heart" aria-hidden="true">♡</div>
            <img className="hero-dog-image" src={heroDog} alt="Happy golden retriever wearing a teal collar" />
            <div className="hero-proof-card">
              <span>Complete pet care</span>
              <strong>All in one place</strong>
              <small>Medicine · Surgery · Diagnostics</small>
            </div>
            <span className="hero-dog-stamp" aria-hidden="true">
              <PawPrint size={21} />
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
