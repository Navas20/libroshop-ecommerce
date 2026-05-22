export function formatPrice(price) {
  if (price == null) return '$0'
  return '$' + Number(price).toLocaleString('es-CO')
}

export function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
}

export function calculateDiscount(subtotal) {
  return subtotal * 0.1
}

export function calculateTotal(subtotal) {
  return subtotal - calculateDiscount(subtotal)
}
