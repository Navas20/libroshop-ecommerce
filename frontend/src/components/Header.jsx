import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Menu, X, User, LogOut, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Header() {
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          Libro<span>Shop</span>
        </Link>

        <nav className={`header-nav${menuOpen ? ' open' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Inicio</Link>
          <Link to="/catalogo" onClick={() => setMenuOpen(false)}>Catálogo</Link>
          {user && (
            <Link to="/mis-pedidos" onClick={() => setMenuOpen(false)}>Mis Pedidos</Link>
          )}
        </nav>

        <div className="header-actions">
          <Link to="/carrito" className="cart-btn">
            <ShoppingCart size={22} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          {user ? (
            <div className="user-menu">
              <button className="user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <User size={16} />
                <span style={{ marginLeft: 6 }}>{user.nombre?.split(' ')[0]}</span>
              </button>
              {dropdownOpen && (
                <div className="user-dropdown">
                  <Link to="/mis-pedidos" onClick={() => setDropdownOpen(false)}>
                    <Package size={16} style={{ marginRight: 8 }} />
                    Mis Pedidos
                  </Link>
                  <button onClick={() => { logout(); setDropdownOpen(false) }}>
                    <LogOut size={16} style={{ marginRight: 8 }} />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Ingresar</Link>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  )
}
