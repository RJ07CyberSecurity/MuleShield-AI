export function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (e) {
    // Fallback if currency code is invalid
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
}

export const CURRENCY_SYMBOL = (() => {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).formatToParts(0);
    return parts.find(p => p.type === 'currency')?.value || '$';
  } catch {
    return '$';
  }
})();
