import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import bookService from '../services/bookService'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/formatPrice'

export default function Home() {
  const [featured, setFeatured] = useState({ newReleases: [], bestsellers: [], recommended: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addItem } = useCart()

  useEffect(() => {
    setLoading(true)
    bookService.getFeatured()
      .then(data => {
        setFeatured({
          newReleases: data.newReleases || [],
          bestsellers: data.bestsellers || [],
          recommended: data.awardWinning || [] // El backend devuelve awardWinning
        })
      })
      .catch(err => setError(err?.message || 'Error al cargar'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page" />
  if (error) return <div className="error-message">{error}</div>

  const sections = [
    { id: 'new-releases', title: 'Novedades', books: featured.newReleases },
    { id: 'bestsellers', title: 'Más Vendidos', books: featured.bestsellers },
    { id: 'recommended', title: 'Recomendados', books: featured.recommended },
  ]

  return (
    <div className="home-page">
      <section className="banner">
        <div className="banner-content">
          <h1>📚 20% OFF en todos los libros + Envío GRATIS</h1>
          <p>Descubre los mejores títulos con descuentos exclusivos por tiempo limitado</p>
          <div className="banner-buttons">
            <Link to="/catalogo" className="btn btn-primary">Ver Catálogo</Link>
          </div>
        </div>
      </section>

      {sections.map(section => (
        <section key={section.id} style={{ marginBottom: 48, marginTop: 48 }}>
          <h2 className="section-title">{section.title}</h2>
          <div className="book-grid">
            {section.books.map(book => {
              const author = book.author || (book.authors ? book.authors.map(a => a.name).join(', ') : 'Autor desconocido')
              const cover = book.cover || book.cover_url || book.covers?.[0] || '/placeholder.jpg'

              return (
                <div key={book.key} className="book-card">
                  <Link to={`/libro/${book.key}`}>
                    <div className="book-card-image">
                      <img src={cover} alt={book.title} />
                    </div>
                  </Link>
                  <div className="book-card-body">
                    <Link to={`/libro/${book.key}`}>
                      <h3 className="book-card-title">{book.title}</h3>
                    </Link>
                    <p className="book-card-author">{author}</p>
                    <div className="book-card-footer">
                      <div className="book-card-price">
                        {book.price && <span className="book-card-price-original">{formatPrice(book.price)}</span>}
                        <span className="book-card-price-final">{formatPrice(book.price_final || book.price)}</span>
                      </div>
                      <button className="book-card-add" onClick={() => addItem(book)}>Agregar</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
