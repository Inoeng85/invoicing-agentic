export function formatIdr(cents: number): string {
  let rupiah = Math.round(cents / 100)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupiah)
}
