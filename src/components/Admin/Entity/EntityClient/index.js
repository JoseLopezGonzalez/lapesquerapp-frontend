'use client';import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUsersList } from '@/hooks/useUsersList';
import { useSessionsList } from '@/hooks/useSessionsList';
import { useTransportsList } from '@/hooks/useTransportsList';
import { useIncotermsList } from '@/hooks/useIncotermsList';
import { useSalespeopleList } from '@/hooks/useSalespeopleList';
import { useCustomersList } from '@/hooks/useCustomersList';
import { useSuppliersList } from '@/hooks/useSuppliersList';
import { usePaymentTermsList } from '@/hooks/usePaymentTermsList';
import { useCountriesList } from '@/hooks/useCountriesList';
import { GenericFilters } from '@/components/Admin/Filters/GenericFilters/GenericFilters';
import { PaginationFooter } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityFooter/PaginationFooter';
import { ResultsSummary } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityFooter/ResultsSummary';
import { EntityFooter } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityFooter';
import { API_URL_V2 } from '@/configs/config';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { FaRegFilePdf } from "react-icons/fa";import { notify } from '@/lib/notifications';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// Utilidades genéricas para acciones y descargas (no específicas de entidades)
import { performAction, downloadFile } from '@/lib/api/apiActions';
import { getEntityService } from '@/services/domain/entityServiceMapper';
import { getErrorMessage } from '@/lib/api/apiHelpers';
import { EntityBody } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityBody';
import { generateColumns2 } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityBody/generateColumns';
import { mapEntityRows } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityBody/utils/mapEntityRows';
import { EntityTableHeader } from './EntityTable/EntityHeader';
import { EntityTable } from './EntityTable';
import CreateEntityForm from '@/components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm';
import EditEntityForm from '@/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm';
import { extractRequiredRelations } from '@/lib/entity/entityRelationsHelper';
import { addFiltersToParams } from '@/lib/entity/filtersHelper';

const initialData = {
    loading: true,
    rows: [],
};

const initialPaginationMeta = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 12,
};

const formatFilters = (filters) => {
    // Convertir el array de filtros con formato {name, value, type} a un objeto plano
    const filtersObject = formatFiltersObject(filters);
    
    // Usar el helper para agregar todos los filtros al URLSearchParams
    const queryParams = new URLSearchParams();
    addFiltersToParams(queryParams, filtersObject);
    
    return queryParams.toString();
};

const formatFiltersObject = (filters) => {
    const result = {};

    filters.forEach((filter) => {
        // Saltar filtros vacíos
        if (!filter || !filter.name) {
            return;
        }

        // Manejar diferentes tipos de filtros
        if (filter.type === 'autocomplete') {
            // Para autocomplete, el valor es un array de objetos con id
            if (filter.value && Array.isArray(filter.value) && filter.value.length > 0) {
                result[filter.name] = filter.value.map((item) => 
                    item && typeof item === 'object' && 'id' in item ? item.id : item
                );
            }
        } else if (filter.type === 'dateRange') {
            // Para dateRange, convertir from/to a start/end
            if (filter.value && (filter.value.from || filter.value.to)) {
                result[filter.name] = {
                    start: filter.value?.from || null,
                    end: filter.value?.to || null,
                };
            }
        } else if (filter.type === 'textAccumulator') {
            // Para textAccumulator, el valor es un array de strings/numbers
            if (filter.value && Array.isArray(filter.value) && filter.value.length > 0) {
                result[filter.name] = filter.value;
            }
        } else if (filter.type === 'search') {
            // Para search, el valor es un string
            if (filter.value && typeof filter.value === 'string' && filter.value.trim().length > 0) {
                result[filter.name] = filter.value.trim();
            }
        } else {
            // Para otros tipos (text, textarea, number, etc.), usar el valor directamente
            // Solo agregar si el valor no está vacío
            if (filter.value !== null && filter.value !== undefined && filter.value !== '') {
                if (typeof filter.value === 'string' && filter.value.trim().length === 0) {
                    return; // Saltar strings vacíos
                }
                result[filter.name] = filter.value;
            }
        }
    });

    return result;
};

export default function EntityClient({ config }) {
    const router = useRouter();
    const [data, setData] = useState(initialData);
    const [filters, setFilters] = useState([]);
    const [paginationMeta, setPaginationMeta] = useState(initialPaginationMeta);
    const [selectedRows, setSelectedRows] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [modal, setModal] = useState({ open: false, mode: null, editId: null });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const perPage = config?.perPage || 12;
    const filtersObject = useMemo(() => {
        const obj = formatFiltersObject(filters);
        const requiredRelations = extractRequiredRelations(config.table?.headers || []);
        if (requiredRelations.length > 0) obj._requiredRelations = requiredRelations;
        return obj;
    }, [filters, config.table?.headers]);

    const usersListResult = useUsersList({
        filters: filtersObject,
        page: currentPage,
        perPage,
        enabled: config.endpoint === 'users',
    });
    const sessionsListResult = useSessionsList({
        filters: filtersObject,
        page: currentPage,
        perPage,
        enabled: config.endpoint === 'sessions',
    });
    const transportsListResult = useTransportsList({
        filters: filtersObject,
        page: currentPage,
        perPage,
        enabled: config.endpoint === 'transports',
    });
    const incotermsListResult = useIncotermsList({
        filters: filtersObject,
        page: currentPage,
        perPage,
        enabled: config.endpoint === 'incoterms',
    });
    const salespeopleListResult = useSalespeopleList({
        filters: filtersObject,
        page: currentPage,
        perPage,
        enabled: config.endpoint === 'salespeople',
    });
    const customersListResult = useCustomersList({
        filters: filtersObject,
        page: currentPage,
        perPage,
        enabled: config.endpoint === 'customers',
    });
    const suppliersListResult = useSuppliersList({
        filters: filtersObject,
        page: currentPage,
        perPage,
        enabled: config.endpoint === 'suppliers',
    });
    const paymentTermsListResult = usePaymentTermsList({
        filters: filtersObject,
        page: currentPage,
        perPage,
        enabled: config.endpoint === 'payment-terms',
    });
    const countriesListResult = useCountriesList({
        filters: filtersObject,
        page: currentPage,
        perPage,
        enabled: config.endpoint === 'countries',
    });

    const isUsersOrSessions = config.endpoint === 'users' || config.endpoint === 'sessions';
    const isCatalogBlock = config.endpoint === 'transports' || config.endpoint === 'incoterms' || config.endpoint === 'salespeople';
    const isBlock5Clients = config.endpoint === 'customers' || config.endpoint === 'payment-terms' || config.endpoint === 'countries';
    const isBlock6Suppliers = config.endpoint === 'suppliers';
    const isQueryDriven = isUsersOrSessions || isCatalogBlock || isBlock5Clients || isBlock6Suppliers;
    const queryResult = config.endpoint === 'users' ? usersListResult : config.endpoint === 'sessions' ? sessionsListResult : config.endpoint === 'transports' ? transportsListResult : config.endpoint === 'incoterms' ? incotermsListResult : config.endpoint === 'salespeople' ? salespeopleListResult : config.endpoint === 'customers' ? customersListResult : config.endpoint === 'suppliers' ? suppliersListResult : config.endpoint === 'payment-terms' ? paymentTermsListResult : config.endpoint === 'countries' ? countriesListResult : null;

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) return;

        const entityService = getEntityService(config.endpoint);
        if (!entityService) {
            notify.error({ title: 'No se encontró el servicio para esta entidad.' });
            return;
        }

        try {
            await entityService.delete(id);
            const successMessage = 'Elemento eliminado con éxito.';
            notify.success({ title: successMessage });
            if (isQueryDriven && queryResult?.refetch) {
                queryResult.refetch();
            } else {
                setData((prevData) => ({
                    ...prevData,
                    rows: prevData.rows.filter((item) => item.id !== id),
                }));
            }
            setSelectedRows((prevSelected) => prevSelected.filter((rowId) => rowId !== id));
        } catch (error) {
            let errorMessage = 'Hubo un error al intentar eliminar el elemento.';
            if (error instanceof Response) {
                try {
                    const errorData = await error.json();
                    errorMessage = getErrorMessage(errorData) || errorMessage;
                } catch (jsonError) {
                    if (error.status === 403) {
                        errorMessage = 'No tienes permiso para eliminar este elemento.';
                    }
                }
            } else if (error instanceof Error) {
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error desconocido';
            }
            notify.error({ title: errorMessage });
        }
    }, [config.endpoint, isQueryDriven, queryResult?.refetch]);

    const dataForTable = useMemo(() => {
        if (!isQueryDriven || !queryResult) return data;
        const processedRows = mapEntityRows(queryResult.data, config.table?.headers || [], handleDelete, config);
        return { loading: queryResult.isLoading, rows: processedRows };
    }, [isQueryDriven, queryResult?.data, queryResult?.isLoading, data, config.table?.headers, handleDelete, config]);

    const paginationMetaForTable = useMemo(() => {
        if (!isQueryDriven || !queryResult) return paginationMeta;
        return {
            currentPage: queryResult.meta.current_page,
            totalPages: queryResult.meta.last_page,
            totalItems: queryResult.meta.total,
            perPage: queryResult.meta.per_page,
        };
    }, [isQueryDriven, queryResult?.meta, paginationMeta]);

    useEffect(() => {
        if (queryResult?.error) {
            notify.error({ title: queryResult.error });
        }
    }, [queryResult?.error]);

    useEffect(() => {
        if (!isQueryDriven || !queryResult?.meta) return;
        const validPage = queryResult.meta.current_page;
        if (validPage !== currentPage) setCurrentPage(validPage);
    }, [isQueryDriven, queryResult?.meta?.current_page, currentPage]);

    const fetchData = useCallback(async (page, currentFilters) => {
        setData((prevData) => ({ ...prevData, loading: true }));
        const entityService = getEntityService(config.endpoint);
        
        if (!entityService) {
            notify.error({ title: 'No se encontró el servicio para esta entidad.' });
            setData((prevData) => ({ ...prevData, loading: false }));
            return;
        }

        const perPage = config?.perPage || 12;
        const filtersObject = formatFiltersObject(currentFilters);

        // Detectar relaciones necesarias desde los headers de la tabla
        const requiredRelations = extractRequiredRelations(config.table?.headers || []);
        
        // Agregar relaciones a los filtros si existen
        if (requiredRelations.length > 0) {
            filtersObject._requiredRelations = requiredRelations;
        }

        try {
            const result = await entityService.list(filtersObject, { page, perPage });

            // Usar el helper para procesar los datos
            const processedRows = mapEntityRows(result.data, config.table.headers, handleDelete, config);

            const apiCurrentPage = result.meta?.current_page || page;
            const apiTotalPages = result.meta?.last_page || 1;

            // Validar que la página devuelta por la API sea válida
            // Si la página solicitada es mayor que el total de páginas, ajustar a la última página disponible
            const validPage = apiCurrentPage > apiTotalPages && apiTotalPages > 0 
                ? apiTotalPages 
                : (apiTotalPages > 0 ? apiCurrentPage : 1);

            // Si la página actual no coincide con la válida, actualizar el estado
            if (validPage !== currentPage) {
                setCurrentPage(validPage);
            }

            setData({ loading: false, rows: processedRows });
            setPaginationMeta({
                currentPage: validPage,
                totalPages: apiTotalPages,
                totalItems: result.meta?.total || 0,
                perPage: result.meta?.per_page || perPage,
            });
        } catch (error) {
            let errorMessage = 'Error al cargar los datos.';
            if (error instanceof Response) {
                if (error.status === 401) {
                    errorMessage = 'No estás autenticado. Por favor, inicia sesión.';
                } else if (error.status === 403) {
                    errorMessage = 'No tienes permiso para acceder a esta ruta.';
                } else {
                    errorMessage = `Error: ${error.statusText}`;
                }
            } else if (error instanceof Error) {
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error desconocido';
            }
            notify.error({ title: errorMessage });
            setData((prevData) => ({ ...prevData, loading: false }));
        }
    }, [config.endpoint, config.perPage, config.table.headers, config.viewRoute, handleDelete]);

    // Ref para rastrear los filtros anteriores y detectar cambios
    const prevFiltersRef = useRef(JSON.stringify(filters));
    const isInitialMount = useRef(true);
    const isLoadingRef = useRef(false);
    const prevPageRef = useRef(currentPage);
    const prevEndpointRef = useRef(config.endpoint);
    const fetchDataRef = useRef(fetchData);

    // Mantener fetchDataRef actualizado sin causar re-renders
    useEffect(() => {
        fetchDataRef.current = fetchData;
    }, [fetchData]);

    // useEffect unificado para manejar cambios en filtros y página (no usado para users/sessions; usan React Query)
    useEffect(() => {
        if (config.endpoint === 'users' || config.endpoint === 'sessions' || config.endpoint === 'transports' || config.endpoint === 'incoterms' || config.endpoint === 'salespeople' || config.endpoint === 'customers' || config.endpoint === 'suppliers' || config.endpoint === 'payment-terms' || config.endpoint === 'countries') return;
        // Prevenir llamadas múltiples simultáneas
        if (isLoadingRef.current) {
            return;
        }

        const currentFiltersString = JSON.stringify(filters);
        const filtersChanged = prevFiltersRef.current !== currentFiltersString;
        const pageChanged = prevPageRef.current !== currentPage;
        const endpointChanged = prevEndpointRef.current !== config.endpoint;

        // Si cambió el endpoint, resetear todo
        if (endpointChanged) {
            prevEndpointRef.current = config.endpoint;
            prevFiltersRef.current = currentFiltersString;
            prevPageRef.current = currentPage;
            isInitialMount.current = true;
        }

        if (isInitialMount.current) {
            // En el montaje inicial, siempre hacer fetch
            isInitialMount.current = false;
            prevFiltersRef.current = currentFiltersString;
            prevPageRef.current = currentPage;
            isLoadingRef.current = true;
            fetchDataRef.current(currentPage, filters).finally(() => {
                isLoadingRef.current = false;
            });
        } else if (filtersChanged) {
            // Actualizar la ref de filtros anteriores
            prevFiltersRef.current = currentFiltersString;
            // Resetear a página 1 cuando cambian los filtros
            if (currentPage !== 1) {
                prevPageRef.current = 1;
                setCurrentPage(1);
                // No hacer fetch aquí, el cambio de currentPage disparará otro useEffect
                return;
            }
            // Hacer fetch con página 1 cuando cambian los filtros
            isLoadingRef.current = true;
            fetchDataRef.current(1, filters).finally(() => {
                isLoadingRef.current = false;
            });
        } else if (pageChanged) {
            // Si solo cambió la página (y no los filtros), hacer fetch con esa página
            prevPageRef.current = currentPage;
            isLoadingRef.current = true;
            fetchDataRef.current(currentPage, filters).finally(() => {
                isLoadingRef.current = false;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filters, config.endpoint]); // Remover fetchData de dependencias para evitar loops


    const handlePageChange = (newPage) => {
        setCurrentPage(parseInt(newPage, 10));
    };

    const handleSelectedRowsDelete = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar estos elementos?')) return;

        const entityService = getEntityService(config.endpoint);
        if (!entityService) {
            notify.error({ title: 'No se encontró el servicio para esta entidad.' });
            return;
        }

        setIsDeleting(true);
        try {
            await entityService.deleteMultiple(selectedRows);
            const successMessage = 'Elementos eliminados con éxito.';
            notify.success({ title: successMessage });
            if (isQueryDriven && queryResult?.refetch) {
                queryResult.refetch();
            } else {
                setData((prevData) => ({
                    ...prevData,
                    rows: prevData.rows.filter((item) => !selectedRows.includes(item.id)),
                }));
            }
            setSelectedRows([]);
        } catch (error) {
            let errorMessage = 'Hubo un error al intentar eliminar los elementos.';
            if (error instanceof Response) {
                try {
                    const errorData = await error.json();
                    errorMessage = getErrorMessage(errorData) || errorMessage;
                } catch (jsonError) {
                    if (error.status === 403) {
                        errorMessage = 'No tienes permiso para eliminar estos elementos.';
                    } else if (error.status === 400) {
                        errorMessage = 'No se han proporcionado IDs válidos.';
                    }
                }
            } else if (error instanceof Error) {
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error desconocido';
            }
            notify.error({ title: errorMessage });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleGlobalAction = async (action) => {
        const applyTo =
            selectedRows.length > 0 ? 'selected' :
                filters.length > 0 ? 'filtered' : 'all';

        if (action.confirmation && !window.confirm(action.confirmation)) return;

        let body = { ...(action.body || {}) };

        if (applyTo === 'selected') {
            body.ids = selectedRows;
        } else if (applyTo === 'filtered') {
            body.filters = formatFiltersObject(filters);
        } else {
            body.applyToAll = true;
        }

        try {
            await performAction(`${API_URL_V2}${action.endpoint}`, action.method || 'POST', body);
            notify.success({ title: action.successMessage || 'Acción completada con éxito' });
            setSelectedRows([]); // Clear selection after global action
            // Optionally, re-fetch data to reflect changes
            fetchData(currentPage, filters);
        } catch (error) {
            let errorMessage = action.errorMessage || 'Hubo un error al ejecutar la acción.';
            if (error instanceof Response && error.status === 403) {
                errorMessage = 'No tienes permiso para realizar esta acción.';
            } else if (error instanceof Error) {
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                errorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error desconocido';
            }
            notify.error({ title: errorMessage });
        }
    };

    const handleExport = async (exportOption) => {
        const { endpoint, fileName, type, waitingMessage } = exportOption;
        const hasSelectedRows = selectedRows?.length > 0;
        const queryString = hasSelectedRows
            ? `ids[]=${selectedRows.join('&ids[]=')}`
            : formatFilters(filters);
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        setIsExporting(true);
        try {
            await notify.promise(downloadFile(url, fileName, type), {
                loading: waitingMessage || 'Generando exportación...',
                success: 'Exportación generada correctamente',
                error: (error) =>
                    error instanceof Response && error.status === 403
                        ? 'No tienes permiso para generar esta exportación.'
                        : error instanceof Error
                            ? (error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error desconocido')
                            : 'Error: ocurrió algo inesperado al generar la exportación.',
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleReport = async (reportOption) => {
        const { endpoint, fileName, type, waitingMessage } = reportOption;
        const hasSelectedRows = selectedRows?.length > 0;
        const queryString = hasSelectedRows
            ? `ids[]=${selectedRows.join('&ids[]=')}`
            : formatFilters(filters);
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        setIsGeneratingReport(true);
        try {
            await notify.promise(downloadFile(url, fileName, type || 'pdf'), {
                loading: waitingMessage || 'Generando reporte...',
                success: 'Reporte generado correctamente',
                error: (error) =>
                    error instanceof Response && error.status === 403
                        ? 'No tienes permiso para generar este reporte.'
                        : error instanceof Error
                            ? (error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || 'Error desconocido')
                            : 'Error: ocurrió algo inesperado al generar el reporte.',
            });
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleOnSelectionChange = (selectedRows) => {
        setSelectedRows(selectedRows);
    }

    // Handler para abrir modal de creación
    const handleOpenCreate = () => {
        if (config.createRedirect) {
            window.open(config.createRedirect, '_blank');
        } else {
            setModal({ open: true, mode: 'create', editId: null });
        }
    };
    // Handler para abrir modal de edición
    const handleOpenEdit = (id) => {
        if (config.editRedirect) {
            const editUrl = config.editRedirect.replace(':id', id);
            window.open(editUrl, '_blank');
        } else {
        setModal({ open: true, mode: 'edit', editId: id });
        }
    };

    // Handler para navegar a la vista de detalles
    const handleOpenView = (id) => {
        if (config.viewRoute) {
            const viewUrl = config.viewRoute.replace(':id', id);
            window.open(viewUrl, '_blank');
        }
    };

    // Handler para cerrar modal y refrescar datos si es necesario
    const handleCloseModal = (shouldRefresh = false) => {
        setModal({ open: false, mode: null, editId: null });
        if (shouldRefresh) {
            if (isQueryDriven && queryResult?.refetch) queryResult.refetch();
            else fetchData(currentPage, filters);
        }
    };

    // Handler para recargar datos con filtros actuales
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            if (isQueryDriven && queryResult?.refetch) await queryResult.refetch();
            else await fetchData(currentPage, filters);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Reenviar invitación (solo usuarios)
    const handleResendInvitation = useCallback(async (id) => {
        const entityService = getEntityService(config.endpoint);
        if (!entityService?.resendInvitation) return;
        try {
            await entityService.resendInvitation(id);
            notify.success({ title: 'Se ha enviado un enlace de acceso al correo del usuario.' });
            if (queryResult?.refetch) queryResult.refetch();
            else fetchData(currentPage, filters);
        } catch (err) {
            const errorMessage = err?.data?.userMessage || err?.message || 'Error al reenviar la invitación.';
            notify.error({ title: errorMessage });
        }
    }, [config.endpoint, currentPage, filters, queryResult?.refetch]);

    // Preparar columns y rows para EntityTable
    const columns = generateColumns2(config.table.headers, { 
      onEdit: handleOpenEdit, 
      onView: handleOpenView,
      onResendInvitation: config.endpoint === 'users' ? handleResendInvitation : undefined,
      config: config 
    });
    const rows = dataForTable.rows;

    const actions = config.actions?.map(action => ({
        ...action,
        onClick: () => handleGlobalAction(action)
    }))

    return (
        <div className='h-full w-full overflow-hidden'>
            <EntityTable>
                <EntityTableHeader
                    title={config.title}
                    description={config.description}
                    onCreate={!config.hideCreateButton ? handleOpenCreate : undefined}
                    filtersComponent={
                        config.filtersGroup && (
                            <GenericFilters
                                data={{
                                    configFiltersGroup: config.filtersGroup,
                                    updateFilters: (updatedFilters) => setFilters(updatedFilters),
                                }}
                            />
                        )
                    }
                    exports={config.exports}
                    reports={config.reports}
                    selectedRows={selectedRows}
                    onSelectedRowsDelete={handleSelectedRowsDelete}
                    onExport={handleExport}
                    onReport={handleReport}
                    onRefresh={handleRefresh}
                    actions={actions}
                    isRefreshing={isRefreshing}
                    isDeleting={isDeleting}
                    isGeneratingReport={isGeneratingReport}
                    isExporting={isExporting}
                />
                <div className="flex-1 overflow-y-auto min-h-0">
                    <EntityBody
                        data={{ loading: dataForTable.loading, rows }}
                        columns={columns}
                        headers={config.table?.headers || []}
                        loading={dataForTable.loading}
                        emptyState={config.emptyState || { title: '', description: '' }}
                        isSelectable={true}
                        selectedRows={selectedRows}
                        onSelectionChange={handleOnSelectionChange}
                        onEdit={handleOpenEdit}
                        onView={handleOpenView}
                        isBlocked={isRefreshing || isDeleting || isGeneratingReport || isExporting}
                        config={config}
                    />
                </div>
                <EntityFooter>
                    <div className='w-full flex justify-between items-center py-2'>
                        <ResultsSummary
                            totalItems={paginationMetaForTable.totalItems}
                            selectedCount={selectedRows.length}
                            loading={dataForTable.loading}
                        />
                        <PaginationFooter meta={paginationMetaForTable} currentPage={currentPage} onPageChange={handlePageChange} />
                    </div>
                </EntityFooter>
            </EntityTable>
            {/* Modal de creación/edición */}
            <Dialog open={modal.open} onOpenChange={(open) => !open && handleCloseModal(false)}>
                <DialogContent className="max-w-5xl w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {modal.mode === 'create' ? `Crear ${config.title}` : `Editar ${config.title}`}
                        </DialogTitle>
                        <DialogDescription>
                            {modal.mode === 'create' ? 'Completa el formulario para crear un nuevo elemento.' : 'Modifica los campos necesarios y guarda los cambios.'}
                        </DialogDescription>
                    </DialogHeader>
                    {modal.mode === 'create' && (
                        <CreateEntityForm title="Crear" config={config} onSuccess={() => handleCloseModal(true)} onCancel={() => handleCloseModal(false)} />
                    )}
                    {modal.mode === 'edit' && modal.editId && (
                        <EditEntityForm title="Editar" config={config} id={modal.editId} onSuccess={() => handleCloseModal(true)} onCancel={() => handleCloseModal(false)} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}