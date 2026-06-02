'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink, Package } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { usePallet, type PalletState } from '@/hooks/usePallet';
import PalletView from './PalletView';
import { useSession } from 'next-auth/react';
import { isExternalActor } from '@/lib/auth/actor';

interface PalletDialogProps {
  palletId?: string | number | null;
  isOpen: boolean;
  onChange: (...args: unknown[]) => unknown;
  initialStoreId?: string | number | null;
  initialOrderId?: string | number | null;
  onCloseDialog: () => void;
  onSaveTemporal?: ((pallet: PalletState) => void) | null;
  initialPallet?: PalletState | null;
  readOnly?: boolean;
}

export default function PalletDialog({
  palletId,
  isOpen,
  onChange,
  initialStoreId = null,
  initialOrderId = null,
  onCloseDialog,
  onSaveTemporal = null,
  initialPallet = null,
  readOnly = false,
}: PalletDialogProps) {
  const { data: session } = useSession();
  const externalActor = isExternalActor(session?.user);
  const { temporalPallet } = usePallet({
    id:
      palletId && !palletId?.toString().startsWith('temp-')
        ? palletId
        : palletId === 'new'
          ? 'new'
          : null,
    onChange: () => {},
    initialStoreId,
    initialOrderId,
    skipBackendSave: true,
    initialPallet,
  });

  const receptionId = temporalPallet?.receptionId;
  const belongsToReception = receptionId !== null && receptionId !== undefined;

  const handleOnClickClose = () => {
    onCloseDialog();
  };

  const handleSaveTemporal = (temporalPalletData: PalletState) => {
    if (onSaveTemporal && temporalPalletData) {
      onSaveTemporal(temporalPalletData);
      if (onCloseDialog) {
        onCloseDialog();
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOnClickClose}>
        <DialogContent
          size="full"
          className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-none"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <span>
                {palletId && palletId !== 'new' && !palletId?.toString().startsWith('temp-')
                  ? belongsToReception || readOnly
                    ? `Ver Palet #${palletId}`
                    : `Editar Palet #${palletId}`
                  : 'Nuevo Palet'}
              </span>
              {belongsToReception && receptionId && !externalActor && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/admin/raw-material-receptions/${receptionId}/edit`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Badge
                          variant="outline"
                          className="flex cursor-pointer items-center gap-1.5 border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
                        >
                          <Package className="h-3 w-3" />
                          <span>Recepción #{receptionId}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Badge>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver recepción #{receptionId}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 w-full flex-1 overflow-hidden pb-4">
            <PalletView
              palletId={
                palletId && !palletId?.toString().startsWith('temp-')
                  ? palletId
                  : palletId === 'new'
                    ? 'new'
                    : null
              }
              onChange={onChange}
              initialStoreId={initialStoreId}
              initialOrderId={initialOrderId}
              wrappedInDialog={true}
              onSaveTemporal={onSaveTemporal ? handleSaveTemporal : null}
              initialPallet={initialPallet}
              readOnly={readOnly}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
