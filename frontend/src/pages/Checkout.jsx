import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import orderService from '../services/orderService'
import { formatPrice, calculateSubtotal, calculateDiscount, calculateTotal } from '../utils/formatPrice'
import WompiWidget from '../components/WompiWidget'

const initialShipping = {
  nombre: '',
  email: '',
  direccion: '',
  ciudad: '',
  codigoPostal: ''
}

const validateShipping = (data) => {
  const errs = {}
  if (!data.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
  if (!data.email.trim()) errs.email = 'El email es obligatorio'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email inválido'
  if (!data.direccion.trim()) errs.direccion = 'La dirección es obligatoria'
  if (!data.ciudad.trim()) errs.ciudad = 'La ciudad es obligatoria'
  if (!data.codigoPostal.trim()) errs.codigoPostal = 'El código postal es obligatorio'
  return errs
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, loading, refreshCart } = useCart()
  const [step, setStep] = useState(1)
  const [shipping, setShipping] = useState(initialShipping)
  const [fieldErrors, setFieldErrors] = useState({})
  const [orderId, setOrderId] = useState(null)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [pollError, setPollError] = useState(false)

  useEffect(() => {
    refreshCart()
  }, [])

  useEffect(() => {
    if (!loading && items.length === 0) {
      navigate('/carrito')
    }
  }, [loading, items])

  const handleChange = (e) => {
    const { name, value } = e.target
    setShipping(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleShippingSubmit = async (e) => {
    e.preventDefault()
    const errs = validateShipping(shipping)
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const data = await orderService.createOrder(shipping)
      setOrderId(data.order?._id || data.order?.id || data._id || data.id)
      setStep(2)
    } catch (err) {
      setFieldErrors({ submit: err.response?.data?.message || 'Error al crear la orden' })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentReady = () => {
    setStep(3)
    startPolling()
  }

  const startPolling = () => {
    if (!paymentInfo?.reference) return
    setPollError(false)
    
    let attempts = 0
    const maxAttempts = 40 // 40 intentos * 3 segundos = 2 minutos máximo
    
    const interval = setInterval(async () => {
      attempts++
      
      // Timeout después de 2 minutos
      if (attempts >= maxAttempts) {
        clearInterval(interval)
        setPollError(true)
        setFieldErrors({ submit: 'Tiempo de espera agotado. Por favor verifica el estado de tu pago en "Mis Pedidos".' })
        return
      }
      
      try {
        const data = await orderService.getPaymentStatus(paymentInfo.reference)
        const status = data.status || data.data?.status
        setPaymentStatus(status)
        if (status === 'APPROVED') {
          clearInterval(interval)
          navigate(`/confirmacion?orderId=${orderId}&reference=${paymentInfo.reference}`)
        } else if (status === 'DECLINED') {
          clearInterval(interval)
        }
      } catch {
        setPollError(true)
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }

  const loadPayment = async () => {
    if (!orderId || paymentInfo) return
    try {
      const data = await orderService.createPayment(orderId)
      setPaymentInfo({
        reference: data.reference || data.data?.reference,
        amountInCents: data.amountInCents || data.data?.amountInCents,
        integrityHash: data.integrityHash || data.data?.integrityHash || data.signature || data.data?.signature
      })
    } catch (err) {
      setFieldErrors({ submit: err.response?.data?.message || 'Error al iniciar el pago' })
    }
  }

  useEffect(() => {
    if (step === 2) loadPayment()
  }, [step])

  const subtotal = calculateSubtotal(items)
  const discount = calculateDiscount(subtotal)
  const total = calculateTotal(subtotal)

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-steps">
        {[1, 2, 3].map(s => (
          <div key={s} className={`step-indicator ${step === s ? 'active' : step > s ? 'completed' : ''}`}>
            <span className="step-number">{s}</span>
            <span className="step-label">
              {s === 1 ? 'Envío' : s === 2 ? 'Pago' : 'Confirmación'}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="checkout-grid">
          <form className="checkout-form" onSubmit={handleShippingSubmit}>
            <h2>Datos de envío</h2>
            <div className="form-group">
              <label>Nombre completo</label>
              <input name="nombre" value={shipping.nombre} onChange={handleChange} placeholder="Tu nombre" />
              {fieldErrors.nombre && <p className="form-error">{fieldErrors.nombre}</p>}
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" value={shipping.email} onChange={handleChange} placeholder="tu@email.com" />
              {fieldErrors.email && <p className="form-error">{fieldErrors.email}</p>}
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input name="direccion" value={shipping.direccion} onChange={handleChange} placeholder="Calle, número, colonia" />
              {fieldErrors.direccion && <p className="form-error">{fieldErrors.direccion}</p>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ciudad</label>
                <input name="ciudad" value={shipping.ciudad} onChange={handleChange} placeholder="Ciudad" />
                {fieldErrors.ciudad && <p className="form-error">{fieldErrors.ciudad}</p>}
              </div>
              <div className="form-group">
                <label>Código postal</label>
                <input name="codigoPostal" value={shipping.codigoPostal} onChange={handleChange} placeholder="00000" />
                {fieldErrors.codigoPostal && <p className="form-error">{fieldErrors.codigoPostal}</p>}
              </div>
            </div>
            {fieldErrors.submit && <p className="form-error" style={{ marginBottom: 16 }}>{fieldErrors.submit}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Procesando...' : 'Continuar al pago'}
            </button>
          </form>
          <div className="checkout-summary">
            <h2>Resumen del pedido</h2>
            {items.map(item => (
              <div key={item.book?._id || item._id} className="checkout-summary-item">
                <span>{(item.book?.titulo || item.titulo) + ' x' + item.quantity}</span>
                <span>{formatPrice((item.book?.precio || item.precio) * item.quantity)}</span>
              </div>
            ))}
            <div className="cart-summary">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Descuento (20%)</span>
                <span>-{formatPrice(discount)}</span>
              </div>
              <div className="cart-summary-row total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="checkout-payment">
          <div className="checkout-form" style={{ textAlign: 'center', padding: 48 }}>
            <h2>Pago con Wompi</h2>
            {paymentInfo ? (
              <>
                <p style={{ marginBottom: 24, color: 'var(--color-text-light)' }}>
                  Total a pagar: <strong style={{ color: 'var(--color-text)' }}>{formatPrice(paymentInfo.amountInCents)}</strong>
                </p>
                <WompiWidget
                  amount={paymentInfo.amountInCents}
                  reference={paymentInfo.reference}
                  integrityHash={paymentInfo.integrityHash}
                  onComplete={handlePaymentReady}
                />
              </>
            ) : (
              <div className="loading-spinner" />
            )}
            {fieldErrors.submit && <p className="form-error" style={{ marginTop: 16 }}>{fieldErrors.submit}</p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="checkout-payment">
          <div className="checkout-form" style={{ textAlign: 'center', padding: 48 }}>
            <h2>Verificando pago</h2>
            {paymentStatus === 'DECLINED' ? (
              <>
                <p className="form-error" style={{ fontSize: '1rem', marginBottom: 16 }}>
                  El pago fue rechazado. Intenta de nuevo.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => { setStep(2); setPaymentInfo(null); setPaymentStatus(null); setPollError(false) }}
                >
                  Reintentar
                </button>
              </>
            ) : (
              <>
                <div className="loading-spinner" />
                <p style={{ marginTop: 24, color: 'var(--color-text-light)' }}>
                  Esperando confirmación del pago...
                </p>
                {pollError && (
                  <p className="form-error" style={{ marginTop: 12 }}>
                    Error al verificar el pago. Recarga la página.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
