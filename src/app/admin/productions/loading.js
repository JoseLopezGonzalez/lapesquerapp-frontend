import { LogoutAwareLoader } from "@/components/Utilities/LogoutAwareLoader";

export default function Loading() {
  return (
    <LogoutAwareLoader>
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="text-sm text-muted-foreground">Cargando producciones...</p>
      </div>
    </LogoutAwareLoader>
  );
}

