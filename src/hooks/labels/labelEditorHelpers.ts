import type { LabelElement } from '@/types/labelEditor';

/**
 * Normalizes a label element to ensure all format properties have explicit,
 * canonical values (never undefined, never mixed types).
 */
export const normalizeElement = (
  element: LabelElement | null | undefined
): LabelElement | null | undefined => {
  if (!element) return element;

  let fontWeight = element.fontWeight;
  if (fontWeight === 900 || fontWeight === '900' || fontWeight === 'black') {
    fontWeight = 'black';
  } else if (fontWeight === 700 || fontWeight === '700') {
    fontWeight = 'bold';
  } else if (!fontWeight || fontWeight === 'normal') {
    fontWeight = 'normal';
  }

  let fontStyle = element.fontStyle || 'normal';
  if (fontStyle === 'oblique') fontStyle = 'italic';

  const textDecoration = element.textDecoration || 'none';
  const textTransform = element.textTransform || 'none';

  let horizontalAlign = element.horizontalAlign;
  if (!horizontalAlign && element.textAlign) {
    horizontalAlign = element.textAlign;
  }
  if (
    !horizontalAlign ||
    !['left', 'center', 'right', 'justify'].includes(String(horizontalAlign))
  ) {
    horizontalAlign = 'left';
  } else {
    horizontalAlign = String(horizontalAlign) as 'left' | 'center' | 'right' | 'justify';
  }

  let verticalAlign = element.verticalAlign || 'start';
  if (!['start', 'end', 'center'].includes(String(verticalAlign))) {
    verticalAlign = 'start';
  } else {
    verticalAlign = String(verticalAlign) as 'start' | 'end' | 'center';
  }

  let direction = element.direction;
  if (element.type === 'line') {
    direction = direction || 'horizontal';
    if (!['horizontal', 'vertical'].includes(String(direction))) {
      direction = 'horizontal';
    } else {
      direction = String(direction) as 'horizontal' | 'vertical';
    }
  }

  let strokeWidth = element.strokeWidth;
  if (element.type === 'line') {
    strokeWidth = typeof strokeWidth === 'number' && strokeWidth > 0 ? strokeWidth : 0.1;
  }

  const normalized: LabelElement = {
    ...element,
    fontWeight,
    fontStyle,
    textDecoration,
    textTransform,
    horizontalAlign,
    verticalAlign,
    textAlign: horizontalAlign,
  };

  if (element.type === 'line') {
    const lineProps = normalized as LabelElement & { direction?: string; strokeWidth?: number };
    lineProps.direction = direction as string;
    lineProps.strokeWidth = strokeWidth as number;
  }

  return normalized;
};

/**
 * Maps a canonical fontWeight value ('normal' | 'bold' | 'black') to a value
 * valid for the CSS `font-weight` property. 'black' has no CSS keyword —
 * it must be sent as the numeric weight 900.
 */
export const cssFontWeight = (fontWeight: unknown): string | number => {
  if (fontWeight === 'black' || fontWeight === 900 || fontWeight === '900') return 900;
  if (fontWeight === 'bold' || fontWeight === 700 || fontWeight === '700') return 'bold';
  return (fontWeight as string) || 'normal';
};

export const normalizeElements = (elements: unknown): LabelElement[] => {
  if (!Array.isArray(elements)) return [];
  return elements.map(normalizeElement).filter((el): el is LabelElement => el != null);
};
