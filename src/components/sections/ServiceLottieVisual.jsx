import React from 'react'

/**
 * City Pet - 14 Unique Micro-Lottie Vector Animations for Every Service
 * Pure SVG + GPU-accelerated CSS animations:
 * - Zero external CDN dependencies (No 403 Forbidden errors!)
 * - Instant 0ms load time
 * - 60 FPS silky smooth animation on mobile & desktop
 */
export default function ServiceLottieVisual({ id, color, bg }) {
  switch (id) {
    case 'medicine':
      // 01. Medicine & Treatments: Stethoscope + Pulsing Heart & Healing Cross
      return (
        <div className="lottie-anim-wrap lottie-medicine" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Heartbeat pulse background wave */}
            <path
              d="M 6 36 L 18 36 L 22 28 L 26 44 L 30 32 L 34 38 L 38 36 L 58 36"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.25"
              className="anim-ecg-path"
            />
            {/* Floating Healing Cross */}
            <g className="anim-floating-cross">
              <rect x="27" y="11" width="10" height="10" rx="2" fill={color} opacity="0.9" />
              <path d="M 32 13 L 32 19 M 29 16 L 35 16" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            </g>
            {/* Stethoscope Tubing & Binaural Head */}
            <path
              d="M 20 22 C 20 38, 44 38, 44 22"
              stroke={color}
              strokeWidth="3.2"
              strokeLinecap="round"
              className="anim-stetho-tube"
            />
            {/* Earpieces */}
            <circle cx="20" cy="20" r="3" fill={color} className="anim-pulse-ear" />
            <circle cx="44" cy="20" r="3" fill={color} className="anim-pulse-ear" />
            {/* Chestpiece cord and bell */}
            <path d="M 32 37 L 32 46" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="32" cy="49" r="6" fill="#ffffff" stroke={color} strokeWidth="3" className="anim-stetho-bell" />
            <circle cx="32" cy="49" r="2.5" fill={color} />
          </svg>
        </div>
      )

    case 'surgeries':
      // 02. Animal Surgeries: Surgical ECG Heart Monitor + Pulsing Scalpel Spark
      return (
        <div className="lottie-anim-wrap lottie-surgeries" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Beating Heart Shape */}
            <path
              d="M 32 48 C 20 40, 14 30, 14 22 C 14 16, 19 12, 25 12 C 29 12, 32 15, 32 15 C 32 15, 35 12, 39 12 C 45 12, 50 16, 50 22 C 50 30, 44 40, 32 48 Z"
              fill={bg}
              stroke={color}
              strokeWidth="2.8"
              className="anim-heart-beat"
            />
            {/* Dynamic ECG monitor line */}
            <path
              d="M 17 25 L 24 25 L 27 18 L 31 33 L 35 22 L 38 27 L 47 27"
              stroke={color}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="anim-ecg-active"
            />
            {/* Surgical glow dot */}
            <circle cx="47" cy="27" r="2.5" fill={color} className="anim-siren-dot" />
          </svg>
        </div>
      )

    case 'laboratory':
      // 03. Laboratory: Scientific Microscope with Bubbling Liquid & Test Tube
      return (
        <div className="lottie-anim-wrap lottie-laboratory" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Microscope Base */}
            <rect x="16" y="50" width="32" height="4" rx="2" fill={color} />
            <path d="M 24 50 L 24 38 C 24 28, 32 24, 40 24" stroke={color} strokeWidth="3" strokeLinecap="round" />
            {/* Eyepiece / Body tube */}
            <g className="anim-microscope-tilt">
              <rect x="25" y="14" width="8" height="18" rx="2" transform="rotate(30 29 23)" fill={color} />
              <rect x="27" y="10" width="10" height="5" rx="1.5" transform="rotate(30 32 12)" fill={color} />
              {/* Objective Lens */}
              <circle cx="38" cy="36" r="3" fill="#ffffff" stroke={color} strokeWidth="2" />
            </g>
            {/* Specimen Stage */}
            <line x1="30" y1="41" x2="48" y2="41" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            {/* Rising bubbling particles */}
            <circle cx="36" cy="38" r="1.8" fill={color} className="anim-bubble-1" />
            <circle cx="42" cy="34" r="1.5" fill={color} className="anim-bubble-2" />
            <circle cx="39" cy="29" r="2" fill={color} className="anim-bubble-3" />
          </svg>
        </div>
      )

    case 'counseling':
      // 04. Counseling: Protective Caring Shield with Pulsing Pet Paw & Rays
      return (
        <div className="lottie-anim-wrap lottie-counseling" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Protective Shield Frame */}
            <path
              d="M 32 10 L 48 16 C 48 34, 38 46, 32 52 C 26 46, 16 34, 16 16 Z"
              fill={bg}
              stroke={color}
              strokeWidth="3"
              strokeLinejoin="round"
              className="anim-shield-shimmer"
            />
            {/* Inner Caring Pet Paw Print */}
            <g className="anim-paw-pulse">
              <ellipse cx="32" cy="35" rx="5.5" ry="4.5" fill={color} />
              <circle cx="26" cy="25" r="2.2" fill={color} />
              <circle cx="30" cy="22" r="2.2" fill={color} />
              <circle cx="34" cy="22" r="2.2" fill={color} />
              <circle cx="38" cy="25" r="2.2" fill={color} />
            </g>
            {/* Sparkling halo dots */}
            <circle cx="46" cy="18" r="1.8" fill={color} className="anim-sparkle-dot-1" />
            <circle cx="18" cy="20" r="1.8" fill={color} className="anim-sparkle-dot-2" />
          </svg>
        </div>
      )

    case 'foods':
      // 05. Foods & Accessories: Pet Food Bowl with Rising Aroma & Floating Bone
      return (
        <div className="lottie-anim-wrap lottie-foods" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Floating Dog Bone */}
            <g className="anim-bone-bob">
              <rect x="23" y="16" width="18" height="5" rx="2" fill={color} />
              <circle cx="22" cy="16" r="3.2" fill={color} />
              <circle cx="22" cy="21" r="3.2" fill={color} />
              <circle cx="42" cy="16" r="3.2" fill={color} />
              <circle cx="42" cy="21" r="3.2" fill={color} />
            </g>
            {/* Aroma steam waves */}
            <path d="M 28 29 C 28 26, 31 25, 31 22" stroke={color} strokeWidth="1.8" strokeLinecap="round" className="anim-steam-1" />
            <path d="M 36 29 C 36 26, 39 25, 39 22" stroke={color} strokeWidth="1.8" strokeLinecap="round" className="anim-steam-2" />
            {/* City Pet Food Bowl */}
            <path
              d="M 14 48 L 19 36 L 45 36 L 50 48 Z"
              fill={bg}
              stroke={color}
              strokeWidth="3"
              strokeLinejoin="round"
              className="anim-bowl-rock"
            />
            {/* Food kibble heap */}
            <ellipse cx="32" cy="36" rx="13" ry="4" fill={color} opacity="0.85" />
            {/* Food base ring */}
            <line x1="16" y1="48" x2="48" y2="48" stroke={color} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )

    case 'mobile':
      // 06. Mobile Service: Hospital Vet Ambulance on Wheels with Flashing Siren
      return (
        <div className="lottie-anim-wrap lottie-mobile" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Road speed dash lines */}
            <line x1="8" y1="52" x2="20" y2="52" stroke={color} strokeWidth="2" strokeLinecap="round" className="anim-road-dash-1" />
            <line x1="28" y1="52" x2="42" y2="52" stroke={color} strokeWidth="2" strokeLinecap="round" className="anim-road-dash-2" />
            <line x1="50" y1="52" x2="58" y2="52" stroke={color} strokeWidth="2" strokeLinecap="round" className="anim-road-dash-3" />
            {/* Ambulance Van Body with Suspension Bob */}
            <g className="anim-van-bounce">
              {/* Flashing Emergency Siren */}
              <circle cx="28" cy="18" r="3" fill="#ea580c" className="anim-siren-flash" />
              <path d="M 28 15 L 28 17" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
              {/* Van Chassis */}
              <path
                d="M 12 44 L 12 28 C 12 25, 14 23, 17 23 L 36 23 L 45 31 L 52 35 L 52 44 Z"
                fill={bg}
                stroke={color}
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              {/* Front windshield */}
              <path d="M 38 27 L 44 33 L 49 35 L 38 35 Z" fill={color} opacity="0.8" />
              {/* Red Hospital Cross on Door */}
              <path d="M 25 31 L 25 39 M 21 35 L 29 35" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            </g>
            {/* Spinning Wheels */}
            <g className="anim-wheel-spin" style={{ transformOrigin: '21px 44px' }}>
              <circle cx="21" cy="44" r="5.5" fill="#ffffff" stroke={color} strokeWidth="2.5" />
              <circle cx="21" cy="44" r="2" fill={color} />
            </g>
            <g className="anim-wheel-spin" style={{ transformOrigin: '43px 44px' }}>
              <circle cx="43" cy="44" r="5.5" fill="#ffffff" stroke={color} strokeWidth="2.5" />
              <circle cx="43" cy="44" r="2" fill={color} />
            </g>
          </svg>
        </div>
      )

    case 'boarding':
      // 07. Boarding & Warding: Cozy Kennel House with Smoke & Peeking Pet Ears
      return (
        <div className="lottie-anim-wrap lottie-boarding" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Chimney smoke puffs */}
            <circle cx="44" cy="14" r="2" fill={color} opacity="0.4" className="anim-smoke-1" />
            <circle cx="46" cy="10" r="2.8" fill={color} opacity="0.3" className="anim-smoke-2" />
            <circle cx="48" cy="6" r="3.4" fill={color} opacity="0.2" className="anim-smoke-3" />
            {/* Chimney */}
            <rect x="41" y="16" width="6" height="9" fill={color} />
            {/* Roof */}
            <path
              d="M 14 30 L 32 15 L 50 30"
              stroke={color}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="anim-roof-sway"
            />
            {/* House body */}
            <rect x="18" y="29" width="28" height="23" rx="2" fill={bg} stroke={color} strokeWidth="2.8" />
            {/* Cozy arched doorway with peeking kitty/doggy ears */}
            <path d="M 26 52 L 26 40 C 26 36, 38 36, 38 40 L 38 52 Z" fill={color} />
            {/* Peeking Ears inside doorway */}
            <g className="anim-pet-ears">
              <polygon points="28,40 30,35 32,40" fill="#ffffff" />
              <polygon points="32,40 34,35 36,40" fill="#ffffff" />
              <circle cx="30" cy="42" r="1" fill="#ffffff" />
              <circle cx="34" cy="42" r="1" fill="#ffffff" />
            </g>
          </svg>
        </div>
      )

    case 'grooming':
      // 08. Grooming & Bathing: Bubble Bath Tub with Shower Head & Floating Soap Bubbles
      return (
        <div className="lottie-anim-wrap lottie-grooming" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Shower head pole & sprayer */}
            <path d="M 15 50 L 15 16 C 15 13, 22 13, 24 16 L 25 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 22 18 L 28 20" stroke={color} strokeWidth="3.2" strokeLinecap="round" />
            {/* Shower water droplets */}
            <line x1="22" y1="23" x2="21" y2="28" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 3" className="anim-shower-drops" />
            <line x1="26" y1="24" x2="25" y2="29" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 3" className="anim-shower-drops-2" />
            {/* Floating Soap Bubbles */}
            <circle cx="34" cy="22" r="3.5" fill={bg} stroke={color} strokeWidth="1.8" className="anim-float-bubble-1" />
            <circle cx="42" cy="18" r="2.8" fill={bg} stroke={color} strokeWidth="1.6" className="anim-float-bubble-2" />
            <circle cx="48" cy="24" r="4.2" fill={bg} stroke={color} strokeWidth="1.8" className="anim-float-bubble-3" />
            {/* Bathtub Body */}
            <path
              d="M 18 34 L 52 34 C 54 34, 55 36, 54 38 L 50 47 C 49 49, 47 50, 45 50 L 25 50 C 23 50, 21 49, 20 47 L 16 38 C 15 36, 16 34, 18 34 Z"
              fill={bg}
              stroke={color}
              strokeWidth="2.8"
              strokeLinejoin="round"
              className="anim-tub-wobble"
            />
            {/* Bathtub feet */}
            <path d="M 22 50 L 20 54 M 48 50 L 50 54" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
      )

    case 'pharmacy':
      // 09. Pharmacy: 3D Medical Capsule Pill with Rotating Aura & Cross
      return (
        <div className="lottie-anim-wrap lottie-pharmacy" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Rotating halo ring */}
            <circle cx="32" cy="32" r="22" stroke={color} strokeWidth="1.5" strokeDasharray="4 6" opacity="0.4" className="anim-spin-slow" />
            {/* Tilting & Floating Capsule */}
            <g className="anim-pill-float">
              {/* Left half pill */}
              <path
                d="M 22 26 C 18 30, 18 36, 22 40 L 30 32 Z"
                fill={color}
                stroke={color}
                strokeWidth="2"
              />
              {/* Right half pill */}
              <path
                d="M 30 32 L 38 24 C 42 28, 42 34, 38 38 Z"
                fill={bg}
                stroke={color}
                strokeWidth="2"
              />
              {/* Central Capsule divider */}
              <line x1="28" y1="34" x2="34" y2="28" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </g>
            {/* Floating medicinal sparkles */}
            <path d="M 44 18 L 46 22 L 50 24 L 46 26 L 44 30 L 42 26 L 38 24 L 42 22 Z" fill={color} className="anim-sparkle-spin" />
            <circle cx="18" cy="44" r="2" fill={color} className="anim-bubble-1" />
          </svg>
        </div>
      )

    case 'post-mortem':
      // 10. Post Mortem: Pathology Diagnostic Test Tubes & Swirling Serum
      return (
        <div className="lottie-anim-wrap lottie-post-mortem" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Stand */}
            <line x1="16" y1="52" x2="48" y2="52" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="20" y1="28" x2="44" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" />
            {/* Test Tube 1 */}
            <rect x="23" y="16" width="7" height="32" rx="3.5" fill={bg} stroke={color} strokeWidth="2" />
            <path d="M 23 34 C 25 32, 28 36, 30 34 L 30 44 C 30 46, 28 48, 26.5 48 C 25 48, 23 46, 23 44 Z" fill={color} className="anim-liquid-wave" />
            {/* Test Tube 2 */}
            <rect x="34" y="16" width="7" height="32" rx="3.5" fill={bg} stroke={color} strokeWidth="2" />
            <path d="M 34 26 C 36 24, 39 28, 41 26 L 41 44 C 41 46, 39 48, 37.5 48 C 36 48, 34 46, 34 44 Z" fill={color} opacity="0.75" className="anim-liquid-wave-reverse" />
            {/* Tube caps */}
            <rect x="22" y="14" width="9" height="3" rx="1.5" fill={color} />
            <rect x="33" y="14" width="9" height="3" rx="1.5" fill={color} />
          </svg>
        </div>
      )

    case 'public-awareness':
      // 11. Public Awareness: Broadcasting Megaphone with Expanding Soundwaves
      return (
        <div className="lottie-anim-wrap lottie-awareness" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Expanding soundwaves */}
            <path d="M 42 22 C 46 26, 46 36, 42 40" stroke={color} strokeWidth="2.5" strokeLinecap="round" className="anim-wave-1" />
            <path d="M 48 17 C 54 23, 54 39, 48 45" stroke={color} strokeWidth="2.2" strokeLinecap="round" className="anim-wave-2" />
            <path d="M 54 12 C 62 20, 62 42, 54 50" stroke={color} strokeWidth="1.8" strokeLinecap="round" className="anim-wave-3" />
            {/* Megaphone body with shake */}
            <g className="anim-megaphone-shake">
              <path
                d="M 16 26 L 24 26 L 36 17 L 38 17 L 38 45 L 36 45 L 24 36 L 16 36 Z"
                fill={bg}
                stroke={color}
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
              {/* Handle */}
              <path d="M 22 36 L 24 45 L 27 45 L 25 36" stroke={color} strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      )

    case 'behaviour':
      // 12. Behaviour Advising: Happy Puppy with Wagging Tail & Loving Heart
      return (
        <div className="lottie-anim-wrap lottie-behaviour" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Floating Love Heart */}
            <path
              d="M 46 14 C 44 12, 41 12, 40 14 C 39 12, 36 12, 34 14 C 32 17, 36 21, 40 25 C 44 21, 48 17, 46 14 Z"
              fill="#ea580c"
              className="anim-float-heart"
            />
            {/* Wagging Tail */}
            <path
              d="M 44 42 C 48 38, 54 36, 52 30"
              stroke={color}
              strokeWidth="3.5"
              strokeLinecap="round"
              className="anim-dog-tail"
            />
            {/* Dog Body */}
            <ellipse cx="32" cy="42" rx="14" ry="10" fill={bg} stroke={color} strokeWidth="2.8" />
            {/* Dog Head with Happy Nod */}
            <g className="anim-dog-head">
              <circle cx="22" cy="30" r="9" fill={bg} stroke={color} strokeWidth="2.8" />
              {/* Floppy Ear */}
              <path d="M 16 24 C 12 26, 12 34, 15 36" fill={color} />
              {/* Eye & Snout */}
              <circle cx="21" cy="28" r="1.5" fill={color} />
              <ellipse cx="26" cy="33" rx="4" ry="3" fill={color} />
            </g>
            {/* Legs */}
            <line x1="24" y1="51" x2="24" y2="56" stroke={color} strokeWidth="3" strokeLinecap="round" />
            <line x1="38" y1="51" x2="38" y2="56" stroke={color} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      )

    case 'ultrasound':
      // 13. 3D Ultrasound Scan: Transducer Probe with Radial Sonar Sector Sweep
      return (
        <div className="lottie-anim-wrap lottie-ultrasound" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Radial Sonar Arcs */}
            <path d="M 22 42 C 28 36, 36 36, 42 42" stroke={color} strokeWidth="2" strokeLinecap="round" className="anim-sonar-1" />
            <path d="M 16 48 C 26 38, 38 38, 48 48" stroke={color} strokeWidth="2.2" strokeLinecap="round" className="anim-sonar-2" />
            <path d="M 10 54 C 24 40, 40 40, 54 54" stroke={color} strokeWidth="2.5" strokeLinecap="round" className="anim-sonar-3" />
            {/* Ultrasound Transducer Probe */}
            <g className="anim-probe-sweep">
              <rect x="27" y="12" width="10" height="18" rx="3" fill={color} />
              <path d="M 25 30 L 39 30 L 37 34 L 27 34 Z" fill="#ffffff" stroke={color} strokeWidth="2" strokeLinejoin="round" />
              {/* Probe cable */}
              <path d="M 32 12 C 32 8, 38 7, 38 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      )

    case 'x-ray':
    default:
      // 14. X-Ray Diagnostics: Radiography Frame with Illuminated Bone & Scanning Laser
      return (
        <div className="lottie-anim-wrap lottie-xray" style={{ '--accent': color, '--bg': bg }}>
          <svg viewBox="0 0 64 64" fill="none" className="lottie-svg">
            {/* Radiograph Screen Border */}
            <rect x="14" y="12" width="36" height="42" rx="4" fill="#0f2928" stroke={color} strokeWidth="2.8" />
            {/* Illuminated Bone Inside Screen */}
            <g className="anim-xray-bone" opacity="0.9">
              <rect x="26" y="24" width="12" height="18" rx="2" fill="#e6f7f5" />
              {/* Bone Joint Knobs */}
              <circle cx="25" cy="23" r="3" fill="#e6f7f5" />
              <circle cx="39" cy="23" r="3" fill="#e6f7f5" />
              <circle cx="25" cy="43" r="3" fill="#e6f7f5" />
              <circle cx="39" cy="43" r="3" fill="#e6f7f5" />
            </g>
            {/* Sweeping Laser Scan Line */}
            <line x1="16" y1="16" x2="48" y2="16" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" className="anim-xray-laser" />
          </svg>
        </div>
      )
  }
}
