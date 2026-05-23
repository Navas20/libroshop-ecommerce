import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import bookService from '../services/bookService'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/formatPrice'

export default function DetalleLibro() {
  const { key } = useParams()
  const [book, setBook] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { addItem } = useCart()

  useEffect(() => {
    if (!key) return
    setLoading(true)
    setError(null)
    bookService.getByKey(key)
      .then(data => {
        setBook(data.book || data)
      })
      .catch(err => setError(err?.message || 'Error al cargar el libro'))
      .finally(() => setLoading(false))
  }, [key])

  useEffect(() => {
    if (!book) return
    const subject = book.subject || book.subjects?.[0]
    if (subject) {
      bookService.search(subject, 1, 5)
        .then(data => {
          const items = data.docs || data.books || data.results || []
          setRelated(items.filter(item => item.key !== key).slice(0, 4))
        })
        .catch(() => setRelated([]))
    }
  }, [book, key])

  if (loading) return <div className="loading-page" />
  if (error) return <div className="error-message">{error}</div>
  if (!book) return <div className="error-message">Libro no encontrado</div>

  const author = book.author || (book.authors ? book.authors.map(a => a.name).join(', ') : 'Autor desconocido')
  const subjects = book.subjects || (book.subject ? [book.subject] : [])
  const cover = book.cover || book.cover_url || book.covers?.[0] || '/placeholder.svg'

  return (
    <div>
      <div className="book-detail">
        <div className="book-detail-image">
          <img src={cover} alt={book.title} />
        </div>

        <div className="book-detail-info">
          <h1>{book.title}</h1>
          <p className="book-detail-author">{author}</p>

          <div className="book-detail-meta">
            {book.publish_year && (
              <div className="book-detail-meta-item">
                <strong>Año</strong>
                {book.publish_year}
              </div>
            )}
            {subjects.length > 0 && (
              <div className="book-detail-meta-item">
                <strong>Materias</strong>
                {subjects.slice(0, 5).join(', ')}
              </div>
            )}
            {book.publisher && (
              <div className="book-detail-meta-item">
                <strong>Editorial</strong>
                {book.publisher}
              </div>
            )}
          </div>

          {book.description && (
            <p className="book-detail-description">
              {typeof book.description === 'string' ? book.description : book.description?.value || ''}
            </p>
          )}

          <div className="book-detail-price-area">
            {book.price && <span className="book-detail-price-original">{formatPrice(book.price)}</span>}
            <span className="book-detail-price-final">{formatPrice(book.price_final || book.price)}</span>
          </div>

          <div className="book-detail-actions">
            <button className="btn btn-primary" onClick={() => addItem(book)}>
              Agregar al carrito
            </button>
            <Link to="/carrito" className="btn btn-outline" onClick={() => addItem(book)}>
              Comprar ahora
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 className="section-title">También te puede interesar</h2>
          <div className="book-grid">
            {related.map(rel => {
              const relAuthor = rel.author || (rel.authors ? rel.authors.map(a => a.name).join(', ') : 'Autor desconocido')
              const relCover = rel.cover || rel.cover_url || rel.covers?.[0] || '/placeholder.svg'
              const relCleanKey = rel.key.replace(/^\//, '')

              return (
                <div key={rel.key} className="book-card">
                  <Link to={`/libro/${relCleanKey}`}>
                    <div className="book-card-image">
                      <img src={relCover} alt={rel.title} />
                    </div>
                  </Link>
                  <div className="book-card-body">
                    <Link to={`/libro/${relCleanKey}`}>
                      <h3 className="book-card-title">{rel.title}</h3>
                    </Link>
                    <p className="book-card-author">{relAuthor}</p>
                    <div className="book-card-footer">
                      <div className="book-card-price">
                        <span className="book-card-price-final">{formatPrice(rel.price_final || rel.price)}</span>
                      </div>
                      <button className="book-card-add" onClick={() => addItem(rel)}>Agregar</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
