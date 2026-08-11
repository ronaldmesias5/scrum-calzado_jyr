export function formatCOP(value: number): string {
  return `$${value.toLocaleString('es-CO')}`
}

export function formatReportCOP(value: number, decimals: number): string {
  const factor = 10 ** decimals
  const truncated = Math.trunc(value * factor) / factor
  return `$${truncated.toLocaleString('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })}`
}

export function parseCOP(value: string): number {
  return parseInt(value.replace(/\./g, ''), 10) || 0
}

export function formatNumberInput(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('es-CO')
}
