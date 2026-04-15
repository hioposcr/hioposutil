const EPSILON = 0.00001;

export function sanitizeNumericString(value: string): string {
  return value.replace(/[₡,\s]/g, '').trim();
}

export function parseAmount(value: unknown, defaultValue = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? roundTo(value) : defaultValue;
  }

  if (typeof value === 'string') {
    const normalized = sanitizeNumericString(value);

    if (!normalized) {
      return defaultValue;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? roundTo(parsed) : defaultValue;
  }

  return defaultValue;
}

export function roundTo(value: number, digits = 5): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function clampToZero(value: number): number {
  return Math.abs(value) < EPSILON ? 0 : roundTo(Math.max(0, value));
}

export function formatCurrency(value: number, currency = 'CRC'): string {
  const formatter = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(value);
}

export function formatPercentage(value: number): string {
  return `${roundTo(value, 6).toFixed(6)}%`;
}

export function formatDecimal(value: number, digits = 5): string {
  return roundTo(value, digits).toFixed(digits);
}

export function isGreaterThan(a: number, b: number): boolean {
  return a - b > EPSILON;
}
