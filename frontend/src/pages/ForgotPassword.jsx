import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import authService from '../services/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Ingresa tu email')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar el correo')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Recuperar contraseña</h1>
        <p>Ingresa tu email y te enviaremos un enlace de recuperación</p>

        {success ? (
          <>
            <div className="form-success">
              Si el email existe, recibirás un enlace de recuperación
            </div>
            <div className="auth-footer">
              <Link to="/login">Volver al inicio de sesión</Link>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                placeholder="tu@email.com"
              />
            </div>
            {error && <p className="form-error" style={{ marginBottom: 16 }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              <Mail size={18} />
              {submitting ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <Link to="/login">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  )
}
