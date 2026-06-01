'use client';

import { useState } from 'react';
import { usePrintElement } from '@/hooks/usePrintElement';
import type { LabelElement } from '@/types/labelEditor';

interface UseLabelPrintParams {
  elements: LabelElement[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface UseLabelPrintResult {
  showManualDialog: boolean;
  setShowManualDialog: React.Dispatch<React.SetStateAction<boolean>>;
  manualForm: Record<string, string>;
  setManualForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handlePrint: () => void;
  handleConfirmManual: () => void;
}

export function useLabelPrint({
  elements,
  canvasWidth,
  canvasHeight,
}: UseLabelPrintParams): UseLabelPrintResult {
  const [manualValues, setManualValues] = useState<Record<string, string>>({});
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualForm, setManualForm] = useState<Record<string, string>>({});

  const { onPrint } = usePrintElement({
    id: 'print-area',
    width: canvasWidth / 4,
    height: canvasHeight / 4,
  });

  const handlePrint = () => {
    const manualFields = elements.filter((el) => el.type === 'manualField');
    if (manualFields.length > 0) {
      const formValues: Record<string, string> = {};
      manualFields.forEach((el) => {
        const k = String(el.key ?? '');
        formValues[k] = manualValues[k] || String(el.sample ?? '') || '';
      });
      setManualForm(formValues);
      setShowManualDialog(true);
    } else {
      onPrint();
    }
  };

  const handleConfirmManual = () => {
    setManualValues(manualForm);
    setShowManualDialog(false);
    setTimeout(() => {
      onPrint();
      setManualValues({});
    }, 0);
  };

  return {
    showManualDialog,
    setShowManualDialog,
    manualForm,
    setManualForm,
    handlePrint,
    handleConfirmManual,
  };
}
