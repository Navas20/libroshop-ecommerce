import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import authService from '../services/authService'

export default function VerificarEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verificando')
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Token de verificación no encontrado')
      return
    }
    authService.verifyEmail(token)
      .then(() => setStatus('exitoso'))
      .catch((err) => {
        setStatus('error')
        setError(err.response?.data?.error || 'Error al verificar el correo')
      })
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'verificando' && (
          <>
            <Loader size={48} className="spinner" style={{ color: '#e94560' }} />
            <h1>Verificando tu correo...</h1>
          </>
        )}
        {status === 'exitoso' && (
          <>
            <CheckCircle size={48} style={{ color: '#22c55e' }} />
            <h1>Correo verificado</h1>
            <p>Tu correo electrónico ha sido verificado exitosamente.</p>
            <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={48} style={{ color: '#e94560' }} />
            <h1>Error de verificación</h1>
            <p>{error}</p>
            <Link to="/" className="btn btn-primary">Volver al inicio</Link>
          </>
        )}
      </div>
    </div>
  )
}
