import { LogoutAwareLoader } from "@/components/Utilities/LogoutAwareLoader";

export default function Loading() {
  return (
    <LogoutAwareLoader>
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    </LogoutAwareLoader>
  );
}

