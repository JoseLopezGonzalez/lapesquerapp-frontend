import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  button?: { name: string; onClick: () => void };
  className?: string;
}

export function EmptyState(props: EmptyStateProps): JSX.Element;
