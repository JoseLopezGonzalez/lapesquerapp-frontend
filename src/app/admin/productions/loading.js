import { LogoutAwareLoader } from '@/components/Utilities/LogoutAwareLoader';

export default function Loading() {
  return (
    <LogoutAwareLoader>
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <p className="text-muted-foreground text-sm">Cargando producciones...</p>
      </div>
    </LogoutAwareLoader>
  );
}
