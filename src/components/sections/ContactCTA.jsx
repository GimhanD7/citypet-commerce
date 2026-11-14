import React from 'react'
import { Mail, Phone } from 'lucide-react'
import Brand from '../common/Brand'

export default function ContactCTA() {
  return (
    <section id="contact" className="section contact-section">
      <div className="container contact-panel">
        <div className="contact-brand">
          <Brand compact />
          <p>Professional veterinary care for companion animals in Sri Lanka.</p>
        </div>
        <div className="contact-copy">
          <span className="eyebrow">Get in touch</span>
          <h2>
            Your pet cannot explain what hurts.<br />
            A caring vet can help find the answer.
          </h2>
          <div className="contact-actions">
            <a className="button primary dark" href="tel:+94718419273">
              <Phone size={18} /> Call Athurugiriya
            </a>
            <a className="button secondary pale" href="mailto:info@citypet.lk">
              <Mail size={18} /> info@citypet.lk
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
