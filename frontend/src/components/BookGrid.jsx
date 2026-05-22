import BookCard from './BookCard'

export default function BookGrid({ title, books, onAddToCart }) {
  return (
    <section className="book-grid">
      {title && <h2 className="book-grid__title">{title}</h2>}
      <div className="book-grid__grid">
        {books?.map((book) => (
          <BookCard key={book.key} book={book} onAddToCart={onAddToCart} />
        ))}
      </div>
    </section>
  )
}
