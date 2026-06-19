'use client';

import { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink, Package, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { usePallet, type PalletState } from '@/hooks/usePallet';
import PalletView from './PalletView';
import MobilePalletView, { type PalletScreen } from './MobilePalletView';
import {
  MobilePalletScreenHeader,
  mobilePalletHeaderButtonClassName,
  mobilePalletHeaderTitleClassName,
} from './MobilePalletView/MobilePalletScreenHeader';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { isExternalActor } from '@/lib/auth/actor';
import { useIsMobileSafe } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  initialTab?: string | null;
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
  initialTab = null,
}: PalletDialogProps) {
  const { data: session } = useSession();
  const externalActor = isExternalActor(session?.user);
  const { isMobile, mounted } = useIsMobileSafe();
  const [mobileActiveScreen, setMobileActiveScreen] = useState<PalletScreen>('hub');

  useEffect(() => {
    if (!isOpen) {
      setMobileActiveScreen('hub');
    }
  }, [isOpen]);

  const effectivePalletId =
    palletId && !palletId?.toString().startsWith('temp-')
      ? palletId
      : palletId === 'new'
        ? 'new'
        : null;

  const { temporalPallet } = usePallet({
    id: effectivePalletId,
    onChange: () => {},
    initialStoreId,
    initialOrderId,
    skipBackendSave: true,
    initialPallet,
  });

  const receptionId = temporalPallet?.receptionId as string | number | null | undefined;
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

  const dialogTitle =
    palletId && palletId !== 'new' && !palletId?.toString().startsWith('temp-')
      ? belongsToReception || readOnly
        ? `Ver Palet #${palletId}`
        : `Editar Palet #${palletId}`
      : 'Nuevo Palet';

  const hideMobileDialogChrome = mounted && isMobile && mobileActiveScreen !== 'hub';
  const useMobileHeader = mounted && isMobile;
  const handleMobileActiveScreenChange = useCallback((screen: PalletScreen) => {
    setMobileActiveScreen(screen);
  }, []);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOnClickClose}>
        <DialogContent
          size="full"
          showCloseButton={!useMobileHeader}
          className={cn(
            'flex h-[90vh] max-h-[90vh] flex-col overflow-hidden max-sm:top-0 max-sm:left-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-hidden max-sm:rounded-none max-sm:gap-0 max-sm:p-0 max-sm:transition-none',
            mounted && isMobile && 'max-sm:data-open:animate-none'
          )}
          aria-describedby={undefined}
        >
          {hideMobileDialogChrome ? (
            <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
          ) : useMobileHeader ? (
            <>
              <DialogTitle className="sr-only">{dialogTitle}</DialogTitle>
              <MobilePalletScreenHeader
                title={
                  belongsToReception && receptionId && !externalActor ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <h2 className={mobilePalletHeaderTitleClassName}>{dialogTitle}</h2>
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
                    </div>
                  ) : (
                    dialogTitle
                  )
                }
                rightSlot={
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleOnClickClose}
                    className={mobilePalletHeaderButtonClassName}
                    aria-label="Cerrar"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                }
              />
            </>
          ) : (
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <span>{dialogTitle}</span>
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
          )}
          <div className="flex min-h-0 w-full flex-1 overflow-hidden pb-4 max-sm:pb-0">
            {mounted && isMobile ? (
              <MobilePalletView
                palletId={effectivePalletId}
                onChange={onChange}
                initialStoreId={initialStoreId as null | undefined}
                initialOrderId={initialOrderId as null | undefined}
                onSaveTemporal={(onSaveTemporal ? handleSaveTemporal : null) as null | undefined}
                initialPallet={initialPallet as null | undefined}
                readOnly={readOnly}
                initialTab={initialTab}
                onActiveScreenChange={handleMobileActiveScreenChange}
              />
            ) : (
              <PalletView
                palletId={effectivePalletId}
                onChange={onChange}
                initialStoreId={initialStoreId as null | undefined}
                initialOrderId={initialOrderId as null | undefined}
                wrappedInDialog={true}
                onSaveTemporal={(onSaveTemporal ? handleSaveTemporal : null) as null | undefined}
                initialPallet={initialPallet as null | undefined}
                readOnly={readOnly}
                initialTab={initialTab}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
