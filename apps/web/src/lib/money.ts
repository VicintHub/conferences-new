/** Kobo → "₦12,500" (whole naira) or "₦362.50" when there is a fractional part. */
export function naira(kobo: number): string {
  const whole = kobo % 100 === 0;
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}
