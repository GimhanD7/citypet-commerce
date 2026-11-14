import React from 'react'
import { BookOpen, Award, PawPrint, Stethoscope } from 'lucide-react'
import { doctors } from '../../data/siteData'

export default function Doctors() {
  return (
    <section id="doctors" className="doctors-section">
      {/* Decorative background blobs */}
      <div className="doctors-bg-blob blob-teal" />
      <div className="doctors-bg-blob blob-warm" />

      <div className="doctors-container">
        {/* Header */}
        <div className="doctors-header doctors-header--center">
          <span className="doctors-eyebrow">
            <Stethoscope size={13} />
            Our Veterinary Team
          </span>
          <h2 className="doctors-title">Experienced hands.<br />Caring hearts.</h2>
          <p className="doctors-subtitle">
            Meet the qualified veterinary practitioners featured by City Pet Animal Hospital — each dedicated to the health and happiness of your pets.
          </p>
        </div>

        {/* Doctor Cards */}
        <div className="doctors-grid">
          {doctors.map((doctor, index) => (
            <article className="doctor-card" key={doctor.name}>
              {/* Card image */}
              <div className="doctor-card-image-wrap">
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="doctor-card-image"
                />
                <div className="doctor-card-image-overlay" />
                <span className="doctor-paw-badge">
                  <PawPrint size={16} />
                </span>
              </div>

              {/* Card body */}
              <div className="doctor-card-body">
                <span className="doctor-card-dept">Veterinary Care</span>
                <h3 className="doctor-card-name">{doctor.name}</h3>
                <p className="doctor-card-role">{doctor.role}</p>

                <div className="doctor-card-meta">
                  <span className="doctor-meta-pill">
                    <BookOpen size={11} />
                    {doctor.qualifications}
                  </span>
                  <span className="doctor-meta-pill">
                    <Award size={11} />
                    Reg. No. {doctor.reg}
                  </span>
                </div>
              </div>

              {/* Hover accent bar */}
              <div className="doctor-card-accent" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
