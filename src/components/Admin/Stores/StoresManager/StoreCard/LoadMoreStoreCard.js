import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const LoadMoreStoreCard = ({ onClick, loading }) => {
  const handleClick = () => {
    if (!loading) {
      onClick();
    }
  };

  return (
    <Card
      className={`flex min-h-0 min-w-56 shrink-0 flex-col border-0 border-l-4 border-neutral-200 p-3 text-sm leading-5 font-medium ${
        loading
          ? 'bg-foreground-100 cursor-not-allowed'
          : 'bg-foreground-100 hover:bg-foreground-200 cursor-pointer'
      }`}
    >
      <div onClick={handleClick} className="flex min-h-0 w-full flex-1 items-center justify-center">
        <span className="flex flex-col items-center justify-center gap-1">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ) : (
            <>
              <Plus className="text-muted-foreground h-6 w-6" />
              <span className="block text-center font-medium">Cargar más</span>
              <span className="text-muted-foreground text-center text-xs font-light">
                Ver más almacenes
              </span>
            </>
          )}
        </span>
      </div>
    </Card>
  );
};

export default LoadMoreStoreCard;
