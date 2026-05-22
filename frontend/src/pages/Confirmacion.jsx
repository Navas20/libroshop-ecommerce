import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import orderService from '../services/orderService'
import { formatPrice } from '../utils/formatPrice'

export default function Confirmacion() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')
  const reference = searchParams.get('reference')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId) {
      setError('No se encontró la orden')
      setLoading(false)
      return
    }
    const fetchOrder = async () => {
      try {
        const data = await orderService.getOrderById(orderId)
        setOrder(data.order || data)
      } catch (err) {
        setError(err.response?.data?.message || 'Error al cargar la orden')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  if (loading) return <div className="loading-page" />
  if (error) return <div className="error-message"><p>{error}</p></div>
  if (!order) return null

  const items = order.items || order.products || []
  const total = order.total || order.montoTotal || 0
  const orderNumber = order.numeroOrden || order.numero || order._id?.slice(-8).toUpperCase() || orderId?.slice(-8).toUpperCase()

  return (
    <div className="confirmacion-page">
      <div className="confirmacion-check">
        <Check size={40} />
      </div>
      <h1>¡Compra exitosa!</h1>
      <p>Tu pedido ha sido procesado correctamente.</p>

      <div className="confirmacion-details">
        <div className="confirmacion-details-row">
          <span>Número de orden</span>
          <strong>{orderNumber}</strong>
        </div>
        <div className="confirmacion-details-row">
          <span>ID de transacción Wompi</span>
          <strong>{reference || order.transaccionId || '—'}</strong>
        </div>
      </div>

      <div className="confirmacion-details">
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 16, color: 'var(--color-primary)' }}>
          Resumen de compra
        </h3>
        {items.map((item, i) => (
          <div key={item._id || i} className="confirmacion-details-row">
            <span>{(item.libro?.titulo || item.titulo || item.nombre) + ' x' + (item.cantidad || item.quantity || 1)}</span>
            <span>{formatPrice((item.libro?.precio || item.precio) * (item.cantidad || item.quantity || 1))}</span>
          </div>
        ))}
        <div className="confirmacion-details-row" style={{ borderTop: '2px solid var(--color-border)', marginTop: 8, paddingTop: 12, fontWeight: 700 }}>
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/mis-pedidos" className="btn btn-primary">Ver mis pedidos</Link>
        <Link to="/" className="btn btn-outline">Seguir comprando</Link>
      </div>
    </div>
  )
}
