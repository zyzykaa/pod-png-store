export function getBundleDiscountRate(itemCount: number): number {
  if (itemCount >= 3) return 0.20
  if (itemCount >= 2) return 0.10
  return 0
}
