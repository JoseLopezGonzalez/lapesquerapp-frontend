import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { isoToDate } from '@/helpers/production/dateFormatters';
import {
  getProcessId,
  getParentRecordId,
  getRecordNotes,
  getRecordField,
} from '@/helpers/production/recordHelpers';

const EMPTY_FORM_BASELINE = {
  process_id: 'none',
  parent_record_id: 'none',
  notes: '',
  started_at: '',
  finished_at: '',
};

function snapshotEqual(a, b) {
  if (!a || !b) return false;
  return (
    String(a.process_id ?? 'none') === String(b.process_id ?? 'none') &&
    String(a.parent_record_id ?? 'none') === String(b.parent_record_id ?? 'none') &&
    String(a.notes ?? '') === String(b.notes ?? '') &&
    String(a.started_at ?? '') === String(b.started_at ?? '') &&
    String(a.finished_at ?? '') === String(b.finished_at ?? '')
  );
}

/**
 * Hook para manejar el estado del formulario de record de producción
 */
export const useRecordFormData = (record, processes, isEditMode, defaultParentRecordId = null) => {
  const [formData, setFormData] = useState({
    process_id: 'none',
    parent_record_id: 'none',
    notes: '',
    started_at: '',
    finished_at: '',
  });

  /** Evita pisar el tipo de proceso cuando el mismo registro se refresca sin `process` en el snapshot (refetch intermedio). */
  const syncedRecordIdRef = useRef(null);

  /** Valores guardados en servidor (o vacíos en alta) para detectar cambios sin guardar. */
  const baselineFormRef = useRef({ ...EMPTY_FORM_BASELINE });

  // Alta con padre prefijado (p. ej. subproceso desde detalle del padre)
  useEffect(() => {
    if (isEditMode || !defaultParentRecordId) {
      return;
    }

    const parentId = String(defaultParentRecordId);
    setFormData((prev) => {
      if (prev.parent_record_id === parentId) {
        return prev;
      }
      const next = { ...EMPTY_FORM_BASELINE, parent_record_id: parentId };
      baselineFormRef.current = { ...next };
      return next;
    });
  }, [isEditMode, defaultParentRecordId]);

  // Inicializar formulario cuando se carga el record
  useEffect(() => {
    if (!record || !record.id || !isEditMode) {
      return;
    }

    const recordId = record.id;
    const isFirstSyncForThisRecord = syncedRecordIdRef.current !== recordId;
    if (isFirstSyncForThisRecord) {
      syncedRecordIdRef.current = recordId;
    }

    const processIdFromServer = getProcessId(record);

    const startedAt = getRecordField(record, 'startedAt');
    const finishedAt = getRecordField(record, 'finishedAt');
    const startedAtFormatted = startedAt ? isoToDate(startedAt) : '';
    const finishedAtFormatted = finishedAt ? isoToDate(finishedAt) : '';
    const parentRecordId = getParentRecordId(record);
    const notes = getRecordNotes(record);

    setFormData((prev) => {
      const appearsToBeEmptySnapshot =
        (processIdFromServer == null || processIdFromServer === '') &&
        parentRecordId == null &&
        !notes &&
        !startedAtFormatted &&
        !finishedAtFormatted;

      const hadPreviousMeaningfulValues =
        prev.process_id !== 'none' ||
        prev.parent_record_id !== 'none' ||
        Boolean(prev.notes) ||
        Boolean(prev.started_at) ||
        Boolean(prev.finished_at);

      // Evitar "parpadeo a vacío" cuando el mismo registro se refresca con payload parcial.
      // En ese caso preservamos el estado actual del formulario para no permitir guardados erróneos.
      if (!isFirstSyncForThisRecord && appearsToBeEmptySnapshot && hadPreviousMeaningfulValues) {
        return prev;
      }

      let finalProcessId = 'none';

      if (processIdFromServer != null && processIdFromServer !== '') {
        if (processes.length > 0) {
          const matchingProcess = processes.find((p) => {
            const pValue = (p.value ?? p.id)?.toString();
            const rValue = processIdFromServer?.toString();
            return pValue && rValue && pValue === rValue;
          });
          finalProcessId = matchingProcess
            ? (matchingProcess.value ?? matchingProcess.id).toString()
            : String(processIdFromServer);
        } else {
          finalProcessId = String(processIdFromServer);
        }
      } else if (!isFirstSyncForThisRecord && prev.process_id !== 'none') {
        // Mismo registro, refetch sin proceso resuelto aún: no deseleccionar
        finalProcessId = prev.process_id;
      }

      // Mismo tratamiento que process_id: si un refetch intermedio del mismo registro llega
      // sin parentRecordId resuelto todavía, no lo pisamos con 'none' — si no, un guardado de
      // cualquier otro campo de la cabecera reenvía parent_record_id: null y borra el padre real.
      // Si el usuario quitó el padre a propósito, prev.parent_record_id ya está en 'none' antes
      // de este sync (lo puso el propio Select), así que esta rama no aplica y se respeta el
      // vaciado.
      let finalParentRecordId = 'none';
      if (parentRecordId != null) {
        finalParentRecordId = parentRecordId.toString();
      } else if (!isFirstSyncForThisRecord && prev.parent_record_id !== 'none') {
        finalParentRecordId = prev.parent_record_id;
      }

      const next = {
        process_id: finalProcessId,
        parent_record_id: finalParentRecordId,
        notes: notes || '',
        started_at: startedAtFormatted,
        finished_at: finishedAtFormatted,
      };
      baselineFormRef.current = { ...next };
      return next;
    });
  }, [record, processes, isEditMode]);

  const isFormDirty = useMemo(() => !snapshotEqual(formData, baselineFormRef.current), [formData]);

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetFormData = useCallback(() => {
    const empty = { ...EMPTY_FORM_BASELINE };
    baselineFormRef.current = empty;
    setFormData(empty);
  }, []);

  return {
    formData,
    setFormData,
    updateFormData,
    resetFormData,
    isFormDirty,
  };
};
