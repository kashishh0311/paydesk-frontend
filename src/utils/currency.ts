
export function formatINR(
  val: number | string | null | undefined,
  options: { decimals?: boolean; compact?: boolean } = {}
): string {
  const { decimals = true, compact = false } = options;
  const num = typeof val === 'string' ? parseFloat(val) : Number(val || 0);

  if (isNaN(num)) {
    return decimals ? '₹0.00' : '₹0';
  }

  if (compact) {
    if (Math.abs(num) >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
    if (Math.abs(num) >= 1000) {
      return `₹${(num / 1000).toFixed(1)}k`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(num);
}
