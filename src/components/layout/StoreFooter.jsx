import React, { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import Brand from '../common/Brand'

function FacebookIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function InstagramIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  )
}

function YoutubeIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

export default function StoreFooter({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setTimeout(() => {
        setEmail('')
        setSubscribed(false)
      }, 3000)
    }
  }

  return (
    <footer className="store-site-footer">
      <div className="container store-footer-grid">
        {/* Brand Column */}
        <div className="store-footer-brand-col">
          <Brand />
          <p className="store-footer-tagline">
            Veterinary care for today, a happier tomorrow.
          </p>
        </div>

        {/* Quick Links */}
        <div className="store-footer-col">
          <h4>Quick Links</h4>
          <a href="#home" onClick={() => onNavigate && onNavigate('home')}>Home</a>
          <a href="#doctors" onClick={() => onNavigate && onNavigate('home')}>Doctors</a>
          <a href="#services" onClick={() => onNavigate && onNavigate('home')}>Services</a>
          <a href="#store" onClick={() => onNavigate && onNavigate('store')}>Store</a>
          <a href="#locations" onClick={() => onNavigate && onNavigate('home')}>Locations</a>
          <a href="#contact" onClick={() => onNavigate && onNavigate('home')}>Contact</a>
        </div>

        {/* Help & Support */}
        <div className="store-footer-col">
          <h4>Help & Support</h4>
          <a href="tel:+94718419273">Track Your Order</a>
          <a href="#store">Shipping & Delivery</a>
          <a href="#store">Returns & Refunds</a>
          <a href="#store">FAQs</a>
          <a href="mailto:info@citypet.lk">Contact Support</a>
        </div>

        {/* Stay in Touch Column */}
        <div className="store-footer-col newsletter-col">
          <h4>Stay in Touch</h4>
          <p>Get the latest offers, pet care tips and new products.</p>

          <form onSubmit={handleSubscribe} className="store-newsletter-form">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" aria-label="Subscribe to newsletter">
              {subscribed ? <Check size={16} /> : <ArrowRight size={16} />}
            </button>
          </form>

          {subscribed && (
            <small className="newsletter-success-note">
              🎉 Thanks for subscribing to City Pet newsletter!
            </small>
          )}

          <div className="store-social-icons">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <FacebookIcon />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
              <YoutubeIcon />
            </a>
          </div>
        </div>
      </div>

      <div className="container store-footer-bottom">
        <span>© {new Date().getFullYear()} City Pet Animal Hospital. All rights reserved.</span>
        <span>Caring for pets. Building healthier tomorrows.</span>
      </div>
    </footer>
  )
}
