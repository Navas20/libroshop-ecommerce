import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Registro() {
  const navigate = useNavigate()
  const { user, register } = useAuth()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    navigate('/', { replace: true })
    return null
  }

  const validate = () => {
    const errs = {}

    if (!nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    else if (nombre.trim().length < 2) errs.nombre = 'El nombre debe tener al menos 2 caracteres'

    if (!email.trim()) errs.email = 'El email es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Email inválido'

    if (!password) errs.password = 'La contraseña es obligatoria'
    else if (password.length < 8) errs.password = 'Debe tener al menos 8 caracteres'
    else if (!/[A-Z]/.test(password)) errs.password = 'Debe contener una mayúscula'
    else if (!/[0-9]/.test(password)) errs.password = 'Debe contener un número'
    else if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) errs.password = 'Debe contener un símbolo'

    if (!confirmPassword) errs.confirmPassword = 'Confirma tu contraseña'
    else if (password !== confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      await register(nombre.trim(), email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Error al registrarse')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Crear Cuenta</h1>
        <p>Regístrate para empezar a comprar</p>

        {serverError && <div className="form-error" style={{ textAlign: 'center', marginBottom: 16 }}>{serverError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            {errors.nombre && <p className="form-error">{errors.nombre}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número, 1 símbolo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link></p>
        </div>
      </div>
    </div>
  )
}
