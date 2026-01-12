import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import Loader from "@/components/Utilities/Loader";

const LoadMoreStoreCard = ({ onClick, loading }) => {
  const handleClick = () => {
    if (!loading) {
      onClick();
    }
  };

  return (
    <Card
      className={`border-0 border-l-4 min-w-56 text-sm font-medium leading-5 border-neutral-200 ${
        loading 
          ? 'bg-foreground-100 cursor-not-allowed' 
          : 'bg-foreground-100 hover:bg-foreground-200 cursor-pointer'
      }`}
    >
      <div onClick={handleClick} className='flex p-4 h-full w-full items-center justify-center'>
        <span className="flex flex-col items-center justify-center w-full">
          {loading ? (
            <Loader />
          ) : (
            <>
              <Plus className="h-12 w-12 text-muted-foreground mb-2" />
              <span className="block text-md font-medium text-center">
                Cargar más
              </span>
              <span className="mt-1 text-xs font-light text-center text-muted-foreground">
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

