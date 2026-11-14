import React from 'react'
import { ArrowRight, MapPin, Phone, Sparkles } from 'lucide-react'
import SectionTitle from '../common/SectionTitle'

export default function Locations() {
  return (
    <section id="locations" className="section locations-section">
      <div className="container">
        <SectionTitle
          eyebrow="Visit City Pet"
          title="Two hospital locations listed on the current City Pet website."
          text="Choose the branch that is most convenient and call before travelling if you need to confirm a specific service."
          align="center"
        />
        <div className="location-grid">
          <article className="location-card main-location">
            <div className="location-top">
              <span className="location-label">Main Hospital</span>
              <MapPin />
            </div>
            <h3>CityPet, Athurugiriya</h3>
            <p>
              No. 137/1, Kaduwela Road,<br />
              Athurugiriya, Sri Lanka.
            </p>
            <div className="location-contact">
              <a href="tel:+94112054074">
                <Phone size={17} /> (011) 205 4074
              </a>
              <a href="tel:+94718419273">
                <Phone size={17} /> (071) 841 9273
              </a>
            </div>
            <a
              className="location-action"
              href="https://www.google.com/maps/search/?api=1&query=City+Pet+Animal+Hospital+Athurugiriya"
              target="_blank"
              rel="noreferrer"
            >
              Get directions <ArrowRight size={17} />
            </a>
          </article>

          <article className="location-card">
            <div className="location-top">
              <span className="location-label">Branch Hospital</span>
              <MapPin />
            </div>
            <h3>CityPet, Kottawa</h3>
            <p>
              No. 133/2E, High Level Road,<br />
              Kottawa, Sri Lanka.
            </p>
            <div className="location-contact">
              <a href="tel:+94777901213">
                <Phone size={17} /> (077) 790 1213
              </a>
            </div>
            <a
              className="location-action"
              href="https://www.google.com/maps/search/?api=1&query=City+Pet+Animal+Hospital+Kottawa"
              target="_blank"
              rel="noreferrer"
            >
              Get directions <ArrowRight size={17} />
            </a>
          </article>

          <article className="hours-card">
            <div className="hours-icon">
              <Sparkles />
            </div>
            <span className="location-label">Opening hours</span>
            <h3>Every day</h3>
            <div className="time-block">
              <span>Morning</span>
              <b>9.00 AM – 12.30 PM</b>
            </div>
            <div className="time-block">
              <span>Evening</span>
              <b>4.30 PM – 8.30 PM</b>
            </div>
            <small>
              Hours are reproduced from the existing City Pet website and may change. Calling ahead is recommended.
            </small>
          </article>
        </div>
      </div>
    </section>
  )
}
