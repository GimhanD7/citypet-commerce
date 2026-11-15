import { mediaUrl } from '../../config/media'
import React from 'react'
import {
  Bone,
  CheckCircle2,
  Heart,
  Package,
  PawPrint,
  Pill,
  Shield,
  Sparkles,
  Stethoscope,
} from 'lucide-react'

export default function ProductVisual({ type, name, category }) {
  const src = mediaUrl(type)
  if (src) {
    return (
      <span className="product-visual-fit">
        <img src={src} alt={name || 'Product'} loading="lazy" />
      </span>
    )
  }
  switch (type) {
    case 'royal-canin-dog':
      return (
        <div className="pv-wrapper pv-royal-canin">
          <div className="pv-rc-bag">
            <div className="pv-rc-top-stripe" />
            <div className="pv-rc-brand">ROYAL CANIN</div>
            <div className="pv-rc-mini-badge">MINI</div>
            <div className="pv-rc-dog-img">
              <span className="pv-dog-emoji">🐶</span>
            </div>
            <div className="pv-rc-weight">2 kg</div>
          </div>
        </div>
      )

    case 'royal-canin-puppy':
      return (
        <div className="pv-wrapper pv-royal-canin-puppy">
          <div className="pv-rc-bag pv-rc-puppy-bag">
            <div className="pv-rc-top-stripe pv-puppy-stripe" />
            <div className="pv-rc-brand">ROYAL CANIN</div>
            <div className="pv-rc-mini-badge pv-puppy-badge">Puppy</div>
            <div className="pv-rc-dog-img">
              <span className="pv-dog-emoji">🐕</span>
            </div>
            <div className="pv-rc-weight">2 kg</div>
          </div>
        </div>
      )

    case 'greenies-treats':
      return (
        <div className="pv-wrapper pv-greenies">
          <div className="pv-greenies-pack">
            <div className="pv-greenies-top">Greenies</div>
            <div className="pv-greenies-bone">🦴 🦷</div>
            <div className="pv-greenies-sub">Dental Treats</div>
            <div className="pv-greenies-wt">340g</div>
          </div>
        </div>
      )

    case 'hills-cat':
      return (
        <div className="pv-wrapper pv-hills">
          <div className="pv-hills-bag">
            <div className="pv-hills-top-curve" />
            <div className="pv-hills-logo">
              <span className="pv-hills-text">Hill's</span>
            </div>
            <div className="pv-hills-cat-img">
              <span className="pv-cat-emoji">🐱</span>
            </div>
            <div className="pv-hills-red-banner">SCIENCE DIET</div>
            <div className="pv-hills-weight">1.5 kg</div>
          </div>
        </div>
      )

    case 'vets-best-shampoo':
      return (
        <div className="pv-wrapper pv-vets-shampoo">
          <div className="pv-shampoo-bottle">
            <div className="pv-bottle-pump">
              <div className="pv-pump-nozzle" />
              <div className="pv-pump-stem" />
            </div>
            <div className="pv-bottle-body">
              <div className="pv-shampoo-label">
                <div className="pv-vets-logo">Vet's Best</div>
                <div className="pv-vets-sub">Hypoallergenic</div>
                <div className="pv-shampoo-cross">✚</div>
                <div className="pv-shampoo-title">SHAMPOO</div>
                <div className="pv-shampoo-vol">500ml</div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'zesty-multivitamin':
      return (
        <div className="pv-wrapper pv-zesty-tub">
          <div className="pv-tub-container">
            <div className="pv-tub-lid" />
            <div className="pv-tub-body">
              <div className="pv-zesty-label">
                <div className="pv-zesty-brand">Zesty Paws</div>
                <div className="pv-zesty-bites">8-in-1 BITES</div>
                <div className="pv-zesty-paws-art">🐾 🦴</div>
                <div className="pv-zesty-count">90 Soft Chews</div>
              </div>
            </div>
          </div>
        </div>
      )

    case 'rogz-leash':
      return (
        <div className="pv-wrapper pv-rogz-leash">
          <div className="pv-leash-coil">
            <div className="pv-leash-ring ring-outer">
              <div className="pv-leash-ring ring-mid">
                <div className="pv-leash-ring ring-inner" />
              </div>
            </div>
            <div className="pv-leash-carabiner">
              <div className="pv-carabiner-hook" />
              <div className="pv-carabiner-swivel" />
            </div>
            <div className="pv-leash-tag">ROGZ</div>
          </div>
        </div>
      )

    case 'citypet-bowl':
      return (
        <div className="pv-wrapper pv-citypet-bowl">
          <div className="pv-bowl-outer">
            <div className="pv-bowl-rim" />
            <div className="pv-bowl-dish">
              <div className="pv-bowl-logo">
                <span className="pv-bowl-icon">🐾</span>
                <span className="pv-bowl-text">CITY PET</span>
              </div>
            </div>
            <div className="pv-bowl-rubber-base" />
          </div>
        </div>
      )

    case 'purebites-treats':
      return (
        <div className="pv-wrapper pv-purebites">
          <div className="pv-pouch-body">
            <div className="pv-pouch-header">
              <div className="pv-pb-brand">
                <span className="pv-pb-pure">PURE</span>
                <span className="pv-pb-bites">Bites</span>
              </div>
              <div className="pv-pb-desc">100% RAW FREEZE-DRIED</div>
            </div>
            <div className="pv-pouch-window">
              <span className="pv-treat-piece">🍗</span>
              <span className="pv-treat-piece">🍗</span>
              <span className="pv-treat-piece">🍗</span>
            </div>
            <div className="pv-pb-bottom">
              <span>Chicken Breast 100g</span>
            </div>
          </div>
        </div>
      )

    case 'kong-plush':
      return (
        <div className="pv-wrapper pv-kong-plush">
          <div className="pv-plush-bear">
            <div className="pv-bear-ear ear-left" />
            <div className="pv-bear-ear ear-right" />
            <div className="pv-bear-head">
              <div className="pv-bear-eye eye-left" />
              <div className="pv-bear-eye eye-right" />
              <div className="pv-bear-snout">
                <div className="pv-bear-nose" />
              </div>
            </div>
            <div className="pv-bear-body">
              <div className="pv-kong-neck-tag">KONG</div>
            </div>
          </div>
        </div>
      )

    case 'flea-treatment':
      return (
        <div className="pv-wrapper pv-med-box">
          <div className="pv-flea-pack">
            <div className="pv-flea-header">NexGard</div>
            <div className="pv-flea-sub">SPECTRA</div>
            <div className="pv-flea-icon">🛡️ 💊</div>
            <div className="pv-flea-footer">3 Chewables</div>
          </div>
        </div>
      )

    case 'whiskas-pouch':
      return (
        <div className="pv-wrapper pv-whiskas">
          <div className="pv-whiskas-pouch">
            <div className="pv-whiskas-logo">whiskas</div>
            <div className="pv-whiskas-cat">🐱</div>
            <div className="pv-whiskas-flavor">Ocean Fish 🐟</div>
            <div className="pv-whiskas-wt">85g x 12</div>
          </div>
        </div>
      )

    case 'bird-food':
      return (
        <div className="pv-wrapper pv-bird-food">
          <div className="pv-bird-pack">
            <div className="pv-bird-brand">Kaytee</div>
            <div className="pv-bird-icon">🦜 🌾</div>
            <div className="pv-bird-name">Forti-Diet Pro</div>
            <div className="pv-bird-wt">1 kg</div>
          </div>
        </div>
      )

    case 'fish-food':
      return (
        <div className="pv-wrapper pv-fish-food">
          <div className="pv-fish-can">
            <div className="pv-fish-lid" />
            <div className="pv-fish-label">
              <div className="pv-tetra-brand">TetraMin</div>
              <div className="pv-fish-icon">🐠 🫧</div>
              <div className="pv-fish-wt">100g Flakes</div>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="pv-wrapper pv-generic">
          <PawPrint size={40} color="#04959d" />
          <span className="pv-generic-name">{name}</span>
        </div>
      )
  }
}
