/**
 * Shared hook for reception form logic
 * Unifies common functionality between Create and Edit forms
 */
import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { normalizeDate } from '@/helpers/receptionCalculations';
import { 
    validateSupplier, 
    validateDate, 
    validateReceptionDetails, 
    validateTemporalPallets 
} from '@/helpers/receptionValidators';
import { formatReceptionError, logReceptionError } from '@/helpers/receptionErrorHandler';/**
 * Shared hook for reception forms
 * @param {Object} options - Configuration options
 * @param {string} options.mode - Initial mode: 'automatic' or 'manual'
 * @param {Function} options.onSuccess - Success callback
 * @param {boolean} options.isEdit - Whether this is edit mode
 * @returns {Object} Form state and handlers
 */
export const useReceptionForm = ({ 
    mode: initialMode = 'automatic', 
    onSuccess,
    isEdit = false 
}) => {
    const [mode, setMode] = useState(initialMode);
    const [temporalPallets, setTemporalPallets] = useState([]);
    const [isModeChangeDialogOpen, setIsModeChangeDialogOpen] = useState(false);
    const [pendingMode, setPendingMode] = useState(null);

    const form = useForm({
        defaultValues: {
            supplier: null,
            date: normalizeDate(new Date()),
            notes: '',
            details: isEdit ? [] : [{
                product: null,
                grossWeight: '',
                boxes: 1,
                tare: '3',
                netWeight: '',
                price: '',
                lot: '',
            }],
        },
        mode: 'onChange',
    });

    const { watch, setValue } = form;

    /**
     * Validates form data before submission
     * @param {Object} data - Form data
     * @returns {Object|null} Error object or null if valid
     */
    const validateFormData = useCallback((data) => {
        const supplierError = validateSupplier(data.supplier);
        if (supplierError) {
            return { field: 'supplier', message: supplierError };
        }

        const dateError = validateDate(data.date);
        if (dateError) {
            return { field: 'date', message: dateError };
        }

        if (mode === 'automatic') {
            const detailsError = validateReceptionDetails(data.details);
            if (detailsError) {
                return { field: 'details', message: detailsError };
            }
        } else {
            const palletsError = validateTemporalPallets(temporalPallets);
            if (palletsError) {
                return { field: 'pallets', message: palletsError };
            }
        }

        return null;
    }, [mode, temporalPallets]);

    /**
     * Checks if current mode has data
     * @returns {boolean} True if mode has data
     */
    const hasDataInCurrentMode = useCallback(() => {
        if (mode === 'automatic') {
            const details = watch('details') || [];
            if (details.length > 1) return true;
            return details.some(detail => 
                detail.product || 
                (detail.grossWeight && parseFloat(detail.grossWeight) > 0) ||
                (detail.price && parseFloat(detail.price) > 0) ||
                (detail.lot && detail.lot.trim() !== '')
            );
        } else {
            return temporalPallets && temporalPallets.length > 0;
        }
    }, [mode, watch, temporalPallets]);

    /**
     * Handles mode change with confirmation if needed
     * @param {string} newMode - New mode to switch to
     */
    const handleModeChange = useCallback((newMode) => {
        if (!hasDataInCurrentMode()) {
            setMode(newMode);
            return;
        }

        setPendingMode(newMode);
        setIsModeChangeDialogOpen(true);
    }, [hasDataInCurrentMode]);

    /**
     * Confirms mode change and clears data
     */
    const handleConfirmModeChange = useCallback(() => {
        if (mode === 'automatic') {
            setValue('details', [{
                product: null,
                grossWeight: '',
                boxes: 1,
                tare: '3',
                netWeight: '',
                price: '',
                lot: '',
            }]);
        } else {
            setTemporalPallets([]);
        }

        setMode(pendingMode);
        setIsModeChangeDialogOpen(false);
        setPendingMode(null);
    }, [mode, pendingMode, setValue]);

    /**
     * Cancels mode change
     */
    const handleCancelModeChange = useCallback(() => {
        setIsModeChangeDialogOpen(false);
        setPendingMode(null);
    }, []);

    /**
     * Handles form errors with user-friendly messages
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    const handleError = useCallback((error, context = 'operation') => {
        const errorInfo = logReceptionError(error, context, { mode, isEdit });
        notify.error(formatReceptionError(error, context));
    }, [mode, isEdit]);

    // Memoized values
    const modeChangeDialogProps = useMemo(() => ({
        isOpen: isModeChangeDialogOpen,
        onOpenChange: setIsModeChangeDialogOpen,
        pendingMode,
        currentMode: mode,
        onConfirm: handleConfirmModeChange,
        onCancel: handleCancelModeChange,
    }), [isModeChangeDialogOpen, pendingMode, mode, handleConfirmModeChange, handleCancelModeChange]);

    return {
        // Form state
        form,
        mode,
        setMode,
        temporalPallets,
        setTemporalPallets,
        
        // Validation
        validateFormData,
        hasDataInCurrentMode,
        
        // Mode management
        handleModeChange,
        modeChangeDialogProps,
        
        // Error handling
        handleError,
        
        // Helpers
        watch,
        setValue,
    };
};

