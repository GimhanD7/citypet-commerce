import React, { useId, useState } from 'react'
import { apiFetch } from '../../config/api'

export default function PasswordResetForm({ initialEmail, onBack, onReset }) {
  const id = useId()
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [codeRequested, setCodeRequested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setError('')

    if (codeRequested && password !== confirmation) {
      setError('The passwords do not match.')
      return
    }
    if (codeRequested && new TextEncoder().encode(password).length > 72) {
      setError('Choose a shorter password.')
      return
    }

    setBusy(true)
    try {
      if (codeRequested) {
        await apiFetch('auth.php?action=reset_password', {
          method: 'POST',
          body: { email, code, password },
        })
        onReset(email)
      } else {
        await apiFetch('auth.php?action=request_password_reset', {
          method: 'POST',
          body: { email },
          timeout: 30000,
        })
        setCodeRequested(true)
      }
    } catch (failure) {
      setError(failure.message || 'Unable to reset the password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="admin-login-form" onSubmit={submit}>
      <p role={codeRequested ? 'status' : undefined}>
        {codeRequested
          ? 'If the account can receive reset codes, the same six-digit code will arrive by email and SMS.'
          : 'Enter your account email to request a reset code by email and SMS.'}
      </p>
      <fieldset disabled={busy} className="auth-reset-fields">
        <div className="admin-form-group">
          <label className="admin-field-label" htmlFor={id + '-email'}>Account email</label>
          <div className="auth-input-cluster">
            <input id={id + '-email'} className="auth-text-input" type="email" autoComplete="email"
              required maxLength={150} readOnly={codeRequested} value={email}
              onChange={(event) => setEmail(event.target.value)} />
          </div>
        </div>
        {codeRequested && (
          <>
            <div className="admin-form-group">
              <label className="admin-field-label" htmlFor={id + '-code'}>Six-digit code</label>
              <div className="auth-input-cluster">
                <input id={id + '-code'} className="auth-text-input" inputMode="numeric"
                  autoComplete="one-time-code" required pattern="[0-9]{6}" maxLength={6}
                  value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
            {[
              ['password', 'New password', password, setPassword],
              ['confirm', 'Confirm new password', confirmation, setConfirmation],
            ].map(([key, label, value, setValue]) => (
              <div className="admin-form-group" key={key}>
                <label className="admin-field-label" htmlFor={id + '-' + key}>{label}</label>
                <div className="auth-input-cluster">
                  <input id={id + '-' + key} className="auth-text-input" type="password"
                    autoComplete="new-password" required minLength={8} maxLength={72} value={value}
                    onChange={(event) => setValue(event.target.value)} />
                </div>
              </div>
            ))}
          </>
        )}
      </fieldset>
      {error && <p className="otp-error-msg" role="alert">{error}</p>}
      <button type="submit" className="admin-submit-btn" disabled={busy}>
        {busy ? 'Please wait…' : codeRequested ? 'Change password' : 'Send reset code'}
      </button>
      <div className="auth-switch-prompt">
        {codeRequested && (
          <button type="button" className="auth-switch-link" disabled={busy} onClick={() => {
            setCodeRequested(false)
            setCode('')
            setPassword('')
            setConfirmation('')
            setError('')
          }}>Request another code</button>
        )}
        <button type="button" className="auth-switch-link" disabled={busy} onClick={onBack}>Back to sign in</button>
      </div>
    </form>
  )
}
