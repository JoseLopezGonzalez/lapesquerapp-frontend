'use client';

import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createLabel, deleteLabel, updateLabel } from '@/services/labelService';
import { getLabelsQueryKey } from '@/hooks/useLabels';
import { notify } from '@/lib/notifications';
import {
  validateLabelName,
  hasDuplicateFieldKeys,
  hasAnyElementValidationErrors,
} from './labelValidation';
import { normalizeElements } from './labelEditorHelpers';
import type { Label, LabelDraft, LabelElement, LabelFormat } from '@/types/labelEditor';
import type { Dispatch, RefObject, SetStateAction } from 'react';

interface UseLabelPersistenceParams {
  elements: LabelElement[];
  labelName: string;
  labelId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  canvasRotation: number;
  token: string | undefined;
  setLabelId: Dispatch<SetStateAction<string | null>>;
  setSelectedLabel: Dispatch<SetStateAction<Label | LabelDraft | null>>;
  setElements: Dispatch<SetStateAction<LabelElement[]>>;
  setLabelName: Dispatch<SetStateAction<string>>;
  setCanvasWidth: Dispatch<SetStateAction<number>>;
  setCanvasHeight: Dispatch<SetStateAction<number>>;
  setCanvasRotation: Dispatch<SetStateAction<number>>;
  setSelectedElement: Dispatch<SetStateAction<string | null>>;
  clearEditor: () => void;
}

export interface UseLabelPersistenceResult {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isSaving: boolean;
  handleOnClickSave: () => void;
  handleDeleteLabel: () => void;
  handleSelectLabel: (label: Label) => void;
  handleCreateNewLabel: () => void;
  exportJSON: (name?: string) => void;
  handleImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useLabelPersistence({
  elements,
  labelName,
  labelId,
  canvasWidth,
  canvasHeight,
  canvasRotation,
  token,
  setLabelId,
  setSelectedLabel,
  setElements,
  setLabelName,
  setCanvasWidth,
  setCanvasHeight,
  setCanvasRotation,
  setSelectedElement,
  clearEditor,
}: UseLabelPersistenceParams): UseLabelPersistenceResult {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  type SaveMutationVars = {
    labelId?: string;
    labelName: string;
    labelFormat: LabelFormat;
    token?: string;
  };

  const saveMutation = useMutation({
    mutationFn: async ({
      labelId: id,
      labelName: name,
      labelFormat: format,
      token: t,
    }: SaveMutationVars) => {
      const tk = t ?? '';
      if (id) return updateLabel(id, name, format, tk);
      return createLabel(name, format, tk);
    },
    onSuccess: (data, variables) => {
      if (!variables.labelId && data?.data) {
        setLabelId(data.data.id);
        setSelectedLabel(data.data);
      }
      notify.success({
        title: `Etiqueta ${variables.labelId ? 'actualizada' : 'guardada'} correctamente`,
      });
      queryClient.invalidateQueries({ queryKey: getLabelsQueryKey() });
    },
    onError: (err: Error) => {
      const e = err as Error & {
        userMessage?: string;
        data?: { userMessage?: string };
        response?: { data?: { userMessage?: string } };
      };
      const msg =
        e?.userMessage ||
        e?.data?.userMessage ||
        e?.response?.data?.userMessage ||
        e?.message ||
        'Error al guardar etiqueta.';
      notify.error({ title: msg });
    },
  });

  type DeleteMutationVars = { labelId: string; token?: string };

  const deleteMutation = useMutation({
    mutationFn: ({ labelId: id, token: t }: DeleteMutationVars) => deleteLabel(id, t ?? ''),
    onSuccess: () => {
      notify.success({ title: 'Etiqueta eliminada correctamente' });
      clearEditor();
      queryClient.invalidateQueries({ queryKey: getLabelsQueryKey() });
    },
    onError: (err: Error) => {
      const e = err as Error & { userMessage?: string; data?: { userMessage?: string } };
      const msg =
        e?.userMessage || e?.data?.userMessage || e?.message || 'Error al eliminar etiqueta.';
      notify.error({ title: msg });
    },
  });

  const isSaving = saveMutation.isPending;

  const handleSave = () => {
    const validationError = validateLabelName(labelName);
    if (validationError) {
      notify.error({ title: validationError });
      return;
    }
    if (hasDuplicateFieldKeys(elements)) {
      notify.error({ title: 'Error: hay campos con el mismo nombre' });
      return;
    }
    if (hasAnyElementValidationErrors(elements)) {
      notify.error({
        title:
          'Completa el nombre de todos los campos y las opciones de los campos tipo select antes de guardar.',
      });
      return;
    }
    const labelFormat = {
      elements,
      canvas: { width: canvasWidth, height: canvasHeight, rotation: canvasRotation },
    };
    saveMutation.mutate({ labelId: labelId || undefined, labelName, labelFormat, token });
  };

  const handleOnClickSave = () => {
    handleSave();
  };

  const handleDeleteLabel = () => {
    if (!labelId) {
      notify.error({ title: 'No hay etiqueta seleccionada para eliminar' });
      return;
    }
    deleteMutation.mutate({ labelId, token });
  };

  const handleSelectLabel = (label: Label) => {
    const id = label.id;
    const name = label.name || '';
    const format = label.format;
    setSelectedLabel(label);
    setCanvasWidth(format.canvas.width);
    setCanvasHeight(format.canvas.height);
    setCanvasRotation(format.canvas.rotation || 0);
    const normalizedElements = normalizeElements(format.elements || []);
    setElements(normalizedElements);
    setLabelName(name);
    setLabelId(id);
    setSelectedElement(null);
  };

  const handleCreateNewLabel = () => {
    const model = { id: null, name: '', canvas: { width: 110, height: 90, rotation: 0 } };
    setSelectedLabel(model);
    setCanvasWidth(model.canvas.width);
    setCanvasHeight(model.canvas.height);
    setCanvasRotation(0);
    setElements([]);
    setLabelName('');
    setLabelId(null);
    setSelectedElement(null);
  };

  const exportJSON = (name = 'label-structure.json') => {
    const jsonData = {
      name,
      elements: elements.map(({ id, ...el }) => el),
      canvas: { width: canvasWidth, height: canvasHeight, rotation: canvasRotation },
    };
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name.endsWith('.json') ? name : `${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (jsonData: {
    elements?: unknown[];
    canvas?: { width?: number; height?: number; rotation?: number };
    name?: string;
  }) => {
    if (!jsonData) return;
    if (Array.isArray(jsonData.elements)) {
      const newElements = jsonData.elements.map((el: unknown, i: number) => ({
        id: `element-${Date.now()}-${i}`,
        ...(el as object),
      }));
      const normalizedElements = normalizeElements(newElements);
      setElements(normalizedElements);
    }
    if (jsonData.canvas) {
      setCanvasWidth(jsonData.canvas.width || canvasWidth);
      setCanvasHeight(jsonData.canvas.height || canvasHeight);
      setCanvasRotation(jsonData.canvas.rotation || 0);
    }
    return jsonData.name || '';
  };

  const validateLabelJSON = (data: unknown): boolean => {
    if (!data || typeof data !== 'object') {
      throw new Error('El archivo JSON no es válido');
    }
    const d = data as { elements?: unknown; canvas?: { width?: number; height?: number } };
    if (!Array.isArray(d.elements)) {
      throw new Error('El formato de elementos no es válido. Debe ser un array.');
    }
    if (!d.canvas || typeof d.canvas.width !== 'number' || typeof d.canvas.height !== 'number') {
      throw new Error('El formato del canvas no es válido. Debe tener width y height numéricos.');
    }
    return true;
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      try {
        const result = ev.target?.result;
        if (typeof result !== 'string') return;
        const data = JSON.parse(result);
        validateLabelJSON(data);
        const name = importJSON(data);
        setLabelName(name ?? '');
        notify.success({ title: 'Etiqueta importada correctamente' });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al importar la etiqueta';
        notify.error({ title: errorMessage });
        console.error('Error al importar etiqueta:', err);
      }
    };
    reader.readAsText(file);
  };

  return {
    fileInputRef,
    isSaving,
    handleOnClickSave,
    handleDeleteLabel,
    handleSelectLabel,
    handleCreateNewLabel,
    exportJSON,
    handleImportJSON,
  };
}
