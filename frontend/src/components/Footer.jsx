import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <h3>Libro<span>Shop</span></h3>
          <p>
            Tu tienda de libros favorita. Descubre miles de títulos
            y disfruta de la lectura con los mejores precios.
          </p>
        </div>

        <div className="footer-col">
          <h4>Enlaces</h4>
          <Link to="/">Inicio</Link>
          <Link to="/catalogo">Catálogo</Link>
          <Link to="/carrito">Carrito</Link>
        </div>

        <div className="footer-col">
          <h4>Cuenta</h4>
          <Link to="/login">Iniciar Sesión</Link>
          <Link to="/registro">Registrarse</Link>
          <Link to="/mis-pedidos">Mis Pedidos</Link>
        </div>

        <div className="footer-col">
          <h4>Ayuda</h4>
          <Link to="/contacto">Contacto</Link>
          <a href="#">Preguntas Frecuentes</a>
          <a href="#">Términos y Condiciones</a>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} LibroShop. Todos los derechos reservados.
      </div>
    </footer>
  )
}
