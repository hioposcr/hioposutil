export function getDigitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function extractTerminalFromConsecutive(consecutive: string): string {
  const digits = getDigitsOnly(consecutive);

  if (digits.length !== 20) {
    return '';
  }

  return digits.slice(3, 8);
}

export function suggestNextTerminal(consecutive: string): string {
  const currentTerminal = extractTerminalFromConsecutive(consecutive);

  if (!currentTerminal) {
    return '00002';
  }

  const currentNumber = Number(currentTerminal);
  return String((currentNumber % 99999) + 1).padStart(5, '0');
}

export function replaceTerminalInConsecutive(consecutive: string, terminal: string): string {
  const digits = getDigitsOnly(consecutive);
  const normalizedTerminal = getDigitsOnly(terminal);

  if (digits.length !== 20) {
    throw new Error('El consecutivo actual no tiene el formato esperado de 20 dígitos.');
  }

  if (!/^\d{5}$/.test(normalizedTerminal)) {
    throw new Error('La terminal debe tener exactamente 5 dígitos.');
  }

  return `${digits.slice(0, 3)}${normalizedTerminal}${digits.slice(8)}`;
}
