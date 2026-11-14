import React from 'react'
import logoMark from '../../assets/citypet-logo-mark.png'

export default function Brand({ compact = false }) {
  return (
    <a className={`brand ${compact ? 'brand-compact' : ''}`} href="#home" aria-label="City Pet Animal Hospital home">
      <img src={logoMark} alt="City Pet dog and cat mark" />
      <span className="brand-copy">
        <strong>CITY PET</strong>
        <small>ANIMAL HOSPITAL</small>
      </span>
    </a>
  )
}
