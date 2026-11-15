import React, { useState, useEffect } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import logoMark from '../../assets/citypet-logo-mark.png'
import { authService } from '../../services/api'

export default function AdminLogin({
  isOpen = true,
  onClose,
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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch server-configured Google Client ID if not already set in env
  useEffect(() => {
    if (!isOpen) return
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
  }, [isOpen, googleClientId])

  // Load Google Identity Services script
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return
    if (window.google?.accounts || document.getElementById('google-gsi-client-script')) {
      return
    }
    const script = document.createElement('script')
    script.id = 'google-gsi-client-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  const handleCloseModal = () => {
    setErrorMessage('')
    if (onClose) {
      onClose()
    } else if (onNavigate) {
      onNavigate('home')
    }
  }

  const isStaffRole = (role) => {
    const r = String(role || '').toLowerCase().trim()
    return (
      r === 'admin' ||
      r === 'super_admin' ||
      r === 'veterinary_surgeon' ||
      r === 'doctor' ||
      r === 'pharmacist' ||
      r === 'receptionist_cashier' ||
      r === 'store_manager' ||
      r === 'audit_compliance' ||
      r === 'nurse_technician' ||
      r === 'staff'
    )
  }

  const completeAuthentication = (res) => {
    setErrorMessage('')
    const targetUser = res?.user || res
    if (onLoginSuccess && targetUser) {
      onLoginSuccess(targetUser)
    } else if (onNavigate) {
      const role = targetUser?.role || res?.role
      onNavigate(isStaffRole(role) ? 'admin' : 'account')
    }
  }

  const handleEmailLogin = async (e) => {
    e?.preventDefault()
    setErrorMessage('')

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
      setErrorMessage('Passwords do not match.')
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

  const handleGoogleButtonClick = () => {
    setErrorMessage('')
    if (!googleClientId) {
      setErrorMessage('Google Sign-In is not configured yet. Please sign in or create an account with your email.')
      return
    }
    if (!window.google?.accounts?.oauth2) {
      setErrorMessage('Google Sign-In is loading. Please try again in a moment.')
      return
    }
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'openid email profile',
      callback: async (tokenResponse) => {
        if (tokenResponse?.error) {
          setErrorMessage('Google sign-in was cancelled.')
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

  const switchMode = (targetMode) => {
    setMode(targetMode)
    setErrorMessage('')
  }

  return (
    <div
      className="auth-popup-overlay"
      onClick={handleCloseModal}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'register' ? 'Create Account' : 'Sign In to City Pet'}
    >
      <div className="auth-popup-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Row: Brand Logo + Close Button */}
        <div className="auth-popup-top-bar">
          <div className="admin-form-logo-row" style={{ marginBottom: 0 }}>
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

          <button
            type="button"
            className="auth-popup-close-btn"
            onClick={handleCloseModal}
            aria-label="Close sign in window"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Switcher Tabs (Sign In / Create Account) */}
        <div className="auth-mode-tabs" role="tablist">
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

        {/* Heading & Short Subtitle */}
        <div className="auth-popup-heading">
          <span className="admin-portal-eyebrow">
            {mode === 'register' ? 'CREATE ACCOUNT' : 'ACCOUNT SIGN IN'}
          </span>
          <h2 className="admin-portal-title">
            {mode === 'register' ? 'Create Your Account' : 'Sign In to City Pet'}
          </h2>
          <p className="admin-portal-desc">
            {mode === 'register'
              ? 'Register with your email and password or connect your Google account.'
              : 'Enter your email address and password or sign in with your Google account.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="admin-error-alert" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Continue with Google Button */}
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

        <div className="auth-or-separator">
          <span>{mode === 'register' ? 'OR REGISTER WITH EMAIL' : 'OR SIGN IN WITH EMAIL'}</span>
        </div>

        {/* ----------------------------------------------------
            MODE 1: EMAIL & PASSWORD SIGN IN
           ---------------------------------------------------- */}
        {mode === 'login' ? (
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
              <ArrowRight size={17} />
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
        ) : (
          /* ----------------------------------------------------
              MODE 2: CREATE NEW ACCOUNT (REGISTER)
             ---------------------------------------------------- */
          <form className="admin-login-form auth-compact-register-form" onSubmit={handleRegister}>
            <div className="auth-form-two-col">
              <div className="admin-form-group">
                <label className="admin-field-label" htmlFor="reg-name-input">
                  Full Name
                </label>
                <div className="auth-input-cluster">
                  <User size={15} className="auth-input-icon" />
                  <input
                    id="reg-name-input"
                    type="text"
                    className="auth-text-input"
                    placeholder="Your name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label className="admin-field-label" htmlFor="reg-phone-input">
                  Phone
                </label>
                <div className="auth-input-cluster">
                  <Phone size={15} className="auth-input-icon" />
                  <input
                    id="reg-phone-input"
                    type="tel"
                    className="auth-text-input"
                    placeholder="077 123 4567"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-field-label" htmlFor="reg-email-input">
                Email Address
              </label>
              <div className="auth-input-cluster">
                <Mail size={15} className="auth-input-icon" />
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

            <div className="auth-form-two-col">
              <div className="admin-form-group">
                <label className="admin-field-label" htmlFor="reg-password-input">
                  Password
                </label>
                <div className="auth-input-cluster">
                  <Lock size={15} className="auth-input-icon" />
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
                  Confirm
                </label>
                <div className="auth-input-cluster">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    id="reg-confirm-password-input"
                    type={showRegPassword ? 'text' : 'password'}
                    className="auth-text-input"
                    placeholder="Repeat"
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
              <ArrowRight size={17} />
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
      </div>
    </div>
  )
}
