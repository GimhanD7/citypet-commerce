import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Headphones,
  Heart,
  Home,
  Lock,
  LogOut,
  Package,
  PawPrint,
  Phone,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
  User,
  Users,
} from 'lucide-react'
import Brand from '../common/Brand'
import checkoutHeroPets from '../../assets/checkout-hero-pets.jpg'
import logoMark from '../../assets/citypet-logo-mark.png'
import { authService } from '../../services/api'

export default function AdminLogin({
  onNavigate,
  onLoginSuccess,
}) {
  const [phoneNumber, setPhoneNumber] = useState('77 123 4567')
  const [countryCode, setCountryCode] = useState('+94')
  const [step, setStep] = useState('phone') // 'phone' | 'otp'
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6'])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timer, setTimer] = useState(30)
  const [errorMessage, setErrorMessage] = useState('')

  // Resend countdown timer
  useEffect(() => {
    let interval = null
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [step, timer])

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your registered phone number or email.')
      return
    }
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const fullIdentifier = `${countryCode} ${phoneNumber}`.trim()
      await authService.sendOtp(fullIdentifier)
      setIsSubmitting(false)
      setStep('otp')
      setTimer(30)
    } catch (err) {
      setIsSubmitting(false)
      setErrorMessage(err.message || 'Failed to send OTP code. Please try again.')
    }
  }

  const handleVerifyOtp = async (e) => {
    e?.preventDefault()
    const enteredCode = otp.join('')
    if (enteredCode.length < 6) {
      setErrorMessage('Please enter the full 6-digit OTP code.')
      return
    }
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const fullIdentifier = `${countryCode} ${phoneNumber}`.trim()
      const res = await authService.verifyOtp(fullIdentifier, enteredCode)
      setIsSubmitting(false)

      if (onLoginSuccess) {
        onLoginSuccess(res.user)
      } else {
        onNavigate(res.role === 'admin' ? 'admin' : 'account')
      }
    } catch (err) {
      setIsSubmitting(false)
      setErrorMessage(err.message || 'Invalid verification code. Please try again.')
    }
  }

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return
    const newOtp = [...otp]
    newOtp[idx] = val.slice(-1)
    setOtp(newOtp)

    // Focus next input automatically
    if (val && idx < 5) {
      const nextInput = document.getElementById(`unified-otp-input-${idx + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const prevInput = document.getElementById(`unified-otp-input-${idx - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleFillDemoOtp = () => {
    setOtp(['1', '2', '3', '4', '5', '6'])
  }

  return (
    <div className="admin-portal-wrapper">
      {/* Top Floating Navigation: Back to Website */}
      <div className="admin-top-nav-bar">
        <button
          type="button"
          className="admin-back-website-btn"
          onClick={() => onNavigate('home')}
        >
          <ArrowLeft size={16} />
          <span>Back to Main Website</span>
        </button>
        <button
          type="button"
          className="admin-store-link-btn"
          onClick={() => onNavigate('store')}
        >
          <span>Online Store</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Main 2-Panel Card Container */}
      <div className="admin-login-card-container unified-login-card">
        {/* Top-Right Decorative Cursive Script Badge */}
        <div className="admin-hero-script-badge">
          <span>Same</span>
          <span>mission.</span>
          <span>
            Bigger impact. <span className="script-heart">♡</span>
          </span>
        </div>

        <div className="admin-card-inner-grid">
          {/* ========================================================
              LEFT PANEL: Hero & Brand Mission
             ======================================================== */}
          <div className="admin-left-panel">
            {/* Top Brand Logo */}
            <div className="admin-panel-brand">
              <img
                src={logoMark}
                alt="City Pet Logo Mark"
                className="admin-brand-logo-img"
              />
              <div className="admin-brand-texts">
                <strong>CITY PET</strong>
                <small>ANIMAL HOSPITAL</small>
              </div>
            </div>

            {/* Hero Copy */}
            <div className="admin-left-copy">
              <span className="admin-left-eyebrow">
                CARING PEOPLE. HEALTHIER PETS.
              </span>
              <h1 className="admin-left-title">
                Behind every healthy pet is a dedicated team.
              </h1>
              <p className="admin-left-desc">
                Welcome to City Pet Animal Hospital. Access pet healthcare records, online store orders, and compassionate veterinary care in one secure account.
              </p>
            </div>

            {/* Pets Visual with Script Overlay */}
            <div className="admin-left-pets-stage">
              <div className="admin-pets-img-wrap">
                <img
                  src={checkoutHeroPets}
                  alt="Golden Retriever dog and tabby cat"
                  className="admin-pets-img"
                />
              </div>

              <div className="admin-pets-script-overlay">
                <span>Happier</span>
                <span>Pets</span>
                <span>Healthier</span>
                <span>
                  Lives <span className="script-heart">♡</span>
                </span>
              </div>
            </div>

            {/* 3 Bottom Pillars */}
            <div className="admin-left-pillars-row">
              <div className="admin-pillar-item">
                <div className="pillar-icon-circle mint-circle">
                  <ShieldCheck size={20} />
                </div>
                <strong>Better Care</strong>
              </div>
              <div className="admin-pillar-item">
                <div className="pillar-icon-circle peach-circle">
                  <Users size={20} />
                </div>
                <strong>Stronger Teams</strong>
              </div>
              <div className="admin-pillar-item">
                <div className="pillar-icon-circle purple-circle">
                  <Heart size={20} />
                </div>
                <strong>Healthier Tomorrows</strong>
              </div>
            </div>
          </div>

          {/* ========================================================
              RIGHT PANEL: Single Unified Sign In Form
             ======================================================== */}
          <div className="admin-right-panel">
            {/* Form Brand Header */}
            <div className="admin-form-header">
              <div className="admin-form-logo-row">
                <img
                  src={logoMark}
                  alt="City Pet Logo"
                  className="admin-form-logo-img"
                />
                <div className="admin-brand-texts">
                  <strong>CITY PET</strong>
                  <small>ANIMAL HOSPITAL</small>
                </div>
              </div>

              <span className="admin-portal-eyebrow">ACCOUNT LOGIN</span>

              {/* Form Title & Subtitle */}
              {step === 'otp' ? (
                <>
                  <h2 className="admin-portal-title">Enter Verification Code</h2>
                  <p className="admin-portal-desc">
                    We sent a 6-digit code to <strong>{countryCode} {phoneNumber}</strong>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="admin-portal-title">Sign In to City Pet</h2>
                  <p className="admin-portal-desc">
                    Enter your registered phone number to receive a one-time verification code (OTP).
                  </p>
                </>
              )}
            </div>

            {/* Error message alert */}
            {errorMessage && (
              <div className="admin-error-alert">{errorMessage}</div>
            )}

            {/* ----------------------------------------------------
                STEP 1: Phone Number Entry
               ---------------------------------------------------- */}
            {step === 'phone' && (
              <form className="admin-login-form" onSubmit={handleSendOtp}>
                <div className="admin-form-group">
                  <label className="admin-field-label">Phone Number</label>
                  <div className="admin-phone-input-cluster">
                    {/* Country Code Dropdown */}
                    <div className="country-code-selector">
                      <span className="country-flag" role="img" aria-label="Sri Lanka Flag">
                        🇱🇰
                      </span>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="country-code-select"
                      >
                        <option value="+94">+94 (LK)</option>
                        <option value="+1">+1 (US/CA)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+61">+61 (AU)</option>
                        <option value="+65">+65 (SG)</option>
                      </select>
                      <ChevronDown size={14} className="dropdown-chevron" />
                    </div>

                    <div className="phone-input-divider" />

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      className="phone-number-field"
                      placeholder="77 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Demo Helper Links */}
                  <div className="phone-demo-quick-helpers">
                    <span className="demo-helper-label">Demo logins:</span>
                    <button
                      type="button"
                      className="demo-number-chip"
                      onClick={() => setPhoneNumber('77 123 4567')}
                    >
                      User (077 123 4567)
                    </button>
                    <span className="chip-sep">•</span>
                    <button
                      type="button"
                      className="demo-number-chip"
                      onClick={() => setPhoneNumber('71 234 5678')}
                    >
                      Admin (071 234 5678)
                    </button>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  className="admin-submit-btn"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Sending OTP Code...' : 'Send OTP Code'}</span>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {/* ----------------------------------------------------
                STEP 2: OTP Verification
               ---------------------------------------------------- */}
            {step === 'otp' && (
              <form className="admin-login-form" onSubmit={handleVerifyOtp}>
                <div className="admin-form-group">
                  <div className="otp-label-row">
                    <label className="admin-field-label">One-Time Password (OTP)</label>
                    <button
                      type="button"
                      className="demo-code-btn"
                      onClick={handleFillDemoOtp}
                    >
                      Fill Demo (123456)
                    </button>
                  </div>

                  <div className="otp-boxes-row">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`unified-otp-input-${idx}`}
                        type="text"
                        maxLength={1}
                        className="otp-box-input"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  <div className="otp-resend-row">
                    {timer > 0 ? (
                      <span className="resend-countdown">
                        Resend code in <strong>{timer}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="resend-action-btn"
                        onClick={() => {
                          setTimer(30)
                          setErrorMessage('')
                        }}
                      >
                        <RefreshCw size={13} /> Resend OTP Code
                      </button>
                    )}
                    <button
                      type="button"
                      className="change-phone-btn"
                      onClick={() => setStep('phone')}
                    >
                      Change Number
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-submit-btn"
                  disabled={isSubmitting}
                >
                  <span>
                    {isSubmitting ? 'Verifying Credentials...' : 'Verify & Sign In'}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </form>
            )}

            {/* Security Assurance Card */}
            <div className="admin-security-card">
              <div className="security-icon-circle">
                <Lock size={17} />
              </div>
              <div className="security-texts">
                <strong>Secure Access</strong>
                <p>
                  Your information is encrypted and protected with industry-standard security.
                </p>
              </div>
            </div>

            <div className="admin-divider-line" />

            {/* Help & Support Footer */}
            <div className="admin-support-footer">
              <div className="support-icon-wrap">
                <Headphones size={20} />
              </div>
              <div className="support-texts">
                <strong>Need help signing in?</strong>
                <p>Contact City Pet Hospital Support</p>
                <div className="support-links-row">
                  <a href="tel:+94112345678">+94 11 234 5678</a>
                  <span className="sep">|</span>
                  <a href="mailto:support@citypet.lk">support@citypet.lk</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <footer className="admin-bottom-footer-bar">
        <span>© {new Date().getFullYear()} City Pet Animal Hospital. All rights reserved.</span>
        <span>Caring for pets. Building healthier tomorrows.</span>
      </footer>
    </div>
  )
}
