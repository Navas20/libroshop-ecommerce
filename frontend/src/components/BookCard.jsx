import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext'

export default function BookCard({ book }) {
  const { addItem } = useCart()

  const coverUrl = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : 'https://via.placeholder.com/200x300?text=Sin+Portada'

  const hasDiscount = book.priceOriginal && book.priceOriginal > book.price

  return (
    <div className="book-card">
      <Link to={`/libro/${book.key}`} className="book-card-image">
        <img src={coverUrl} alt={book.title} loading="lazy" />
        {hasDiscount && (
          <span className="book-card-badge">
            -{Math.round((1 - book.price / book.priceOriginal) * 100)}%
          </span>
        )}
      </Link>
      <div className="book-card-body">
        <Link to={`/libro/${book.key}`}>
          <h3 className="book-card-title">{book.title}</h3>
        </Link>
        <p className="book-card-author">{book.author_name?.[0] || 'Autor desconocido'}</p>
        <div className="book-card-footer">
          <div className="book-card-price">
            {hasDiscount && (
              <span className="book-card-price-original">
                ${(book.priceOriginal || 0).toFixed(2)}
              </span>
            )}
            <span className="book-card-price-final">
              ${(book.price || 0).toFixed(2)}
            </span>
          </div>
          <button className="book-card-add" onClick={() => addItem(book)}>
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
