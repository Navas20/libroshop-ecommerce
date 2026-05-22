import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import authService from '../services/authService'

const validatePassword = (password) => {
  const errs = []
  if (password.length < 8) errs.push('Mínimo 8 caracteres')
  if (!/[A-Z]/.test(password)) errs.push('Debe contener una mayúscula')
  if (!/\d/.test(password)) errs.push('Debe contener un número')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errs.push('Debe contener un símbolo')
  return errs
}

export default function ResetPassword() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    const pwErrors = validatePassword(password)
    if (pwErrors.length > 0) errs.password = pwErrors.join('. ')
    if (password !== confirm) errs.confirm = 'Las contraseñas no coinciden'
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Error al restablecer la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Contraseña actualizada</h1>
          <div className="form-success">
            Tu contraseña ha sido restablecida exitosamente
          </div>
          <Link to="/login" className="btn btn-primary btn-block" style={{ textAlign: 'center' }}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Nueva contraseña</h1>
        <p>Ingresa tu nueva contraseña</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })) }}
              placeholder="••••••••"
            />
            {fieldErrors.password && <p className="form-error">{fieldErrors.password}</p>}
          </div>
          <div className="form-group">
            <label>Confirmar contraseña</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setFieldErrors(prev => ({ ...prev, confirm: '' })) }}
              placeholder="••••••••"
            />
            {fieldErrors.confirm && <p className="form-error">{fieldErrors.confirm}</p>}
          </div>
          {submitError && <p className="form-error" style={{ marginBottom: 16 }}>{submitError}</p>}
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            <Lock size={18} />
            {submitting ? 'Actualizando...' : 'Restablecer contraseña'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  )
}
