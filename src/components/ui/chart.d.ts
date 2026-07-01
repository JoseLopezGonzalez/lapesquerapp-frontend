import * as React from 'react';

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<string, string>;
  }
>;

export declare function ChartContainer(props: {
  id?: string;
  className?: string;
  children: React.ReactElement;
  config: ChartConfig;
  [key: string]: unknown;
}): React.JSX.Element;

export declare const ChartTooltip: React.ComponentType<Record<string, unknown>>;

export interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<Record<string, unknown>>;
  className?: string;
  indicator?: 'line' | 'dot' | 'dashed';
  hideLabel?: boolean;
  hideIndicator?: boolean;
  label?: React.ReactNode;
  labelFormatter?: (value: unknown, payload?: unknown) => React.ReactNode;
  labelClassName?: string;
  formatter?: (
    value: unknown,
    name: string,
    item: Record<string, unknown>,
    index: number,
    payload: unknown
  ) => React.ReactNode;
  color?: string;
  nameKey?: string;
  labelKey?: string;
}

export declare function ChartTooltipContent(
  props: ChartTooltipContentProps
): React.JSX.Element | null;

export declare const ChartLegend: React.ComponentType<Record<string, unknown>>;

export declare function ChartLegendContent(props: {
  className?: string;
  hideIcon?: boolean;
  payload?: Array<Record<string, unknown>>;
  verticalAlign?: 'top' | 'bottom';
  nameKey?: string;
}): React.JSX.Element | null;

export declare function ChartStyle(props: {
  id: string;
  config: ChartConfig;
}): React.JSX.Element | null;
