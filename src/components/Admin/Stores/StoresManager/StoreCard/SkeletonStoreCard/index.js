import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ThermometerSnowflake } from 'lucide-react';
import { TbTruckLoading } from 'react-icons/tb';

const SkeletonStoreCard = () => {
  return (
    <Card className="min-w-56 border-0 border-l-4 py-2 text-sm leading-5 font-medium">
      <div className="flex h-full w-full p-4">
        <span className="flex w-full flex-1 text-start">
          <span className="flex w-full flex-col">
            <Skeleton className="text-md text-primary block h-4 w-44 font-medium"></Skeleton>
            <Skeleton className="mt-1 flex h-3 w-24 items-center text-xs font-light"></Skeleton>
            <Skeleton className="mt-2 inline-flex h-3 w-32 text-xs font-light"></Skeleton>
            <span className="text-foreground-50 mt-2 flex items-center pr-2 text-sm">
              <div className="bg-foreground-100 h-2.5 w-full rounded-full"></div>
            </span>
            <Skeleton className="text-foreground-800 mt-2 inline-flex h-4 w-32 text-sm font-medium"></Skeleton>
          </span>
        </span>
      </div>
    </Card>
  );
};

export default SkeletonStoreCard;
