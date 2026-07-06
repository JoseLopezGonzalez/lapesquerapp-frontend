import { formatDateShort } from '@/helpers/formats/dates/formatDates';

export interface RawOrderOption {
  id?: string | number | null;
  name?: string | null;
  load_date?: string | null;
  value?: string | number | null;
  label?: string | null;
}

export interface NormalizedOrderOption {
  value: string;
  label: string;
}

export function toOrderOption(option: RawOrderOption): NormalizedOrderOption | null {
  const value = option.value ?? option.id;
  if (value === undefined || value === null) return null;

  if (option.label) {
    return { value: String(value), label: option.label };
  }

  const name = option.name ?? value;
  const formattedDate = option.load_date ? ` — ${formatDateShort(option.load_date)}` : '';

  return {
    value: String(value),
    label: `#${name}${formattedDate}`,
  };
}

export function normalizeOrderOptions(options: RawOrderOption[] = []): NormalizedOrderOption[] {
  const seen = new Set<string>();

  return options.reduce<NormalizedOrderOption[]>((acc, option) => {
    const normalized = toOrderOption(option);
    if (!normalized || seen.has(normalized.value)) return acc;

    seen.add(normalized.value);
    acc.push(normalized);
    return acc;
  }, []);
}
