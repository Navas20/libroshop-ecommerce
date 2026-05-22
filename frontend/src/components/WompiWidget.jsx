import { useEffect, useRef } from 'react'

const WOMPI_SCRIPT = 'https://checkout.wompi.co/widget.js'
const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY || ''

export default function WompiWidget({ amount, reference, integrityHash, onComplete }) {
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!amount || !reference || !integrityHash || loadedRef.current) return

    const scriptSrc = WOMPI_SCRIPT
    const existing = document.querySelector(`script[src="${scriptSrc}"]`)

    const initWidget = () => {
      if (!window.WidgetCheckout) return
      loadedRef.current = true
      try {
        const widget = new window.WidgetCheckout({
          currency: 'COP',
          amountInCents: amount,
          reference,
          publicKey: WOMPI_PUBLIC_KEY,
          signature: integrityHash
        })
        widget.open(() => {
          if (onComplete) onComplete()
        })
      } catch (err) {
        console.error('WompiWidget error:', err)
        if (onComplete) onComplete()
      }
    }

    if (existing && window.WidgetCheckout) {
      initWidget()
    } else if (!existing) {
      const script = document.createElement('script')
      script.src = scriptSrc
      script.async = true
      script.onload = initWidget
      script.onerror = () => {
        console.error('Failed to load Wompi script')
        if (onComplete) onComplete()
      }
      document.head.appendChild(script)
    } else {
      const checkInterval = setInterval(() => {
        if (window.WidgetCheckout) {
          clearInterval(checkInterval)
          initWidget()
        }
      }, 200)
      setTimeout(() => clearInterval(checkInterval), 15000)
    }

    return () => {
      loadedRef.current = true
    }
  }, [amount, reference, integrityHash])

  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'var(--color-text-light)', marginBottom: 12, fontSize: '0.9rem' }}>
        Se abrirá la ventana de pago segura de Wompi...
      </p>
      <div className="loading-spinner" />
    </div>
  )
}
