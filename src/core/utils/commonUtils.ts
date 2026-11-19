/** "Ada Lovelace" → "AL"; used for avatars. */
export const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

export const formatNumber = (value: number, locale?: string): string => new Intl.NumberFormat(locale).format(value);

export const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
