import Loader from '@/components/Utilities/Loader';

export default function OrquestadorLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Loader />
    </div>
  );
}
