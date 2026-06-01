import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import Loader from '@/components/Utilities/Loader';

const LoadMoreStoreCard = ({ onClick, loading }) => {
  const handleClick = () => {
    if (!loading) {
      onClick();
    }
  };

  return (
    <Card
      className={`min-w-56 shrink-0 border-0 border-l-4 border-neutral-200 text-sm leading-5 font-medium ${
        loading
          ? 'bg-foreground-100 cursor-not-allowed'
          : 'bg-foreground-100 hover:bg-foreground-200 cursor-pointer'
      }`}
    >
      <div
        onClick={handleClick}
        className="flex h-full min-h-0 w-full items-center justify-center p-3"
      >
        <span className="flex w-full flex-col items-center justify-center">
          {loading ? (
            <Loader />
          ) : (
            <>
              <Plus className="text-muted-foreground mb-2 h-12 w-12" />
              <span className="text-md block text-center font-medium">Cargar más</span>
              <span className="text-muted-foreground mt-1 text-center text-xs font-light">
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
