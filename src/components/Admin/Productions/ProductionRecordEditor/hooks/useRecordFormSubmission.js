import { useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook para manejar la lógica de envío del formulario
 * Nota: La conversión de fechas se hace en useProductionRecord
 */
export const useRecordFormSubmission = ({ productionId, recordId, saveRecord, formData }) => {
  const router = useRouter();
  const [isNavigatePending, startTransition] = useTransition();

  const handleSubmit = useCallback(
    async (e) => {
      if (e) {
        e.preventDefault();
      }

      try {
        // El hook useProductionRecord ya maneja la conversión de fechas
        const response = await saveRecord(formData);

        // Si es creación, navegar a la página de edición (transición = loader hasta montar la ruta)
        if (!recordId) {
          const createdRecordId = response?.data?.id || response?.id;
          if (createdRecordId) {
            startTransition(() => {
              router.push(`/admin/productions/${productionId}/records/${createdRecordId}`);
            });
          }
        }

        return response;
      } catch (err) {
        // El error ya está manejado en el hook useProductionRecord
        console.error('Error saving record:', err);
        throw err;
      }
    },
    [productionId, recordId, saveRecord, formData, router, startTransition]
  );

  return {
    handleSubmit,
    isNavigatePending,
  };
};
