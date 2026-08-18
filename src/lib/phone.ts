export function toE164India(input: string): string | null {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91") && /^91[6-9]/.test(digits)) {
    return `+${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0") && /^0[6-9]/.test(digits)) {
    return `+91${digits.slice(1)}`;
  }

  return null;
}

export function formatPhoneDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
}
