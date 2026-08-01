/** E.164-ish sanity check: "+" followed by 8-15 digits. Firebase validates for real. */
export function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}
