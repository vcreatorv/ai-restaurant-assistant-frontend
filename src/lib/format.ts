// formatPrice форматирует копейки → "450 ₽"
export function formatPrice(minor: number, currency = "RUB"): string {
  const major = minor / 100;
  const sign = currency === "RUB" ? "₽" : currency;
  // Без копеек, если ровно
  const num = Number.isInteger(major)
    ? major.toLocaleString("ru-RU")
    : major.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${num} ${sign}`;
}
