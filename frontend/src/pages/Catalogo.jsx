import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import bookService from '../services/bookService'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/formatPrice'

const CATEGORIES = [
  { value: '', label: 'Todas las categorías' },
  { value: 'fiction', label: 'Ficción' },
  { value: 'non-fiction', label: 'No Ficción' },
  { value: 'science', label: 'Ciencia' },
  { value: 'history', label: 'Historia' },
  { value: 'technology', label: 'Tecnología' },
  { value: 'art', label: 'Arte' },
  { value: 'philosophy', label: 'Filosofía' },
  { value: 'fantasy', label: 'Fantasía' },
  { value: 'romance', label: 'Romance' },
]

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
]

const LIMIT = 20

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('relevance')
  const [page, setPage] = useState(1)
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { addItem } = useCart()

  const buildQuery = useCallback(() => {
    let q = query
    if (category) q += q ? ` subject:${category}` : `subject:${category}`
    return q || '*'
  }, [query, category])

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = buildQuery()
      const data = await bookService.search(q, page, LIMIT)
      setResults(data.docs || data.books || data.results || [])
      setTotal(data.numFound ?? data.total ?? 0)
    } catch (err) {
      setError(err?.message || 'Error al buscar')
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [buildQuery, page])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
    setInputValue(q)
    setPage(1)
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(inputValue)
    setPage(1)
    if (inputValue) {
      setSearchParams({ q: inputValue })
    } else {
      setSearchParams({})
    }
  }

  const handleCategoryChange = (e) => {
    setCategory(e.target.value)
    setPage(1)
  }

  const handleSortChange = (e) => {
    setSort(e.target.value)
    setPage(1)
  }

  const sortedResults = [...results].sort((a, b) => {
    if (sort === 'price_asc') return (a.price_final || a.price || 0) - (b.price_final || b.price || 0)
    if (sort === 'price_desc') return (b.price_final || b.price || 0) - (a.price_final || a.price || 0)
    return 0
  })

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="catalogo-page">
      <div className="catalogo-header">
        <h1>Catálogo</h1>
        <p>Explora nuestra colección de libros</p>
      </div>

      <form className="catalogo-filters" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Buscar libros..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <select value={category} onChange={handleCategoryChange}>
          {CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <select value={sort} onChange={handleSortChange}>
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </form>

      {loading && <div className="loading-page" />}

      {error && <div className="error-message">{error}</div>}

      {!loading && !error && results.length === 0 && (
        <div className="error-message">
          <p>No se encontraron resultados{query ? ` para "${query}"` : ''}</p>
          <Link to="/catalogo" className="btn btn-outline" style={{ marginTop: 16, display: 'inline-flex' }}>Limpiar filtros</Link>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <p className="search-info">
            <strong>{total}</strong> resultado{total !== 1 ? 's' : ''}
            {query ? ` para "${query}"` : ''}
            {category ? ` en ${CATEGORIES.find(c => c.value === category)?.label || category}` : ''}
          </p>

          <div className="book-grid">
            {sortedResults.map(book => {
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

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 32 }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
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
