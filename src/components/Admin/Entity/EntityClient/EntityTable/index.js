import { Card } from '@/components/ui/card';
import React from 'react';

export const EntityTable = ({ children }) => {
  return <Card className="flex h-full min-h-0 w-full flex-col">{children}</Card>;
};
