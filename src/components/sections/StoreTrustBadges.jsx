import React from 'react'
import { Award, ShieldCheck, Stethoscope, Truck } from 'lucide-react'

export default function StoreTrustBadges() {
  const badges = [
    {
      icon: Award,
      title: 'Genuine Products',
      desc: '100% authentic, trusted brands',
    },
    {
      icon: Stethoscope,
      title: 'Vet Recommended',
      desc: 'Chosen by our veterinary team',
    },
    {
      icon: Truck,
      title: 'Islandwide Delivery',
      desc: 'Fast and reliable service',
    },
    {
      icon: ShieldCheck,
      title: '100% Secure Payment',
      desc: 'PayHere & bank transfer',
    },
  ]

  return (
    <section className="store-trust-badges-section">
      <div className="container store-trust-badges-grid">
        {badges.map((badge, idx) => {
          const Icon = badge.icon
          return (
            <div className="store-trust-badge-card" key={idx}>
              <div className="store-trust-badge-icon">
                <Icon size={24} />
              </div>
              <div className="store-trust-badge-text">
                <h4>{badge.title}</h4>
                <p>{badge.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
