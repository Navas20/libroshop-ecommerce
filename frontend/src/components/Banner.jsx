import { Link } from 'react-router-dom'

export default function Banner({ title, subtitle, ctaText, ctaLink }) {
  return (
    <section className="hero-banner">
      <div className="hero-banner__content">
        {title && <h1 className="hero-banner__title">{title}</h1>}
        {subtitle && <p className="hero-banner__subtitle">{subtitle}</p>}
        {ctaText && ctaLink && (
          <Link to={ctaLink} className="hero-banner__cta">{ctaText}</Link>
        )}
      </div>
    </section>
  )
}
