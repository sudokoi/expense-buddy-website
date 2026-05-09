export const CATEGORY_COLORS: Record<string, `#${string}`> = {
  Food: '#FFB07C',
  Groceries: '#7FDBCA',
  Transport: '#87CEEB',
  Rent: '#A8C686',
  Utilities: '#FFE4A0',
  Entertainment: '#DDA0DD',
  Health: '#FFB5BA',
  Other: '#C4B7C9',
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other
}
