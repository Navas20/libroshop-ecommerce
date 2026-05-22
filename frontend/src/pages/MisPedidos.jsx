import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'
import orderService from '../services/orderService'
import { formatPrice } from '../utils/formatPrice'

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  fallido: 'Fallido',
  reembolsado: 'Reembolsado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  APPROVED: 'Pagado',
  DECLINED: 'Fallido',
  PENDING: 'Pendiente'
}

const getStatusClass = (status) => {
  const s = (status || '').toLowerCase()
  if (['pagado', 'approved'].some(x => x === s || (status || '').toUpperCase() === x.toUpperCase() && s === x)) return 'pagado'
  if (['fallido', 'declined'].some(x => x === s || (status || '').toUpperCase() === x.toUpperCase() && s === x)) return 'fallido'
  if (s === 'reembolsado') return 'reembolsado'
  return 'pendiente'
}

export default function MisPedidos() {
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const fetchOrders = async (p) => {
    setLoading(true)
    setError(null)
    try {
      const data = await orderService.getOrders(p, 10)
      setOrders(data.orders || data.data || [])
      setTotalPages(data.totalPages || data.meta?.totalPages || 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(page)
  }, [page])

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  if (loading && orders.length === 0) return <div className="loading-page" />
  if (error) return <div className="error-message"><p>{error}</p></div>

  return (
    <div className="pedidos-page">
      <h1>Mis pedidos</h1>

      {orders.length === 0 ? (
        <div className="cart-empty">
          <Package size={48} style={{ color: 'var(--color-text-light)', marginBottom: 16 }} />
          <h2>No tienes pedidos</h2>
          <p>Aún no has realizado ninguna compra.</p>
        </div>
      ) : (
        <>
          {orders.map(order => {
            const id = order._id || order.id
            const isExpanded = expandedId === id
            const items = order.items || order.productos || []
            const status = order.estado || order.status || 'pendiente'
            const total = order.total || order.montoTotal || 0
            const orderNumber = order.numeroOrden || order.numero || id?.slice(-8).toUpperCase()

            return (
              <div
                key={id}
                className="pedido-card"
                onClick={() => toggleExpand(id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="pedido-header">
                  <div>
                    <div className="pedido-id">#{orderNumber}</div>
                    <div className="pedido-fecha">{formatDate(order.createdAt || order.fecha)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`pedido-estado ${getStatusClass(status)}`}>
                      {STATUS_LABELS[status] || status}
                    </span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
                <div className="pedido-total" onClick={e => e.stopPropagation()}>
                  Total: {formatPrice(total)}
                </div>
                {isExpanded && (
                  <div className="pedido-items" onClick={e => e.stopPropagation()}>
                    {items.map((item, i) => (
                      <div key={item._id || i} className="pedido-item">
                        <span>{(item.libro?.titulo || item.titulo || item.nombre) + ' x' + (item.cantidad || item.quantity || 1)}</span>
                        <span>{formatPrice((item.libro?.precio || item.precio) * (item.cantidad || item.quantity || 1))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {totalPages > 1 && (
            <div className="pagination" style={{
              display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32
            }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '0.9rem' }}>
                Página {page} de {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
