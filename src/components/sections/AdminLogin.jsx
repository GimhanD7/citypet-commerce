import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  Heart,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserPlus,
  Users,
} from 'lucide-react'
import checkoutHeroPets from '../../assets/checkout-hero-pets.jpg'
import logoMark from '../../assets/citypet-logo-mark.png'
import { authService } from '../../services/api'

export default function AdminLogin({
  onNavigate,
  onLoginSuccess,
  initialMode = 'login',
}) {
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login') // 'login' | 'register'

  // Login fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  // Google Sign-In state
  const [googleClientId, setGoogleClientId] = useState(
    () =>
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
      (typeof window !== 'undefined' && window.localStorage?.getItem('citypet_google_client_id')) ||
      ''
  )
  const [gsiReady, setGsiReady] = useState(false)
  const [showClientIdPrompt, setShowClientIdPrompt] = useState(false)
  const [tempClientIdInput, setTempClientIdInput] = useState('')
  const googleBtnContainerRef = useRef(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Fetch server-configured Google Client ID if not already set in env
  useEffect(() => {
    let mounted = true
    authService
      .getSession()
      .then((res) => {
        if (!mounted) return
        if (res?.googleClientId && !googleClientId) {
          setGoogleClientId(res.googleClientId)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [googleClientId])

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.google?.accounts) {
      setGsiReady(true)
      return
    }
    const existingScript = document.getElementById('google-gsi-client-script')
    if (existingScript) {
      existingScript.addEventListener('load', () => setGsiReady(true))
      return
    }
    const script = document.createElement('script')
    script.id = 'google-gsi-client-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setGsiReady(true)
    document.head.appendChild(script)
  }, [])

  // Initialize Google Identity Services ID token callback if clientId is configured
  useEffect(() => {
    if (!gsiReady || !googleClientId || !window.google?.accounts?.id) return
    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response?.credential) return
          setErrorMessage('')
          setIsSubmitting(true)
          try {
            const res = await authService.googleLogin({ credential: response.credential })
            setIsSubmitting(false)
            completeAuthentication(res)
          } catch (err) {
            setIsSubmitting(false)
            setErrorMessage(err.message || 'Google sign-in failed. Please try again.')
          }
        },
      })
      if (googleBtnContainerRef.current) {
        googleBtnContainerRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: 'outline',
          size: 'large',
          width: 360,
          text: mode === 'register' ? 'signup_with' : 'continue_with',
          shape: 'pill',
        })
      }
    } catch (err) {
      console.warn('Google Identity initialization warning:', err)
    }
  }, [gsiReady, googleClientId, mode])

  const completeAuthentication = (res) => {
    if (onLoginSuccess && res?.user) {
      onLoginSuccess(res.user)
    } else if (onNavigate) {
      onNavigate(res?.role === 'admin' ? 'admin' : 'account')
    }
  }

  const handleEmailLogin = async (e) => {
    e?.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.')
      return
    }
    if (!password) {
      setErrorMessage('Please enter your password.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await authService.login(cleanEmail, password)
      setIsSubmitting(false)
      completeAuthentication(res)
    } catch (err) {
      setIsSubmitting(false)
      setErrorMessage(err.message || 'Invalid email or password. Please try again.')
    }
  }

  const handleRegister = async (e) => {
    e?.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const cleanName = regName.trim()
    const cleanEmail = regEmail.trim()
    const cleanPhone = regPhone.trim()

    if (cleanName.length < 2) {
      setErrorMessage('Please enter your full name.')
      return
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.')
      return
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await authService.register({
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: regPassword,
      })
      setIsSubmitting(false)
      completeAuthentication(res)
    } catch (err) {
      setIsSubmitting(false)
      setErrorMessage(err.message || 'Registration failed. Please try again.')
    }
  }

  const triggerGooglePopupWithClientId = (clientIdToUse) => {
    if (!window.google?.accounts?.oauth2) {
      setErrorMessage('Google Sign-In service is still loading. Please try again in a moment.')
      return
    }
    setErrorMessage('')
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientIdToUse,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse?.error) {
          setErrorMessage('Google sign-in was cancelled or denied.')
          return
        }
        if (tokenResponse?.access_token) {
          setIsSubmitting(true)
          try {
            const res = await authService.googleLogin({
              access_token: tokenResponse.access_token,
            })
            setIsSubmitting(false)
            completeAuthentication(res)
          } catch (err) {
            setIsSubmitting(false)
            setErrorMessage(err.message || 'Unable to sign in with Google.')
          }
        }
      },
    })
    tokenClient.requestAccessToken({ prompt: 'select_account' })
  }

  const handleGoogleButtonClick = () => {
    setErrorMessage('')
    if (!googleClientId) {
      setShowClientIdPrompt(true)
      return
    }
    triggerGooglePopupWithClientId(googleClientId)
  }

  const handleSaveGoogleClientId = (e) => {
    e?.preventDefault()
    const cleaned = tempClientIdInput.trim()
    if (!cleaned || !cleaned.includes('.apps.googleusercontent.com')) {
      setErrorMessage('Please enter a valid Google OAuth Client ID ending in .apps.googleusercontent.com')
      return
    }
    try {
      window.localStorage?.setItem('citypet_google_client_id', cleaned)
    } catch {}
    setGoogleClientId(cleaned)
    setShowClientIdPrompt(false)
    setErrorMessage('')
    triggerGooglePopupWithClientId(cleaned)
  }

  const switchMode = (targetMode) => {
    setMode(targetMode)
    setErrorMessage('')
    setSuccessMessage('')
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
              RIGHT PANEL: Email/Password Login, Register & Google Auth
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

              {/* Mode Switcher Tabs (Sign In vs Create Account) */}
              <div className="auth-mode-tabs" role="tablist" aria-label="Account Authentication">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`auth-mode-tab-btn ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  <Lock size={14} />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={`auth-mode-tab-btn ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => switchMode('register')}
                >
                  <UserPlus size={14} />
                  <span>Create Account</span>
                </button>
              </div>

              <span className="admin-portal-eyebrow">
                {mode === 'register' ? 'NEW CUSTOMER REGISTRATION' : 'ACCOUNT SIGN IN'}
              </span>

              {mode === 'register' ? (
                <>
                  <h2 className="admin-portal-title">Create Your Account</h2>
                  <p className="admin-portal-desc">
                    Register with your email and password or connect your Google account to manage orders and pet care.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="admin-portal-title">Sign In to City Pet</h2>
                  <p className="admin-portal-desc">
                    Enter your email address and password or sign in with your Google account.
                  </p>
                </>
              )}
            </div>

            {/* Error / Success Alerts */}
            {errorMessage && (
              <div className="admin-error-alert" role="alert">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="admin-success-alert" role="status">
                {successMessage}
              </div>
            )}

            {/* Google Sign-In Button */}
            <div className="google-auth-section">
              <button
                type="button"
                className="google-continue-btn"
                onClick={handleGoogleButtonClick}
                disabled={isSubmitting}
              >
                <svg className="google-g-logo" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}</span>
              </button>

              {/* Official Google Identity Button mount point when client ID is present */}
              {googleClientId && (
                <div ref={googleBtnContainerRef} className="google-gsi-rendered-wrap" />
              )}

              {/* Inline Google Client ID setup box if not yet configured */}
              {showClientIdPrompt && !googleClientId && (
                <div className="google-client-id-setup-box">
                  <p className="google-setup-title">Connect Google OAuth Client ID</p>
                  <p className="google-setup-desc">
                    Paste your Google Cloud OAuth 2.0 Web Client ID (or set <code>GOOGLE_CLIENT_ID</code> in GitHub variables):
                  </p>
                  <div className="google-setup-input-row">
                    <input
                      type="text"
                      className="auth-text-input"
                      placeholder="1234567890-abc.apps.googleusercontent.com"
                      value={tempClientIdInput}
                      onChange={(e) => setTempClientIdInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="google-setup-save-btn"
                      onClick={handleSaveGoogleClientId}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="auth-or-separator">
              <span>or {mode === 'register' ? 'register with email' : 'sign in with email'}</span>
            </div>

            {/* ----------------------------------------------------
                MODE 1: EMAIL & PASSWORD SIGN IN
               ---------------------------------------------------- */}
            {mode === 'login' && (
              <form className="admin-login-form" onSubmit={handleEmailLogin}>
                <div className="admin-form-group">
                  <label className="admin-field-label" htmlFor="login-email-input">
                    Email Address
                  </label>
                  <div className="auth-input-cluster">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      id="login-email-input"
                      type="email"
                      className="auth-text-input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-field-label" htmlFor="login-password-input">
                    Password
                  </label>
                  <div className="auth-input-cluster">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      className="auth-text-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-submit-btn"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight size={18} />
                </button>

                <div className="auth-switch-prompt">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => switchMode('register')}
                  >
                    Create an account
                  </button>
                </div>
              </form>
            )}

            {/* ----------------------------------------------------
                MODE 2: CREATE NEW ACCOUNT (REGISTER)
               ---------------------------------------------------- */}
            {mode === 'register' && (
              <form className="admin-login-form" onSubmit={handleRegister}>
                <div className="admin-form-group">
                  <label className="admin-field-label" htmlFor="reg-name-input">
                    Full Name
                  </label>
                  <div className="auth-input-cluster">
                    <User size={16} className="auth-input-icon" />
                    <input
                      id="reg-name-input"
                      type="text"
                      className="auth-text-input"
                      placeholder="Enter your full name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-field-label" htmlFor="reg-email-input">
                    Email Address
                  </label>
                  <div className="auth-input-cluster">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      id="reg-email-input"
                      type="email"
                      className="auth-text-input"
                      placeholder="you@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-field-label" htmlFor="reg-phone-input">
                    Mobile Phone Number <span className="optional-tag">(Optional)</span>
                  </label>
                  <div className="auth-input-cluster">
                    <Phone size={16} className="auth-input-icon" />
                    <input
                      id="reg-phone-input"
                      type="tel"
                      className="auth-text-input"
                      placeholder="+94 77 123 4567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div className="auth-form-two-col">
                  <div className="admin-form-group">
                    <label className="admin-field-label" htmlFor="reg-password-input">
                      Password
                    </label>
                    <div className="auth-input-cluster">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        id="reg-password-input"
                        type={showRegPassword ? 'text' : 'password'}
                        className="auth-text-input"
                        placeholder="Min. 6 chars"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-field-label" htmlFor="reg-confirm-password-input">
                      Confirm Password
                    </label>
                    <div className="auth-input-cluster">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        id="reg-confirm-password-input"
                        type={showRegPassword ? 'text' : 'password'}
                        className="auth-text-input"
                        placeholder="Repeat password"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="admin-submit-btn"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
                  <ArrowRight size={18} />
                </button>

                <div className="auth-switch-prompt">
                  <span>Already have an account?</span>
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => switchMode('login')}
                  >
                    Sign In
                  </button>
                </div>
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
