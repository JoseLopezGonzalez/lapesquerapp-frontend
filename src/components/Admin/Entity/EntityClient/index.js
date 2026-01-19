'use client';

import toast from 'react-hot-toast';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GenericFilters } from '@/components/Admin/Filters/GenericFilters/GenericFilters';
import { PaginationFooter } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityFooter/PaginationFooter';
import { ResultsSummary } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityFooter/ResultsSummary';
import { EntityFooter } from '@/components/Admin/Entity/EntityClient/EntityTable/EntityFooter';
import { API_URL_V2 } from '@/configs/config';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { FaRegFilePdf } from "react-icons/fa";
import { getToastTheme } from '@/customs/reactHotToast';
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
    const formattedFilters = filters.reduce((acc, filter) => {
        if (filter.type === 'dateRange' && filter.value) {
            if (filter.value.from) acc[`${filter.name}[start]`] = filter.value.from;
            if (filter.value.to) acc[`${filter.name}[end]`] = filter.value.to;
        } else if (filter.type === 'autocomplete' && filter.value) {
            acc[filter.name] = filter.value.map((item) => item.id);
        } else if (filter.value) {
            acc[filter.name] = filter.value;
        }
        return acc;
    }, {});

    const searchFilter = filters.find((filter) => filter.type === 'search');
    if (searchFilter?.value) {
        formattedFilters['search'] = searchFilter.value;
    }

    const queryParams = new URLSearchParams();

    Object.keys(formattedFilters).forEach((key) => {
        const value = formattedFilters[key];
        if (Array.isArray(value)) {
            value.forEach((item) => {
                queryParams.append(`${key}[]`, item);
            });
        } else {
            queryParams.append(key, value);
        }
    });

    return queryParams.toString();
};

const formatFiltersObject = (filters) => {
    const result = {};

    filters.forEach((filter) => {
        if (filter.type === 'autocomplete') {
            result[filter.name] = (filter.value || []).map((item) => item.id);
        } else if (filter.type === 'dateRange') {
            result[filter.name] = {
                start: filter.value?.from || null,
                end: filter.value?.to || null,
            };
        } else {
            result[filter.name] = filter.value;
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

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) return;

        const entityService = getEntityService(config.endpoint);
        if (!entityService) {
            toast.error('No se encontró el servicio para esta entidad.');
            return;
        }

        try {
            await entityService.delete(id);
            const successMessage = 'Elemento eliminado con éxito.';
            toast.success(successMessage);
            setData((prevData) => ({
                ...prevData,
                rows: prevData.rows.filter((item) => item.id !== id),
            }));
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
                errorMessage = error.userMessage || error.message;
            }
            toast.error(errorMessage);
        }
    }, [config.endpoint]);

    const fetchData = useCallback(async (page, currentFilters) => {
        setData((prevData) => ({ ...prevData, loading: true }));
        const entityService = getEntityService(config.endpoint);
        
        if (!entityService) {
            toast.error('No se encontró el servicio para esta entidad.');
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
                errorMessage = error.userMessage || error.message;
            }
            toast.error(errorMessage, getToastTheme());
            setData((prevData) => ({ ...prevData, loading: false }));
        }
    }, [config.endpoint, config.perPage, config.table.headers, config.viewRoute, handleDelete]);

    // Ref para rastrear los filtros anteriores y detectar cambios
    const prevFiltersRef = useRef(JSON.stringify(filters));
    const isInitialMount = useRef(true);

    // useEffect unificado para manejar cambios en filtros y página
    useEffect(() => {
        const currentFiltersString = JSON.stringify(filters);
        const filtersChanged = prevFiltersRef.current !== currentFiltersString;

        if (filtersChanged) {
            // Actualizar la ref de filtros anteriores
            prevFiltersRef.current = currentFiltersString;
            // Resetear a página 1 cuando cambian los filtros
            if (currentPage !== 1) {
                setCurrentPage(1);
            }
            // Hacer fetch con página 1 cuando cambian los filtros
            fetchData(1, filters);
        } else if (!isInitialMount.current) {
            // Si solo cambió la página (y no los filtros), hacer fetch con esa página
            fetchData(currentPage, filters);
        }

        // Marcar que ya no es el montaje inicial
        if (isInitialMount.current) {
            isInitialMount.current = false;
        }
    }, [currentPage, filters, fetchData]);


    const handlePageChange = (newPage) => {
        setCurrentPage(parseInt(newPage, 10));
    };

    const handleSelectedRowsDelete = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar estos elementos?')) return;

        const entityService = getEntityService(config.endpoint);
        if (!entityService) {
            toast.error('No se encontró el servicio para esta entidad.');
            return;
        }

        setIsDeleting(true);
        try {
            await entityService.deleteMultiple(selectedRows);
            const successMessage = 'Elementos eliminados con éxito.';
            toast.success(successMessage);
            // Filter out deleted rows and reset selectedRows state after successful deletion
            setData((prevData) => ({
                ...prevData,
                rows: prevData.rows.filter((item) => !selectedRows.includes(item.id)),
            }));
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
                errorMessage = error.userMessage || error.message;
            }
            toast.error(errorMessage);
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
            toast.success(action.successMessage || 'Acción completada con éxito');
            setSelectedRows([]); // Clear selection after global action
            // Optionally, re-fetch data to reflect changes
            fetchData(currentPage, filters);
        } catch (error) {
            let errorMessage = action.errorMessage || 'Hubo un error al ejecutar la acción.';
            if (error instanceof Response && error.status === 403) {
                errorMessage = 'No tienes permiso para realizar esta acción.';
            } else if (error instanceof Error) {
                // Si el error ya tiene userMessage (de fetchWithTenant), usarlo
                errorMessage = error.userMessage || error.message;
            }
            toast.error(errorMessage);
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
        const toastId = toast.loading(
            (t) => (
                <span className="flex gap-2 items-center justify-center">
                    {type === 'pdf' && <FaRegFilePdf className="h-6 w-6 text-red-500" />}
                    {type === 'excel' || type === 'xlsx' && <PiMicrosoftExcelLogoFill className="h-6 w-6 text-green-500" />}
                    {waitingMessage || 'Generando exportación...'}
                </span>
            ),
            getToastTheme()
        );

        try {
            await downloadFile(url, fileName, type);
            toast.success(
                <span className="flex gap-2 items-center justify-center">
                    Exportación generada correctamente
                </span>,
                { id: toastId }
            );
        } catch (error) {
            const errorMessage =
                error instanceof Response && error.status === 403
                    ? 'No tienes permiso para generar esta exportación.'
                    : error instanceof Error
                        ? (error.userMessage || error.message)
                        : 'Error: ocurrió algo inesperado al generar la exportación.';
            toast.error(errorMessage, { id: toastId });
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
        const toastId = toast.loading(
            (t) => (
                <span className="flex gap-2 items-center justify-center">
                    {waitingMessage || 'Generando reporte...'}
                </span>
            ),
            getToastTheme()
        );

        try {
            await downloadFile(url, fileName, type || 'pdf');
            toast.success(
                <span className="flex gap-2 items-center justify-center">
                    Reporte generado correctamente
                </span>,
                { id: toastId }
            );
        } catch (error) {
            const errorMessage =
                error instanceof Response && error.status === 403
                    ? 'No tienes permiso para generar este reporte.'
                    : error instanceof Error
                        ? (error.userMessage || error.message)
                        : 'Error: ocurrió algo inesperado al generar el reporte.';
            toast.error(errorMessage, { id: toastId });
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
        if (shouldRefresh) fetchData(currentPage, filters);
    };

    // Handler para recargar datos con filtros actuales
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchData(currentPage, filters);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Preparar columns y rows para EntityTable
    const columns = generateColumns2(config.table.headers, { 
      onEdit: handleOpenEdit, 
      onView: handleOpenView,
      config: config 
    });
    const rows = data.rows;

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
                        data={{ loading: data.loading, rows }}
                        columns={columns}
                        loading={data.loading}
                        emptyState={config.emptyState || { title: '', description: '' }}
                        isSelectable={true}
                        selectedRows={selectedRows}
                        onSelectionChange={handleOnSelectionChange}
                        onEdit={handleOpenEdit}
                        isBlocked={isRefreshing || isDeleting || isGeneratingReport || isExporting}
                    />
                </div>
                <EntityFooter>
                    <div className='w-full flex justify-between items-center py-2'>
                        <ResultsSummary
                            totalItems={paginationMeta.totalItems}
                            selectedCount={selectedRows.length}
                            loading={data.loading}
                        />
                        <PaginationFooter meta={paginationMeta} currentPage={currentPage} onPageChange={handlePageChange} />
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