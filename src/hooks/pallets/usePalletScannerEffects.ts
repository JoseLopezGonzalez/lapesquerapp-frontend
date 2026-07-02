'use client';

import { useEffect, useRef } from 'react';
import { BoxCreationData, resetBoxCreationDataPreservingDiscounts } from './palletHelpers';

interface UsePalletScannerEffectsParams {
  scannedCode: string;
  deleteScannedCode: string;
  onAddNewBox: (params: { method: string }) => void;
  onDeleteScannedCode: () => void;
  setBoxCreationData: React.Dispatch<React.SetStateAction<BoxCreationData>>;
}

/**
 * Auto-submit effects for the GS1-128 scanner inputs of the pallet editor: when either
 * scanner field (add / delete) reaches the expected GS1-128 length (42 chars), it triggers
 * the corresponding action and resets the field.
 *
 * `onAddNewBox` / `onDeleteScannedCode` are recreated on every render of
 * `usePalletBoxCreation` (they are not memoized there, and memoizing them is out of scope for
 * this hook). They are read through refs so the effects only re-run when the scanned code
 * itself changes — never when the parent re-renders for unrelated reasons — which is exactly
 * the behavior the original `eslint-disable`d effects had.
 */
export function usePalletScannerEffects({
  scannedCode,
  deleteScannedCode,
  onAddNewBox,
  onDeleteScannedCode,
  setBoxCreationData,
}: UsePalletScannerEffectsParams): void {
  // Refs are updated in their own effect (never mutated during render, per react-hooks/refs).
  const onAddNewBoxRef = useRef(onAddNewBox);
  const onDeleteScannedCodeRef = useRef(onDeleteScannedCode);
  useEffect(() => {
    onAddNewBoxRef.current = onAddNewBox;
    onDeleteScannedCodeRef.current = onDeleteScannedCode;
  });

  // Auto-submit scanner when code reaches expected length
  useEffect(() => {
    if (scannedCode.length >= 42) {
      onAddNewBoxRef.current({ method: 'lector' });
      setBoxCreationData((prev) => resetBoxCreationDataPreservingDiscounts(prev));
    }
  }, [scannedCode, setBoxCreationData]);

  useEffect(() => {
    if (deleteScannedCode.length >= 42) {
      onDeleteScannedCodeRef.current();
      setBoxCreationData((prev) => ({ ...prev, deleteScannedCode: '' }));
    }
  }, [deleteScannedCode, setBoxCreationData]);
}
