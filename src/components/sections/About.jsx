import React from 'react'
import { HeartPulse, PawPrint, ShieldCheck, Sparkles } from 'lucide-react'
import SectionTitle from '../common/SectionTitle'
import hospitalImage from '../../assets/citypet-building.webp'

export default function About() {
  return (
    <section id="about" className="section about-section">
      <div className="container about-grid">
        <div className="about-visual">
          <div className="image-shell">
            <img src={hospitalImage} alt="City Pet Animal Hospital building in Athurugiriya" />
          </div>
          <div className="care-note">
            <div className="care-note-icon">
              <PawPrint />
            </div>
            <div>
              <strong>For every stage of life</strong>
              <span>From young pets to senior companions</span>
            </div>
          </div>
          <div className="tiny-paw-trail" aria-hidden="true">
            <PawPrint />
            <PawPrint />
            <PawPrint />
          </div>
        </div>

        <div className="about-copy">
          <SectionTitle
            eyebrow="About City Pet"
            title="A hospital built around happier, healthier pets."
            text="City Pet Animal Hospital is based in Athurugiriya and provides a broad range of veterinary services with professional knowledge, clinical resources and a strong focus on animal wellbeing."
          />
          <p>
            The hospital provides geriatric and pediatric care, behavioural and nutritional counselling, vaccination, preventive medicine, surgery and practical advice for pet health and safety.
          </p>
          <div className="care-values">
            <div>
              <ShieldCheck />
              <span>
                <b>Professional care</b>
                <small>Qualified veterinary practitioners</small>
              </span>
            </div>
            <div>
              <HeartPulse />
              <span>
                <b>Complete support</b>
                <small>From prevention to treatment</small>
              </span>
            </div>
            <div>
              <Sparkles />
              <span>
                <b>Friendly experience</b>
                <small>A calmer environment for pets and owners</small>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
