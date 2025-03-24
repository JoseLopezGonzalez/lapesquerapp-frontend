import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThermometerSnowflake } from "lucide-react";
import { TbTruckLoading } from "react-icons/tb";


const SkeletonStoreCard = () => {





  return (
    <Card className='border-0 border-l-4  min-w-56  text-sm font-medium leading-5 py-2'>
      <div className='flex p-4 h-full w-full'>
        <span className="flex flex-1 text-start w-full">
          <span className="flex flex-col w-full">
            <Skeleton className="block text-md font-medium text-white h-4 w-44">
            </Skeleton>
            <Skeleton className="mt-1 flex items-center font-light  text-xs h-3 w-24 ">
            </Skeleton>
            <Skeleton className="mt-2 text-xs font-light  inline-flex h-3 w-32">
            </Skeleton>
            <span className="mt-2 flex items-center text-sm text-neutral-500 pr-2">
              <div className="w-full bg-neutral-900 rounded-full h-2.5 ">
              </div>
            </span>
            <Skeleton className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-200 inline-flex h-4 w-32">
            </Skeleton>
          </span>
        </span>
      </div>
    </Card>
  )
}

export default SkeletonStoreCard