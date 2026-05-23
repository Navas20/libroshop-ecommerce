import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice, calculateSubtotal, calculateDiscount, calculateTotal } from '../utils/formatPrice'

export default function Carrito() {
  const { items, removeItem, updateQuantity } = useCart()

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <h2>Tu carrito está vacío</h2>
          <p>Agrega libros para empezar tu compra</p>
          <Link to="/catalogo" className="btn btn-primary">Ver Catálogo</Link>
        </div>
      </div>
    )
  }

  const subtotal = calculateSubtotal(items)
  const discount = calculateDiscount(subtotal)
  const total = calculateTotal(subtotal)

  return (
    <div className="cart-page">
      <h1>Carrito de Compras</h1>

      <div className="cart-items">
        {items.map(item => {
          const cover = item.cover || item.cover_url || '/placeholder.svg'
          const displayPrice = item.price_final || item.price || 0

          return (
            <div key={item.key} className="cart-item">
              <div className="cart-item-image">
                <img src={cover} alt={item.title} />
              </div>
              <div className="cart-item-info">
                <h3>{item.title}</h3>
                <p>{formatPrice(displayPrice)}</p>
              </div>
              <div className="cart-item-controls">
                <div className="cart-item-qty">
                  <button onClick={() => updateQuantity(item.key, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.key, item.quantity + 1)}>+</button>
                </div>
                <span className="cart-item-subtotal">{formatPrice(displayPrice * item.quantity)}</span>
                <button className="cart-item-remove" onClick={() => removeItem(item.key)}>
                  ✕
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="cart-summary">
        <h3>Resumen de compra</h3>
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="cart-summary-row">
          <span>Descuento (-20%)</span>
          <span>-{formatPrice(discount)}</span>
        </div>
        <div className="cart-summary-row total">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <Link to="/checkout" className="btn btn-primary btn-block" style={{ marginTop: 16 }}>
          Proceder al pago
        </Link>
      </div>
    </div>
  )
}
