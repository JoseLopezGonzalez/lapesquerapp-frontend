import type { PalletTimelineEntry } from '@/services/palletService';

export declare function PalletTimeline(props: {
  timeline?: PalletTimelineEntry[];
  loading?: boolean;
  error?: Error | null;
  openStates?: boolean[];
  onItemOpenChange?: (index: number, open: boolean) => void;
}): JSX.Element;
