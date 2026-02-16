// components/EditReceptionForm.jsx
'use client'

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/Shadcn/Combobox';
import { Plus, Trash2, ArrowRight, AlertTriangle, Package, Edit, Loader2, Printer, FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { useSession } from 'next-auth/react';
import { useProductOptions } from '@/hooks/useProductOptions';
import { useSupplierOptions } from '@/hooks/useSupplierOptions';
import { usePriceSynchronization } from '@/hooks/usePriceSynchronization';
import Loader from '@/components/Utilities/Loader';import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/datePicker';
import { format } from "date-fns";
import { getRawMaterialReception, updateRawMaterialReception } from '@/services/rawMaterialReceptionService';
import { useRouter } from 'next/navigation';
import { formatDecimal, formatDecimalWeight, formatDecimalCurrency } from '@/helpers/formats/numbers/formatNumbers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/Utilities/EmptyState';
import { getPallet } from '@/services/palletService';
import { notify } from '@/lib/notifications';
import dynamic from 'next/dynamic';

// Lazy load dialogs for code splitting
const PalletDialog = dynamic(
    () => import('@/components/Admin/Pallets/PalletDialog'),
    { 
        loading: () => <div className="flex items-center justify-center p-4">Cargando...</div>,
        ssr: false 
    }
);

const PalletLabelDialog = dynamic(
    () => import('@/components/Admin/Pallets/PalletLabelDialog'),
    { 
        loading: () => <div className="flex items-center justify-center p-4">Cargando...</div>,
        ssr: false 
    }
);

const AllPalletsLabelDialog = dynamic(
    () => import('@/components/Admin/RawMaterialReceptions/AllPalletsLabelDialog'),
    { 
        loading: () => <div className="flex items-center justify-center p-4">Cargando...</div>,
        ssr: false 
    }
);

const ReceptionSummaryDialog = dynamic(
    () => import('@/components/Admin/RawMaterialReceptions/ReceptionSummaryDialog'),
    { 
        loading: () => <div className="flex items-center justify-center p-4">Cargando...</div>,
        ssr: false 
    }
);

const ReceptionPrintDialog = dynamic(
    () => import('@/components/Admin/RawMaterialReceptions/ReceptionPrintDialog'),
    { 
        loading: () => <div className="flex items-center justify-center p-4">Cargando...</div>,
        ssr: false 
    }
);
import { 
    extractGlobalPriceMap, 
    transformPalletsToApiFormat, 
    transformDetailsToApiFormat,
    buildProductLotSummary,
    createPriceKey,
    mapBackendPalletsToTemporal
} from '@/helpers/receptionTransformations';
import { formatReceptionError, logReceptionError } from '@/helpers/receptionErrorHandler';
import { 
    validateSupplier, 
    validateDate, 
    validateReceptionDetails, 
    validateTemporalPallets 
} from '@/helpers/receptionValidators';
import { VirtualizedTable } from '../VirtualizedTable';
import { useAccessibilityAnnouncer } from '../AccessibilityAnnouncer';

const TARE_OPTIONS = [
    { value: '1', label: '1kg' },
    { value: '2', label: '2kg' },
    { value: '3', label: '3kg' },
    { value: '4', label: '4kg' },
    { value: '5', label: '5kg' },
];

const EditReceptionForm = ({ receptionId, onSuccess }) => {
    const { productOptions, loading: productsLoading } = useProductOptions();
    const { supplierOptions, loading: suppliersLoading } = useSupplierOptions();
    const { data: session } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [creationMode, setCreationMode] = useState(null); // 'lines', 'pallets', or null (old receptions)
    const [canEdit, setCanEdit] = useState(true);
    const [cannotEditReason, setCannotEditReason] = useState(null);
    // Estados para modo 'pallets'
    const [temporalPallets, setTemporalPallets] = useState([]);
    const [isPalletDialogOpen, setIsPalletDialogOpen] = useState(false);
    const [selectedPalletId, setSelectedPalletId] = useState(null);
    const [editingPalletIndex, setEditingPalletIndex] = useState(null);
    const [palletMetadata, setPalletMetadata] = useState({ prices: {}, observations: '' });
    const [isPalletLabelDialogOpen, setIsPalletLabelDialogOpen] = useState(false);
    const [selectedPalletForLabel, setSelectedPalletForLabel] = useState(null);
    const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
    const [receptionPrices, setReceptionPrices] = useState([]);
    const [isAllPalletsLabelDialogOpen, setIsAllPalletsLabelDialogOpen] = useState(false);
    const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
    // Store original box IDs from backend to distinguish between real and temporary IDs
    const [originalBoxIds, setOriginalBoxIds] = useState(new Set());
    // Track if there are any used boxes in the reception
    const [hasUsedBoxes, setHasUsedBoxes] = useState(false);
    // Store original totals by product+lot for validation
    const [originalTotals, setOriginalTotals] = useState(new Map());
    // Store initial state of pallets to detect changes
    const [initialPalletsState, setInitialPalletsState] = useState(null);
    const [initialFormState, setInitialFormState] = useState(null);
    
    // Ref para evitar recargas innecesarias cuando se hace focus en la pestaña
    const hasLoadedRef = useRef(false);
    const lastReceptionIdRef = useRef(null);
    const isLoadingRef = useRef(false); // Prevent concurrent loads

    // Use optimized price synchronization hook
    const { updatePrice } = usePriceSynchronization(temporalPallets, setTemporalPallets);

    // Accessibility announcer for screen readers
    const { announce, Announcer } = useAccessibilityAnnouncer();

    // Memoize pallets display data to avoid recalculating on every render
    const palletsDisplayData = useMemo(() => {
        return temporalPallets.map((item) => {
            const pallet = item.pallet;
            const productLotCombinations = buildProductLotSummary(pallet);
            return {
                item,
                pallet,
                productLotCombinations,
            };
        });
    }, [temporalPallets]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        reset,
        formState: { errors, isSubmitting, isDirty },
    } = useForm({
        defaultValues: {
            supplier: null,
            date: new Date(),
            notes: '',
            details: [],
            declaredTotalAmount: null,
            declaredTotalNetWeight: null,
        },
        mode: 'onChange',
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'details',
    });

    // Watch all detail fields (no calculation needed, netWeight is directly editable)
    const watchedDetails = watch('details');
    
    // State to force re-render when price or netWeight changes
    const [recalcTrigger, setRecalcTrigger] = useState(0);
    
    // Watch all price and netWeight fields individually to ensure recalculation
    // This creates subscriptions that trigger re-renders when values change
    const watchedPricesAndWeights = useWatch({
        control,
        name: 'details',
        defaultValue: watchedDetails || []
    });
    
    // Force re-render when price or netWeight changes
    useEffect(() => {
        if (watchedPricesAndWeights && Array.isArray(watchedPricesAndWeights)) {
            const triggerValue = watchedPricesAndWeights.map(d => 
                `${d?.price || ''}|${d?.netWeight || ''}`
            ).join('||');
            // Only update if the value actually changed
            setRecalcTrigger(prev => {
                const newValue = prev + 1;
                return newValue;
            });
        }
    }, [JSON.stringify(watchedPricesAndWeights?.map(d => ({ price: d?.price || '', netWeight: d?.netWeight || '' })))]);
    
    // Create a trigger value that changes when any price or netWeight changes
    // This ensures the component re-renders and recalculates totals when these values change
    const priceAndWeightTrigger = useMemo(() => {
        if (!watchedPricesAndWeights || !Array.isArray(watchedPricesAndWeights)) return '';
        // Create a string that includes all prices and netWeights
        // This will change when any of these values change, triggering recalculation
        return JSON.stringify(watchedPricesAndWeights.map(d => ({ 
            price: d?.price || '', 
            netWeight: d?.netWeight || '' 
        }))) + recalcTrigger;
    }, [watchedPricesAndWeights, recalcTrigger]);

    // Calculate totals (total kg and total amount) for lines mode
    // Use watchedPricesAndWeights to ensure recalculation when price or netWeight changes
    const linesTotals = useMemo(() => {
        const detailsToUse = watchedPricesAndWeights || watchedDetails;
        if (!detailsToUse || !Array.isArray(detailsToUse)) {
            return { totalKg: 0, totalAmount: 0 };
        }
        let totalKg = 0;
        let totalAmount = 0;
        detailsToUse.forEach((detail) => {
            const netWeight = parseFloat(detail?.netWeight) || 0;
            const price = parseFloat(detail?.price) || 0;
            totalKg += netWeight;
            totalAmount += netWeight * price;
        });
        return { totalKg, totalAmount };
    }, [watchedPricesAndWeights, watchedDetails, priceAndWeightTrigger]);

    // Load reception data
    useEffect(() => {
        const loadReception = async () => {
            if (!receptionId || !session?.user?.accessToken) return;
            
            // Evitar recargar si ya se cargó esta recepción y no ha cambiado el ID
            if (hasLoadedRef.current && lastReceptionIdRef.current === receptionId) {
                return;
            }

            // Prevent concurrent loads
            if (isLoadingRef.current) {
                return;
            }

            try {
                isLoadingRef.current = true;
                setLoading(true);
                const reception = await getRawMaterialReception(receptionId, session.user.accessToken);
                
                // Marcar como cargado y guardar el ID
                hasLoadedRef.current = true;
                lastReceptionIdRef.current = receptionId;
                
                // Detectar el modo de creación y si se puede editar
                const mode = reception.creationMode || null;
                setCreationMode(mode);
                
                // Verificar si el motivo de no edición es por cajas usadas (permitir edición parcial)
                const cannotEditReason = reception.cannotEditReason || null;
                const isBlockedByUsedBoxes = cannotEditReason && 
                    (cannotEditReason.toLowerCase().includes('caja') || 
                     cannotEditReason.toLowerCase().includes('siendo usada') ||
                     cannotEditReason.toLowerCase().includes('usada en producción'));
                
                // Permitir edición parcial si el bloqueo es solo por cajas usadas
                // El backend ahora debería retornar canEdit: true, pero por compatibilidad
                // también manejamos el caso donde canEdit es false pero es por cajas usadas
                const canEditPartial = isBlockedByUsedBoxes && mode === 'pallets';
                const canEditFull = reception.canEdit !== false;
                
                // Si podemos editar (total o parcial), permitir la carga
                const finalCanEdit = canEditFull || canEditPartial;
                setCanEdit(finalCanEdit);
                setCannotEditReason(canEditPartial ? null : cannotEditReason);
                
                // Si no se puede editar (y no es por cajas usadas), no cargar datos
                if (!finalCanEdit) {
                    console.log('Recepción no se puede editar:', cannotEditReason);
                    return;
                }
                
                // Log para debugging
                if (canEditPartial && !canEditFull) {
                    console.log('Modo edición parcial activado por cajas usadas:', cannotEditReason);
                }
                
                // Si es modo 'pallets', cargar los palets para edición
                if (mode === 'pallets') {
                    console.log('Recepción creada por palets - cargando palets para edición');
                    
                    // Convertir palets del backend al formato temporal del frontend
                    if (reception.pallets && reception.pallets.length > 0) {
                        // Backend now returns prices array in ROOT (same format as request)
                        // Convert prices array to object { [productId-lot]: price } for easy lookup
                        const globalPricesObj = {};
                        if (reception.prices && Array.isArray(reception.prices)) {
                            // Store original prices array for summary dialog
                            setReceptionPrices(reception.prices);
                            
                            reception.prices.forEach(priceEntry => {
                                // Backend only includes prices with values (excludes null)
                                if (priceEntry.product?.id && priceEntry.lot && priceEntry.price !== null && priceEntry.price !== undefined) {
                                    const key = `${priceEntry.product.id}-${priceEntry.lot}`;
                                    globalPricesObj[key] = parseFloat(priceEntry.price).toString();
                                }
                            });
                        } else {
                            setReceptionPrices([]);
                        }
                        
                        // Collect all original box IDs from backend and check for used boxes
                        const boxIdsSet = new Set();
                        let hasUsed = false;
                        const totalsMap = new Map();
                        
                        reception.pallets.forEach(pallet => {
                            (pallet.boxes || []).forEach(box => {
                                if (box.id) {
                                    boxIdsSet.add(box.id);
                                }
                                // Check if box is used
                                if (box.isAvailable === false || box.production) {
                                    hasUsed = true;
                                }
                                // Calculate original totals by product+lot
                                if (box.product?.id) {
                                    const key = `${box.product.id}-${box.lot || ''}`;
                                    const currentTotal = totalsMap.get(key) || 0;
                                    totalsMap.set(key, currentTotal + (parseFloat(box.netWeight) || 0));
                                }
                            });
                        });
                        setOriginalBoxIds(boxIdsSet);
                        setHasUsedBoxes(hasUsed);
                        setOriginalTotals(totalsMap);
                        
                        const convertedPallets = reception.pallets.map(pallet => {
                            // Convertir boxes del palet al formato esperado por PalletDialog
                            const boxes = (pallet.boxes || []).map(box => ({
                                id: box.id,
                                product: box.product ? {
                                    id: box.product.id,
                                    name: box.product.name || box.product.alias || '',
                                } : null,
                                lot: box.lot || '',
                                grossWeight: box.grossWeight ? parseFloat(box.grossWeight).toString() : '',
                                netWeight: box.netWeight ? parseFloat(box.netWeight).toString() : '',
                                gs1128: box.gs1128 || undefined,
                                // Preservar información de disponibilidad y producción
                                isAvailable: box.isAvailable !== false, // Default a true si no viene
                                production: box.production || null,
                            }));
                            
                            // Build prices object for this pallet from global prices
                            // Filter only the prices that apply to boxes in this pallet
                            const palletPricesObj = {};
                            boxes.forEach(box => {
                                if (box.product?.id && box.lot) {
                                    const key = `${box.product.id}-${box.lot}`;
                                    if (globalPricesObj[key]) {
                                        palletPricesObj[key] = globalPricesObj[key];
                                    }
                                }
                            });
                            
                            return {
                                pallet: {
                                    id: pallet.id,
                                    boxes: boxes,
                                    numberOfBoxes: boxes.length,
                                    netWeight: boxes.reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0),
                                    observations: pallet.observations || '',
                                },
                                prices: palletPricesObj, // Prices filtered for this pallet's boxes
                                observations: pallet.observations || '',
                            };
                        });
                        
                        setTemporalPallets(convertedPallets);
                        // Guardar estado inicial de pallets para detectar cambios
                        setInitialPalletsState(JSON.stringify(convertedPallets));
                    }
                    
                    // Cargar datos básicos del formulario
                    const formData = {
                        supplier: reception.supplier?.id ? reception.supplier.id.toString() : null,
                        date: reception.date ? new Date(reception.date) : new Date(),
                        notes: reception.notes || '',
                        declaredTotalAmount: reception.declaredTotalAmount !== null && reception.declaredTotalAmount !== undefined 
                            ? parseFloat(reception.declaredTotalAmount).toString() 
                            : '',
                        declaredTotalNetWeight: reception.declaredTotalNetWeight !== null && reception.declaredTotalNetWeight !== undefined 
                            ? parseFloat(reception.declaredTotalNetWeight).toString() 
                            : '',
                    };
                    reset(formData);
                    // Guardar estado inicial del formulario para detectar cambios (normalizar fecha)
                    const normalizedFormData = {
                        ...formData,
                        date: formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : formData.date,
                    };
                    setInitialFormState(JSON.stringify(normalizedFormData));
                    
                    return;
                }
                
                // Map details from backend structure to form structure
                // Backend details only have: id, product, netWeight, price, lot
                // We only need: product, netWeight, boxes, price, lot (no tare, no grossWeight)
                const mapDetails = (details) => {
                    if (!details || details.length === 0) return [];
                    
                    return details.map(detail => {
                        // Default values
                        let boxes = 1;
                        let price = '';
                        let lot = '';
                        
                        // Get price from detail.price field
                        if (detail.price !== null && detail.price !== undefined) {
                            price = parseFloat(detail.price).toString();
                        }
                        
                        // Get lot from detail.lot field
                        if (detail.lot) {
                            lot = detail.lot;
                        }
                        
                        // Try to get boxes count from pallets if available (to infer number of boxes)
                        // But this is just for display - boxes count might not be accurate
                        if (reception.pallets && reception.pallets.length > 0) {
                            const pallet = reception.pallets[0];
                            if (pallet.boxes && pallet.boxes.length > 0) {
                                // Find boxes for this product
                                const productBoxes = pallet.boxes.filter(box => 
                                    box.product?.id === detail.product?.id
                                );
                                if (productBoxes.length > 0) {
                                    boxes = productBoxes.length;
                                    // Try to get lot from first box if not in detail
                                    if (!lot && productBoxes[0].lot) {
                                        lot = productBoxes[0].lot;
                                    }
                                }
                            }
                        }
                        
                        return {
                            product: detail.product?.id ? detail.product.id.toString() : null,
                            netWeight: detail.netWeight || '',
                            boxes: boxes,
                            price: price,
                            lot: lot,
                        };
                    });
                };
                
                // Map reception data to form values
                const formData = {
                    supplier: reception.supplier?.id ? reception.supplier.id.toString() : null,
                    date: reception.date ? new Date(reception.date) : new Date(),
                    notes: reception.notes || '',
                    details: mapDetails(reception.details),
                    declaredTotalAmount: reception.declaredTotalAmount !== null && reception.declaredTotalAmount !== undefined 
                        ? parseFloat(reception.declaredTotalAmount).toString() 
                        : '',
                    declaredTotalNetWeight: reception.declaredTotalNetWeight !== null && reception.declaredTotalNetWeight !== undefined 
                        ? parseFloat(reception.declaredTotalNetWeight).toString() 
                        : '',
                };
                    reset(formData);
                    // Guardar estado inicial del formulario para detectar cambios (normalizar fecha)
                    const normalizedFormData = {
                        ...formData,
                        date: formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : formData.date,
                    };
                    setInitialFormState(JSON.stringify(normalizedFormData));
            } catch (error) {
                const errorInfo = logReceptionError(error, 'load', { receptionId });
                notify.error({ title: formatReceptionError(error, 'load') });
            } finally {
                setLoading(false);
                isLoadingRef.current = false;
            }
        };

        loadReception();
    }, [receptionId, session?.user?.accessToken]);
    
    // Resetear el flag cuando cambia el receptionId
    useEffect(() => {
        if (lastReceptionIdRef.current !== receptionId) {
            hasLoadedRef.current = false;
        }
    }, [receptionId]);

    // Función helper para normalizar pallets antes de comparar
    // Esto asegura que la comparación JSON sea consistente
    const normalizePalletsForComparison = useCallback((pallets) => {
        if (!Array.isArray(pallets)) return [];
        
        return pallets
            .map(item => {
                // Normalizar cajas: ordenar por ID y normalizar campos
                // Solo incluir campos relevantes para la comparación
                const normalizedBoxes = (item.pallet?.boxes || [])
                    .map(box => ({
                        id: box.id || null,
                        product: box.product?.id || null,
                        lot: box.lot || '',
                        // Normalizar pesos: convertir a string y asegurar formato consistente
                        grossWeight: box.grossWeight ? parseFloat(box.grossWeight).toString() : '',
                        netWeight: box.netWeight ? parseFloat(box.netWeight).toString() : '',
                        // Solo incluir gs1128 si existe (no undefined)
                        ...(box.gs1128 ? { gs1128: box.gs1128 } : {}),
                    }))
                    .sort((a, b) => {
                        // Ordenar: primero por ID (si existe), luego por producto y lote
                        if (a.id && b.id) return a.id - b.id;
                        if (a.id) return -1;
                        if (b.id) return 1;
                        if (a.product !== b.product) return (a.product || 0) - (b.product || 0);
                        return (a.lot || '').localeCompare(b.lot || '');
                    });
                
                // Normalizar precios: convertir valores a string y ordenar por key
                // Filtrar valores vacíos, null o undefined
                const normalizedPrices = Object.fromEntries(
                    Object.entries(item.prices || {})
                        .filter(([_, value]) => {
                            // Filtrar valores vacíos, null o undefined
                            if (value === undefined || value === null || value === '') return false;
                            return true;
                        })
                        .map(([key, value]) => {
                            // Normalizar valores: siempre convertir a string para consistencia
                            // Manejar tanto números como strings
                            let normalizedValue;
                            if (typeof value === 'number') {
                                normalizedValue = value.toString();
                            } else if (typeof value === 'string') {
                                // Si es string, intentar parsear y convertir de nuevo para normalizar formato
                                const parsed = parseFloat(value);
                                normalizedValue = isNaN(parsed) ? value : parsed.toString();
                            } else {
                                normalizedValue = String(value);
                            }
                            return [key, normalizedValue];
                        })
                        .sort(([a], [b]) => a.localeCompare(b))
                );
                
                // Normalizar observaciones: convertir null/undefined a string vacío
                const normalizedObservations = item.observations || item.pallet?.observations || '';
                
                // Normalizar peso neto: calcular siempre desde las cajas normalizadas para consistencia
                // Esto asegura que el peso siempre se calcule de la misma manera
                const calculatedNetWeight = normalizedBoxes.reduce((sum, box) => {
                    const weight = parseFloat(box.netWeight) || 0;
                    return sum + weight;
                }, 0);
                
                return {
                    pallet: {
                        id: item.pallet?.id || null,
                        boxes: normalizedBoxes,
                        numberOfBoxes: normalizedBoxes.length,
                        netWeight: calculatedNetWeight,
                        observations: normalizedObservations,
                    },
                    prices: normalizedPrices,
                    observations: normalizedObservations,
                };
            })
            .sort((a, b) => {
                // Ordenar pallets por ID (si existe), luego por número de cajas
                if (a.pallet.id && b.pallet.id) return a.pallet.id - b.pallet.id;
                if (a.pallet.id) return -1;
                if (b.pallet.id) return 1;
                return b.pallet.numberOfBoxes - a.pallet.numberOfBoxes;
            });
    }, []);

    // Función helper para mapear detalles del backend al formato del formulario
    const mapDetailsFromBackend = useCallback((details, pallets = []) => {
        if (!details || details.length === 0) return [];
        
        return details.map(detail => {
            // Default values
            let boxes = 1;
            let price = '';
            let lot = '';
            
            // Get price from detail.price field
            if (detail.price !== null && detail.price !== undefined) {
                price = parseFloat(detail.price).toString();
            }
            
            // Get lot from detail.lot field
            if (detail.lot) {
                lot = detail.lot;
            }
            
            // Try to get boxes count from pallets if available
            if (pallets && pallets.length > 0) {
                const pallet = pallets[0];
                if (pallet.boxes && pallet.boxes.length > 0) {
                    const productBoxes = pallet.boxes.filter(box => 
                        box.product?.id === detail.product?.id
                    );
                    if (productBoxes.length > 0) {
                        boxes = productBoxes.length;
                        if (!lot && productBoxes[0].lot) {
                            lot = productBoxes[0].lot;
                        }
                    }
                }
            }
            
            return {
                product: detail.product?.id ? detail.product.id.toString() : null,
                netWeight: detail.netWeight ? parseFloat(detail.netWeight).toString() : '',
                boxes: boxes,
                price: price,
                lot: lot,
            };
        });
    }, []);

    // Detectar si hay cambios sin guardar
    const hasUnsavedChanges = useMemo(() => {
        // Si no hay estado inicial, no hay cambios
        if (!initialFormState && !initialPalletsState) {
            return false;
        }

        // Función helper para normalizar fechas en la comparación
        const normalizeFormData = (formData) => {
            return JSON.stringify({
                supplier: formData.supplier,
                date: formData.date instanceof Date ? formData.date.toISOString().split('T')[0] : formData.date,
                notes: formData.notes || '',
                declaredTotalAmount: formData.declaredTotalAmount || '',
                declaredTotalNetWeight: formData.declaredTotalNetWeight || '',
            });
        };

        // Verificar cambios en el formulario
        if (creationMode !== 'pallets') {
            // Para modo líneas, usar isDirty del formulario
            return isDirty;
        } else {
            // Para modo pallets, comparar estado actual con inicial usando normalización
            if (!initialPalletsState) {
                // Si no hay estado inicial, no hay cambios guardados
                return false;
            }
            
            try {
                // Normalizar el estado actual
                const normalizedCurrent = normalizePalletsForComparison(temporalPallets);
                const normalizedCurrentStr = JSON.stringify(normalizedCurrent);
                
                // initialPalletsState ya está guardado como string JSON de la versión normalizada
                // Solo necesitamos compararlo directamente, sin parsear y normalizar de nuevo
                // para evitar diferencias sutiles introducidas por la serialización/deserialización
                const palletsChanged = normalizedCurrentStr !== initialPalletsState;
                
                // Verificar cambios en el formulario
                const currentFormData = watch();
                const currentFormState = normalizeFormData(currentFormData);
                const formChanged = initialFormState && currentFormState !== initialFormState;
                
                return palletsChanged || formChanged;
            } catch (e) {
                // Si hay error al comparar, asumir que hay cambios por seguridad
                console.warn('Error al comparar pallets:', e);
                return true;
            }
        }
    }, [isDirty, temporalPallets, initialPalletsState, initialFormState, creationMode, watch, normalizePalletsForComparison]);

    const handleUpdate = useCallback(async (data) => {
        try {
            // Validate using centralized validators
            const supplierError = validateSupplier(data.supplier);
            if (supplierError) {
                notify.error({ title: supplierError });
                return;
            }

            const dateError = validateDate(data.date);
            if (dateError) {
                notify.error({ title: dateError });
                return;
            }

            let payload;

            if (creationMode === 'pallets') {
                // Validate pallets using centralized validator
                const palletsError = validateTemporalPallets(temporalPallets);
                if (palletsError) {
                    notify.error({ title: palletsError });
                    return;
                }

                // If there are used boxes, validate totals and prevent creating new boxes
                if (hasUsedBoxes) {
                    // Calculate current totals by product+lot
                    const currentTotals = new Map();
                    temporalPallets.forEach(item => {
                        (item.pallet?.boxes || []).forEach(box => {
                            if (box.product?.id) {
                                const key = `${box.product.id}-${box.lot || ''}`;
                                const currentTotal = currentTotals.get(key) || 0;
                                currentTotals.set(key, currentTotal + (parseFloat(box.netWeight) || 0));
                            }
                        });
                    });

                    // Validate that totals match (with tolerance of 0.01 kg)
                    for (const [key, originalTotal] of originalTotals.entries()) {
                        const currentTotal = currentTotals.get(key) || 0;
                        const difference = Math.abs(originalTotal - currentTotal);
                        if (difference > 0.01) {
                            const [productId, lot] = key.split('-');
                            const product = productOptions.find(p => p.value === productId || p.id === productId);
                            const productName = product?.label || product?.name || `Producto ${productId}`;
                            notify.error({
                                title: `El total del producto ${productName} con lote ${lot || '(sin lote)'} ha cambiado. Original: ${formatDecimalWeight(originalTotal)}, Nuevo: ${formatDecimalWeight(currentTotal)}, Diferencia: ${formatDecimalWeight(difference)}`,
                            });
                            return;
                        }
                    }

                    // Check for new boxes (boxes without ID)
                    const hasNewBoxes = temporalPallets.some(item =>
                        (item.pallet?.boxes || []).some(box => !box.id)
                    );
                    if (hasNewBoxes) {
                        notify.error({ title: 'No se pueden crear nuevas cajas cuando hay cajas siendo usadas en producción' });
                        return;
                    }
                }

                // Extract global prices using utility function
                const globalPriceMap = extractGlobalPriceMap(temporalPallets);
                const prices = Array.from(globalPriceMap.values());

                // Transform pallets to API format using utility function (includes originalBoxIds for editing)
                const convertedPallets = transformPalletsToApiFormat(temporalPallets, originalBoxIds);

                if (convertedPallets.length === 0) {
                    notify.error({ title: 'Debe completar al menos un palet válido con producto y cajas' });
                    return;
                }

                // Prepare payload for Mode Manual - prices in ROOT
                payload = {
                    supplier: {
                        id: data.supplier,
                    },
                    date: format(data.date, 'yyyy-MM-dd'),
                    notes: data.notes || '',
                    prices: prices, // ← In ROOT, shared by all pallets
                    pallets: convertedPallets,
                    declaredTotalAmount: data.declaredTotalAmount && data.declaredTotalAmount.trim() !== '' 
                        ? parseFloat(data.declaredTotalAmount) 
                        : null,
                    declaredTotalNetWeight: data.declaredTotalNetWeight && data.declaredTotalNetWeight.trim() !== '' 
                        ? parseFloat(data.declaredTotalNetWeight) 
                        : null,
                };
            } else {
                // Validate details using centralized validator
                const detailsError = validateReceptionDetails(data.details);
                if (detailsError) {
                    notify.error({ title: detailsError });
                    return;
                }

                // Transform details using utility function
                const transformedDetails = transformDetailsToApiFormat(data.details);

                if (transformedDetails.length === 0) {
                    notify.error({ title: 'Debe completar al menos una línea válida con producto y peso neto' });
                    return;
                }

                // Prepare payload according to API documentation (Mode Automático)
                payload = {
                    supplier: {
                        id: data.supplier,
                    },
                    date: format(data.date, 'yyyy-MM-dd'),
                    notes: data.notes || '',
                    details: transformedDetails,
                    declaredTotalAmount: data.declaredTotalAmount && data.declaredTotalAmount.trim() !== '' 
                        ? parseFloat(data.declaredTotalAmount) 
                        : null,
                    declaredTotalNetWeight: data.declaredTotalNetWeight && data.declaredTotalNetWeight.trim() !== '' 
                        ? parseFloat(data.declaredTotalNetWeight) 
                        : null,
                };
            }

            const updatedReception = await updateRawMaterialReception(receptionId, payload);
            
            // Actualizar estado después de guardar exitosamente
            if (creationMode === 'pallets' && updatedReception?.pallets && updatedReception.pallets.length > 0) {
                // Modo pallets: actualizar temporalPallets con los IDs del backend
                const globalPriceMap = extractGlobalPriceMap(temporalPallets);
                const globalPricesObj = Object.fromEntries(
                    Array.from(globalPriceMap.entries()).map(([key, value]) => [key, value.price])
                );
                
                const updatedTemporalPallets = mapBackendPalletsToTemporal(
                    updatedReception.pallets,
                    temporalPallets,
                    globalPricesObj
                );
                
                // Normalizar los pallets para asegurar consistencia en la comparación
                // Normalizar los pallets ANTES de actualizar el estado
                // Esto asegura que la comparación sea consistente
                const normalizedPallets = normalizePalletsForComparison(updatedTemporalPallets);
                
                // Actualizar temporalPallets con los datos del backend
                setTemporalPallets(updatedTemporalPallets);
                
                // Guardar el estado inicial usando la versión normalizada
                // IMPORTANTE: Guardamos la versión normalizada para que la comparación sea consistente
                setInitialPalletsState(JSON.stringify(normalizedPallets));
                
                // También actualizar estado inicial del formulario con datos del backend
                const formDataFromBackend = {
                    supplier: updatedReception.supplier?.id?.toString() || data.supplier,
                    date: updatedReception.date ? new Date(updatedReception.date) : data.date,
                    notes: updatedReception.notes || data.notes || '',
                    declaredTotalAmount: updatedReception.declaredTotalAmount !== null && updatedReception.declaredTotalAmount !== undefined 
                        ? parseFloat(updatedReception.declaredTotalAmount).toString() 
                        : '',
                    declaredTotalNetWeight: updatedReception.declaredTotalNetWeight !== null && updatedReception.declaredTotalNetWeight !== undefined 
                        ? parseFloat(updatedReception.declaredTotalNetWeight).toString() 
                        : '',
                };
                const normalizedFormData = {
                    supplier: formDataFromBackend.supplier,
                    date: formDataFromBackend.date instanceof Date ? formDataFromBackend.date.toISOString().split('T')[0] : formDataFromBackend.date,
                    notes: formDataFromBackend.notes || '',
                    declaredTotalAmount: formDataFromBackend.declaredTotalAmount || '',
                    declaredTotalNetWeight: formDataFromBackend.declaredTotalNetWeight || '',
                };
                setInitialFormState(JSON.stringify(normalizedFormData));
            } else {
                // Modo líneas: resetear formulario con datos del backend para limpiar isDirty
                const formDataFromBackend = {
                    supplier: updatedReception.supplier?.id?.toString() || data.supplier,
                    date: updatedReception.date ? new Date(updatedReception.date) : data.date,
                    notes: updatedReception.notes || data.notes || '',
                    details: mapDetailsFromBackend(updatedReception.details, updatedReception.pallets),
                    declaredTotalAmount: updatedReception.declaredTotalAmount !== null && updatedReception.declaredTotalAmount !== undefined 
                        ? parseFloat(updatedReception.declaredTotalAmount).toString() 
                        : '',
                    declaredTotalNetWeight: updatedReception.declaredTotalNetWeight !== null && updatedReception.declaredTotalNetWeight !== undefined 
                        ? parseFloat(updatedReception.declaredTotalNetWeight).toString() 
                        : '',
                };
                
                // Resetear el formulario con los datos del backend para limpiar isDirty
                reset(formDataFromBackend);
                
                // Actualizar estado inicial del formulario (normalizar fecha)
                const normalizedFormData = {
                    supplier: formDataFromBackend.supplier,
                    date: formDataFromBackend.date instanceof Date ? formDataFromBackend.date.toISOString().split('T')[0] : formDataFromBackend.date,
                    notes: formDataFromBackend.notes || '',
                    declaredTotalAmount: formDataFromBackend.declaredTotalAmount || '',
                    declaredTotalNetWeight: formDataFromBackend.declaredTotalNetWeight || '',
                };
                setInitialFormState(JSON.stringify(normalizedFormData));
            }
            
            notify.success({ title: 'Recepción actualizada exitosamente' });
            announce('Recepción actualizada exitosamente', 'assertive');
            
            if (onSuccess) {
                onSuccess(updatedReception);
            } else {
                // Redirigir a la misma página de edición para recargar los datos actualizados
                router.push(`/admin/raw-material-receptions/${receptionId}/edit`);
            }
        } catch (error) {
            const errorInfo = logReceptionError(error, 'update', { 
                receptionId, 
                creationMode, 
                hasPallets: temporalPallets.length 
            });
            notify.error({ title: formatReceptionError(error, 'update') });
        }
    }, [receptionId, creationMode, temporalPallets, originalBoxIds, onSuccess, router, announce, normalizePalletsForComparison, mapDetailsFromBackend, reset]);

    // Keyboard shortcuts (moved after isSubmitting and handleUpdate declarations)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+S or Cmd+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (!isSubmitting && canEdit) {
                    handleSubmit(handleUpdate)();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSubmitting, canEdit, handleSubmit, handleUpdate]);

    if (suppliersLoading || loading) {
        return (
            <div className='w-full h-full flex items-center justify-center'>
                <Loader />
            </div>
        );
    }

    // Si no se puede editar, mostrar mensaje
    // NOTA: Si el motivo es por cajas usadas, permitimos edición parcial (ya se maneja arriba)
    if (!canEdit) {
        return (
            <div className="w-full h-full p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold mb-4">Editar recepción de materia prima</h1>
                        {receptionId && (
                            <p className="text-sm text-muted-foreground">#{receptionId}</p>
                        )}
                    </div>
                </div>
                <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No se puede editar esta recepción</AlertTitle>
                    <AlertDescription>
                        {cannotEditReason || 'Esta recepción no se puede editar debido a restricciones del sistema.'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-6">
            {/* Accessibility announcer */}
            <Announcer />
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-semibold mb-4">Editar recepción de materia prima</h1>
                    {receptionId && (
                        <p className="text-sm text-muted-foreground">#{receptionId}</p>
                    )}
                </div>
                <div className="flex gap-2 items-center">
                    {hasUnsavedChanges && (
                        <div className="flex items-center gap-2 mr-2 px-3 py-1.5 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                            <div className="relative">
                                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 h-2 w-2 bg-amber-500 rounded-full animate-ping opacity-75"></div>
                            </div>
                            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                Cambios sin guardar
                            </span>
                        </div>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPrintDialogOpen(true)}
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit(handleUpdate)}
                        disabled={isSubmitting}
                        aria-label="Guardar cambios en recepción"
                        title="Guardar cambios (Ctrl+S)"
                        className={hasUnsavedChanges ? "relative" : ""}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Guardando
                            </>
                        ) : (
                            <>
                                Guardar cambios
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                        {hasUnsavedChanges && !isSubmitting && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                        )}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit(handleUpdate)} className="flex flex-col gap-8">
                {/* Supplier and Date Section */}
                <div className="w-full">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Proveedor</Label>
                            <Controller
                                name="supplier"
                                control={control}
                                rules={{ required: 'El proveedor es obligatorio' }}
                                render={({ field: { onChange, value } }) => (
                                    <Combobox
                                        options={supplierOptions}
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Seleccionar proveedor"
                                        searchPlaceholder="Buscar proveedor..."
                                        notFoundMessage="No se encontraron proveedores"
                                        loading={suppliersLoading}
                                    />
                                )}
                            />
                            {errors.supplier && (
                                <p className="text-destructive text-sm">{errors.supplier.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Fecha</Label>
                            <Controller
                                name="date"
                                control={control}
                                rules={{ required: 'La fecha es obligatoria' }}
                                render={({ field: { onChange, value } }) => (
                                    <DatePicker
                                        date={value}
                                        onChange={onChange}
                                        formatStyle="short"
                                    />
                                )}
                            />
                            {errors.date && (
                                <p className="text-destructive text-sm">{errors.date.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Observations Field */}
                <div className="w-full">
                    <div className="space-y-2">
                        <Label htmlFor="notes">Observaciones / Lonja</Label>
                        <Textarea
                            id="notes"
                            {...register('notes')}
                            placeholder="Ingrese observaciones..."
                            className="min-h-[80px]"
                        />
                    </div>
                </div>

                {/* Declared Totals Fields */}
                <div className="w-full">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="declaredTotalAmount">Importe Total Declarado (€)</Label>
                            <Input
                                id="declaredTotalAmount"
                                type="number"
                                step="0.01"
                                min="0"
                                {...register('declaredTotalAmount', {
                                    valueAsNumber: false,
                                    validate: (value) => {
                                        if (value && value.trim() !== '') {
                                            const numValue = parseFloat(value);
                                            if (isNaN(numValue) || numValue < 0) {
                                                return 'El importe debe ser un número mayor o igual a 0';
                                            }
                                        }
                                        return true;
                                    }
                                })}
                                placeholder="0.00"
                            />
                            {errors.declaredTotalAmount && (
                                <p className="text-destructive text-sm">{errors.declaredTotalAmount.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="declaredTotalNetWeight">Peso Neto Total Declarado (kg)</Label>
                            <Input
                                id="declaredTotalNetWeight"
                                type="number"
                                step="0.01"
                                min="0"
                                {...register('declaredTotalNetWeight', {
                                    valueAsNumber: false,
                                    validate: (value) => {
                                        if (value && value.trim() !== '') {
                                            const numValue = parseFloat(value);
                                            if (isNaN(numValue) || numValue < 0) {
                                                return 'El peso debe ser un número mayor o igual a 0';
                                            }
                                        }
                                        return true;
                                    }
                                })}
                                placeholder="0.00"
                            />
                            {errors.declaredTotalNetWeight && (
                                <p className="text-destructive text-sm">{errors.declaredTotalNetWeight.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Table (solo para modo lines) */}
                {creationMode !== 'pallets' && (
                <div className="w-full">
                    <div className="space-y-4">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Artículo</TableHead>
                                        <TableHead>Peso Neto (kg)</TableHead>
                                        <TableHead>Cajas</TableHead>
                                        <TableHead>Precio (€/kg)</TableHead>
                                        <TableHead>Importe</TableHead>
                                        <TableHead>Lote</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fields.map((field, index) => (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <Controller
                                                    name={`details.${index}.product`}
                                                    control={control}
                                                    rules={{ required: 'El producto es obligatorio' }}
                                                    render={({ field: { onChange, value } }) => (
                                                        <Combobox
                                                            options={productOptions}
                                                            value={value}
                                                            onChange={onChange}
                                                            placeholder="Seleccionar producto"
                                                            searchPlaceholder="Buscar producto..."
                                                            notFoundMessage="No se encontraron productos"
                                                            className="min-w-[200px]"
                                                            aria-label={`Producto para línea ${index + 1}`}
                                                            aria-required="true"
                                                            loading={productsLoading}
                                                        />
                                                    )}
                                                />
                                                {errors.details?.[index]?.product && (
                                                    <p className="text-destructive text-xs mt-1">
                                                        {errors.details[index].product.message}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Controller
                                                    name={`details.${index}.netWeight`}
                                                    control={control}
                                                    rules={{
                                                        required: 'El peso neto es obligatorio',
                                                        min: { value: 0.01, message: 'El peso debe ser mayor que 0' }
                                                    }}
                                                    render={({ field: { onChange, value, ...field } }) => (
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={value || ''}
                                                            onChange={(e) => {
                                                                onChange(e.target.value);
                                                                // Force re-render to update amounts
                                                                setRecalcTrigger(prev => prev + 1);
                                                            }}
                                                            placeholder="0.00"
                                                            className="w-32"
                                                            aria-label={`Peso neto para línea ${index + 1}`}
                                                            aria-required="true"
                                                        />
                                                    )}
                                                />
                                                {errors.details?.[index]?.netWeight && (
                                                    <p className="text-destructive text-xs mt-1">
                                                        {errors.details[index].netWeight.message}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const currentBoxes = parseInt(watch(`details.${index}.boxes`)) || 1;
                                                            if (currentBoxes > 1) {
                                                                setValue(`details.${index}.boxes`, currentBoxes - 1);
                                                            }
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        -
                                                    </Button>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        {...register(`details.${index}.boxes`, {
                                                            required: 'Las cajas son obligatorias',
                                                            valueAsNumber: true,
                                                            min: { value: 1, message: 'Mínimo 1 caja' }
                                                        })}
                                                        className="w-16 text-center"
                                                        aria-label={`Número de cajas para línea ${index + 1}`}
                                                        aria-required="true"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            const currentBoxes = parseInt(watch(`details.${index}.boxes`)) || 1;
                                                            setValue(`details.${index}.boxes`, currentBoxes + 1);
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                                {errors.details?.[index]?.boxes && (
                                                    <p className="text-destructive text-xs mt-1">
                                                        {errors.details[index].boxes.message}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Controller
                                                    name={`details.${index}.price`}
                                                    control={control}
                                                    render={({ field: { onChange, value, ...field } }) => (
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={value || ''}
                                                            onChange={(e) => {
                                                                onChange(e.target.value);
                                                                // Force re-render to update amounts
                                                                setRecalcTrigger(prev => prev + 1);
                                                            }}
                                                            placeholder="0.00"
                                                            className="w-32"
                                                            aria-label={`Precio por kilogramo para línea ${index + 1}`}
                                                        />
                                                    )}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    readOnly
                                                    className="w-32 bg-muted"
                                                    placeholder="0,00 €"
                                                    value={
                                                        (() => {
                                                            const detail = watchedPricesAndWeights?.[index] || watchedDetails?.[index];
                                                            const netWeight = parseFloat(detail?.netWeight) || 0;
                                                            const price = parseFloat(detail?.price) || 0;
                                                            return formatDecimalCurrency(netWeight * price);
                                                        })()
                                                    }
                                                    aria-label={`Importe para línea ${index + 1}`}
                                                    aria-readonly="true"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    {...register(`details.${index}.lot`)}
                                                    placeholder="Lote (opcional)"
                                                    className="w-48"
                                                    aria-label={`Lote para línea ${index + 1}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        remove(index);
                                                        announce(`Línea ${index + 1} eliminada`, 'polite');
                                                    }}
                                                    className="text-destructive hover:text-destructive"
                                                    aria-label={`Eliminar línea ${index + 1}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell className="text-right font-semibold">
                                            Total
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatDecimalWeight(linesTotals.totalKg)}
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                        <TableCell className="font-semibold">
                                            {formatDecimalCurrency(linesTotals.totalAmount)}
                                        </TableCell>
                                        <TableCell colSpan={2}></TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                append({
                                    product: null,
                                    netWeight: '',
                                    boxes: 1,
                                    price: '',
                                    lot: '',
                                });
                                const newIndex = fields.length;
                                announce(`Línea ${newIndex + 1} agregada`, 'polite');
                            }}
                            className="w-full"
                            aria-label="Agregar nueva línea de producto"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar línea
                        </Button>
                    </div>
                </div>
                )}

                {/* Pallets Section (solo para modo pallets) */}
                {creationMode === 'pallets' && (
                <div className="w-full">
                    {hasUsedBoxes && (
                        <Alert className="mb-4 border-orange-200 bg-orange-50">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertTitle className="text-orange-800">Modo de edición parcial</AlertTitle>
                            <AlertDescription className="text-orange-700">
                                Esta recepción tiene cajas siendo usadas en producción. Solo puedes editar las cajas disponibles (no usadas). 
                                Los totales por producto deben mantenerse exactamente iguales.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="flex justify-end items-center mb-2">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsSummaryDialogOpen(true);
                                }}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Ver Resumen
                            </Button>
                            {temporalPallets.length > 0 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAllPalletsLabelDialogOpen(true);
                                    }}
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimir Todas las Etiquetas
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setSelectedPalletId('new');
                                    setEditingPalletIndex(null);
                                    setIsPalletDialogOpen(true);
                                }}
                                aria-label="Agregar nuevo palet"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Agregar Palet
                            </Button>
                        </div>
                    </div>

                    {temporalPallets.length === 0 ? (
                        <Card>
                            <CardContent className="py-8">
                                <EmptyState
                                    title="No hay palets agregados"
                                    description="Haz clic en 'Agregar Palet' para crear el primer palet de esta recepción"
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <VirtualizedTable
                            items={palletsDisplayData}
                            headers={[
                                { label: '#', className: '' },
                                { label: 'Observaciones', className: '' },
                                { label: 'Cajas', className: '' },
                                { label: 'Peso Neto', className: '' },
                                { label: 'Producto - Lote / Precio (€/kg)', className: '' },
                                { label: 'Acciones', className: 'w-[120px]' },
                            ]}
                            threshold={50}
                            rowHeight={80}
                            renderRow={(displayItem, index) => {
                                const { item, pallet, productLotCombinations } = displayItem;
                                const prices = item.prices || {};
                                
                                return (
                                    <>
                                        <TableCell className="font-medium">
                                            {pallet.id ? `#${pallet.id}` : `Nuevo ${index + 1}`}
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                            <div className="text-sm">
                                                {item.observations || (
                                                    <span className="text-muted-foreground italic">Sin observaciones</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{pallet.numberOfBoxes || pallet.boxes?.length || 0}</TableCell>
                                        <TableCell>{formatDecimalWeight(pallet.netWeight || 0)}</TableCell>
                                        <TableCell>
                                            <div className="space-y-2">
                                                {productLotCombinations.length === 0 ? (
                                                    <span className="text-sm text-muted-foreground">No hay productos</span>
                                                ) : (
                                                    productLotCombinations.map((combo, comboIdx) => {
                                                        const priceKey = `${combo.productId}-${combo.lot}`;
                                                        const currentPrice = prices[priceKey] || '';
                                                        
                                                        return (
                                                            <div key={comboIdx} className="flex items-center gap-3 py-1 border-b last:border-0">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium text-sm">{combo.productName}</span>
                                                                        <span className="text-xs text-muted-foreground font-mono">({combo.lot})</span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {combo.boxesCount} cajas · {formatDecimalWeight(combo.totalNetWeight)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={currentPrice}
                                                                    onChange={(e) => {
                                                                        const newPrice = e.target.value;
                                                                        // Update price in current pallet first
                                                                        setTemporalPallets(prev => {
                                                                            const updated = [...prev];
                                                                            if (!updated[index].prices) {
                                                                                updated[index].prices = {};
                                                                            }
                                                                            updated[index].prices = {
                                                                                ...updated[index].prices,
                                                                                [priceKey]: newPrice
                                                                            };
                                                                            return updated;
                                                                        });
                                                                        // Then synchronize to other pallets using optimized hook (O(n) instead of O(n²))
                                                                        updatePrice(priceKey, newPrice);
                                                                        announce(`Precio actualizado para ${combo.productName}`, 'polite');
                                                                    }}
                                                                    placeholder="0.00"
                                                                    className="w-28 h-8"
                                                                    aria-label={`Precio para ${combo.productName}, lote ${combo.lot}`}
                                                                />
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        setSelectedPalletId('new');
                                                        setEditingPalletIndex(index);
                                                        setPalletMetadata({ prices: item.prices || {}, observations: item.observations || '' });
                                                        setIsPalletDialogOpen(true);
                                                    }}
                                                    aria-label={`Editar palet ${pallet.id || index + 1}`}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {pallet.id && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={async () => {
                                                            try {
                                                                if (!session?.user?.accessToken) {
                                                                    notify.error({ title: 'No hay sesión autenticada' });
                                                                    return;
                                                                }
                                                                const fullPallet = await getPallet(pallet.id, session.user.accessToken);
                                                                setSelectedPalletForLabel(fullPallet);
                                                                setIsPalletLabelDialogOpen(true);
                                                            } catch (error) {
                                                                logReceptionError(error, 'loadPallet', { palletId: pallet.id });
                                                                notify.error({ title: formatReceptionError(error, 'loadPallet') });
                                                            }
                                                        }}
                                                        title="Ver etiqueta del palet"
                                                        aria-label={`Imprimir etiqueta del palet ${pallet.id}`}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => {
                                                        setTemporalPallets(prev => prev.filter((_, i) => i !== index));
                                                        announce(`Palet ${pallet.id || index + 1} eliminado`, 'polite');
                                                    }}
                                                    aria-label={`Eliminar palet ${pallet.id || index + 1}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </>
                                );
                            }}
                        />
                    )}
                </div>
                )}
            </form>

            {/* PalletDialog for creating/editing palets */}
            {creationMode === 'pallets' && (
            <PalletDialog
                palletId={selectedPalletId}
                isOpen={isPalletDialogOpen}
                initialPallet={editingPalletIndex !== null ? temporalPallets[editingPalletIndex]?.pallet : null}
                onSaveTemporal={(pallet) => {
                    if (editingPalletIndex !== null) {
                        setTemporalPallets(prev => {
                            const updated = [...prev];
                            const existingPallet = updated[editingPalletIndex].pallet;
                            
                            // Preservar el ID del palet original si el nuevo no lo tiene
                            const palletWithId = pallet.id 
                                ? pallet 
                                : (existingPallet?.id ? { ...pallet, id: existingPallet.id } : pallet);
                            
                            // Preservar IDs de cajas y su información de disponibilidad
                            const boxesWithIds = palletWithId.boxes?.map((box) => {
                                // Si la caja ya tiene ID, buscar la caja original para preservar isAvailable y production
                                if (box.id) {
                                    const originalBox = existingPallet?.boxes?.find(b => b.id === box.id);
                                    if (originalBox) {
                                        // Preservar isAvailable y production de la caja original
                                        return {
                                            ...box,
                                            isAvailable: originalBox.isAvailable !== false,
                                            production: originalBox.production || null,
                                        };
                                    }
                                    return box;
                                }
                                // Si no tiene ID, es una caja nueva
                                // Validar que no se puedan crear nuevas cajas cuando hay cajas usadas
                                if (hasUsedBoxes) {
                                    notify.error({ title: 'No se pueden crear nuevas cajas cuando hay cajas siendo usadas en producción' });
                                    return null; // Filtrar esta caja
                                }
                                return box;
                            }).filter(box => box !== null) || [];
                            
                            updated[editingPalletIndex] = {
                                pallet: {
                                    ...palletWithId,
                                    boxes: boxesWithIds,
                                    numberOfBoxes: boxesWithIds.length,
                                    netWeight: boxesWithIds.reduce((sum, box) => sum + (parseFloat(box.netWeight) || 0), 0),
                                },
                                prices: palletMetadata.prices || {},
                                observations: palletMetadata.observations || pallet.observations || '',
                            };
                            return updated;
                        });
                    } else {
                        // Validar que no se puedan crear nuevos palets con cajas nuevas cuando hay cajas usadas
                        if (hasUsedBoxes && pallet.boxes?.some(box => !box.id)) {
                            notify.error({ title: 'No se pueden crear nuevas cajas cuando hay cajas siendo usadas en producción' });
                            return;
                        }
                        
                        // Buscar precios existentes para productos-lotes del nuevo palet
                        setTemporalPallets(prev => {
                            // Extraer mapa de precios globales de los pallets existentes
                            const globalPriceMap = extractGlobalPriceMap(prev);
                            
                            // Construir objeto de precios para el nuevo palet basado en productos-lotes existentes
                            const newPalletPrices = {};
                            
                            // Para cada caja del nuevo palet, buscar si existe un precio para esa combinación producto-lote
                            (pallet.boxes || []).forEach(box => {
                                if (box.product?.id) {
                                    const priceKey = createPriceKey(box.product.id, box.lot);
                                    const existingPriceEntry = globalPriceMap.get(priceKey);
                                    
                                    // Si existe un precio para esta combinación producto-lote, usarlo
                                    if (existingPriceEntry && existingPriceEntry.price !== undefined && existingPriceEntry.price !== null) {
                                        // Convertir el precio a string para mantener consistencia con el formato
                                        newPalletPrices[priceKey] = existingPriceEntry.price.toString();
                                    }
                                }
                            });
                            
                            // Crear el nuevo palet con los precios encontrados automáticamente
                            const newPallet = {
                                pallet: pallet,
                                prices: newPalletPrices,
                                observations: pallet.observations || '',
                            };
                            
                            // Notificar al usuario si se establecieron precios automáticamente
                            if (Object.keys(newPalletPrices).length > 0) {
                                const priceCount = Object.keys(newPalletPrices).length;
                                announce(
                                    `Se han establecido ${priceCount} precio${priceCount > 1 ? 's' : ''} automáticamente para productos con lotes existentes`,
                                    'polite'
                                );
                            }
                            
                            return [...prev, newPallet];
                        });
                    }
                    setIsPalletDialogOpen(false);
                    setSelectedPalletId(null);
                    setEditingPalletIndex(null);
                    setPalletMetadata({ prices: {}, observations: '' });
                }}
                onChange={() => {}}
                onCloseDialog={() => {
                    setIsPalletDialogOpen(false);
                    setSelectedPalletId(null);
                    setEditingPalletIndex(null);
                }}
            />
            )}

            {/* PalletLabelDialog para ver/imprimir etiquetas de palets */}
            {creationMode === 'pallets' && (
                <PalletLabelDialog
                    isOpen={isPalletLabelDialogOpen}
                    onClose={() => {
                        setIsPalletLabelDialogOpen(false);
                        setSelectedPalletForLabel(null);
                    }}
                    pallet={selectedPalletForLabel}
                />
            )}

            {/* ReceptionSummaryDialog para ver resumen de productos y palets */}
            {creationMode === 'pallets' && (
                <ReceptionSummaryDialog
                    isOpen={isSummaryDialogOpen}
                    onClose={() => setIsSummaryDialogOpen(false)}
                    pallets={temporalPallets}
                    prices={(() => {
                        // Build prices array from temporalPallets (similar to handleUpdate)
                        const globalPriceMap = new Map();
                        temporalPallets.forEach((item) => {
                            const pallet = item.pallet;
                            const pricesObj = item.prices || {};
                            (pallet?.boxes || []).forEach(box => {
                                const lotIdentifier = box.lot || '';
                                if (box.product?.id && lotIdentifier !== undefined) {
                                    const key = `${box.product.id}-${lotIdentifier}`;
                                    const priceKey = `${box.product.id}-${lotIdentifier}`;
                                    const priceValue = pricesObj[priceKey];
                                    globalPriceMap.set(key, {
                                        product: { id: box.product.id },
                                        lot: lotIdentifier,
                                        price: priceValue ? parseFloat(priceValue) : undefined,
                                    });
                                }
                            });
                        });
                        return Array.from(globalPriceMap.values());
                    })()}
                    onPriceChange={(productId, lot, price) => {
                        // Sincronizar precio en todos los pallets que tengan esta combinación producto+lote
                        const priceKey = `${productId}-${lot || ''}`;
                        setTemporalPallets(prev => {
                            const updated = prev.map(item => {
                                // Verificar si este pallet tiene cajas con la misma combinación producto+lote
                                const hasMatchingCombination = item.pallet?.boxes?.some(box => {
                                    const boxKey = `${box.product?.id}-${box.lot || ''}`;
                                    return boxKey === priceKey;
                                });
                                
                                if (hasMatchingCombination) {
                                    return {
                                        ...item,
                                        prices: {
                                            ...(item.prices || {}),
                                            [priceKey]: price
                                        }
                                    };
                                }
                                return item;
                            });
                            return updated;
                        });
                    }}
                />
            )}

            {/* AllPalletsLabelDialog para imprimir todas las etiquetas juntas */}
            {creationMode === 'pallets' && (
                <AllPalletsLabelDialog
                    isOpen={isAllPalletsLabelDialogOpen}
                    onClose={() => setIsAllPalletsLabelDialogOpen(false)}
                    pallets={temporalPallets}
                />
            )}

            {/* ReceptionPrintDialog para imprimir la recepción */}
            <ReceptionPrintDialog
                isOpen={isPrintDialogOpen}
                onClose={() => setIsPrintDialogOpen(false)}
                receptionId={receptionId}
                supplier={(() => {
                    const supplierId = watch('supplier');
                    if (!supplierId) return null;
                    const supplier = supplierOptions.find(s => s.value === supplierId || s.id === supplierId);
                    return supplier || { name: supplierId };
                })()}
                date={watch('date')}
                notes={watch('notes')}
                details={(() => {
                    const formDetails = watch('details') || [];
                    return formDetails.map(detail => {
                        const productId = detail.product;
                        const product = productOptions.find(p => p.value === productId || p.id === productId);
                        return {
                            ...detail,
                            productName: product?.label || product?.name || product?.alias || `Producto ${productId}`
                        };
                    });
                })()}
                pallets={temporalPallets}
                creationMode={creationMode}
            />
        </div>
    );
};

export default EditReceptionForm;

