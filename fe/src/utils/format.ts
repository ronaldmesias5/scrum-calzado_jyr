export function formatCOP(value: number): string {
  return `$${value.toLocaleString('es-CO')}`
}

export function parseCOP(value: string): number {
  return parseInt(value.replace(/\./g, ''), 10) || 0
}

export function formatNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('es-CO')
}
