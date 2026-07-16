'use client';

import { useRouter } from 'next/navigation';
import PalletView from '@/components/Admin/Pallets/PalletDialog/PalletView';
import type { PalletState } from '@/hooks/usePallet';

const PalletCreateClient = () => {
  const router = useRouter();

  const handleOnChange = (pallet: PalletState) => {
    if (pallet?.id) {
      router.push(`/admin/pallets/${pallet.id}`);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-xl">
      <PalletView
        palletId={null} // Modo creación
        wrappedInDialog={false} // No está en un diálogo
        onChange={handleOnChange as (...args: unknown[]) => unknown}
      />
    </div>
  );
};

export default PalletCreateClient;
