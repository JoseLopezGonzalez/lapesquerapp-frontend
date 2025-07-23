'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { GenericTable } from '@/components/Admin/Tables/GenericTable';
import { GenericFilters } from '@/components/Admin/Filters/GenericFilters/GenericFilters';
import { PaginationFooter } from '@/components/Admin/Tables/PaginationFooter';
import { Header } from '@/components/Admin/Tables/GenericTable/Header';
import { Body } from '@/components/Admin/Tables/GenericTable/Body';
import { Footer } from '@/components/Admin/Tables/GenericTable/Footer';
import { API_URL_V2 } from '@/configs/config';
import { ArrowDownTrayIcon, ChartPieIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { FaRegFilePdf } from "react-icons/fa";
import toast from 'react-hot-toast';
import { getToastTheme } from '@/customs/reactHotToast';
import { Button } from '@/components/ui/button';
import { EllipsisVertical } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CreateEntityClient from '@/components/EntityForms/CreateEntityClient';
import EditEntityClient from '@/components/EntityForms/EditEntityClient';

// Import new entityService functions
import { fetchEntities, deleteEntity, performAction, downloadFile } from '@/services/entityService';


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

// Helper function to handle nested paths
function getValueByPath(object, path) {
    return path?.split('.').reduce((acc, key) => acc?.[key] ?? 'N/A', object);
}

// Reusable filter formatting function
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
    const [data, setData] = useState(initialData);
    const [filters, setFilters] = useState([]);
    const [paginationMeta, setPaginationMeta] = useState(initialPaginationMeta);
    const [selectedRows, setSelectedRows] = useState([]);
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [modal, setModal] = useState({ open: false, mode: null, editId: null });

    const fetchData = useCallback(async (page, currentFilters) => {
        setData((prevData) => ({ ...prevData, loading: true }));
        const queryString = formatFilters(currentFilters);
        const perPage = config?.perPage || 12;
        const url = `${API_URL_V2}${config.endpoint}?${queryString}&page=${page}&perPage=${perPage}`;

        try {
            const result = await fetchEntities(url);

            const processedRows = result.data.map((row) => {
                const rowData = config.table.headers.reduce((acc, header) => {
                    acc[header.name] = header.path
                        ? getValueByPath(row, header.path)
                        : row[header.name] || 'N/A';
                    return acc;
                }, {});

                return {
                    ...rowData,
                    actions: {
                        view: {
                            label: 'Ver',
                            onClick: () => {
                                const viewUrl = config.viewRoute.replace(':id', row.id);
                                window.open(viewUrl, '_blank');
                            },
                        },
                        delete: {
                            label: 'Eliminar',
                            onClick: async () => handleDelete(row.id),
                        },
                    },
                };
            });

            setData({ loading: false, rows: processedRows });
            setPaginationMeta({
                currentPage: result.meta.current_page,
                totalPages: result.meta.last_page,
                totalItems: result.meta.total,
                perPage: result.meta.per_page,
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
                errorMessage = error.message;
            }
            toast.error(errorMessage, getToastTheme());
            setData((prevData) => ({ ...prevData, loading: false }));
        }
    }, [config.endpoint, config.perPage, config.table.headers, config.viewRoute]); // Added dependencies for useCallback


    // useEffect for initial data fetch and filter changes
    useEffect(() => {
        // Reset to page 1 when filters change
        setCurrentPage(1);
    }, [filters]);

    // useEffect for page changes
    useEffect(() => {
        fetchData(currentPage, filters);
    }, [currentPage, filters, fetchData]);


    const handlePageChange = (newPage) => {
        setCurrentPage(parseInt(newPage, 10));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) return;

        const deleteUrl = config.deleteEndpoint.replace(':id', id);

        try {
            await deleteEntity(`${API_URL_V2}${deleteUrl}`);
            toast.success('Elemento eliminado con éxito.');
            setData((prevData) => ({
                ...prevData,
                rows: prevData.rows.filter((item) => item.id !== id),
            }));
            setSelectedRows((prevSelected) => prevSelected.filter((rowId) => rowId !== id));
        } catch (error) {
            let errorMessage = 'Hubo un error al intentar eliminar el elemento.';
            if (error instanceof Response && error.status === 403) {
                errorMessage = 'No tienes permiso para eliminar este elemento.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        }
    };

    const handleSelectedRowsDelete = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar estos elementos?')) return;

        const deleteUrl = config.deleteEndpoint.includes(':id')
            ? config.deleteEndpoint.replace('/:id', '')
            : config.deleteEndpoint;

        try {
            await deleteEntity(`${API_URL_V2}${deleteUrl}`, { ids: selectedRows });
            toast.success('Elementos eliminados con éxito.');
            // Filter out deleted rows and reset selectedRows state after successful deletion
            setData((prevData) => ({
                ...prevData,
                rows: prevData.rows.filter((item) => !selectedRows.includes(item.id)),
            }));
            setSelectedRows([]);
        } catch (error) {
            let errorMessage = 'Hubo un error al intentar eliminar los elementos.';
            if (error instanceof Response && error.status === 403) {
                errorMessage = 'No tienes permiso para eliminar estos elementos.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
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
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        }
    };


    const handleExport = async (exportOption) => {
        const { endpoint, fileName, type, waitingMessage } = exportOption;
        const queryString = formatFilters(filters); // No need for paginationMeta in export query
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {type === 'pdf' ? (<FaRegFilePdf className="h-6 w-6 text-red-500" aria-hidden="true" />)
                    : type === 'excel' ? (<PiMicrosoftExcelLogoFill className="h-6 w-6 text-green-500" aria-hidden="true" />)
                        : null}
                {waitingMessage || 'Generando exportación...'}
            </span>
        ), getToastTheme());

        try {
            await downloadFile(url, fileName, type);
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    Exportación generada correctamente
                </span>
            ), { id: toastId });
        } catch (error) {
            let errorMessage = 'Error: ocurrió algo inesperado al generar la exportación.';
            if (error instanceof Response && error.status === 403) {
                errorMessage = 'No tienes permiso para generar esta exportación.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage, { id: toastId, });
        }
    };

    const handleReport = async (reportOption) => {
        const { endpoint, fileName, type, waitingMessage } = reportOption; // Added 'type' for consistency, though reports might typically be PDF
        const queryString = formatFilters(filters);
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {waitingMessage || 'Generando reporte...'}
            </span>
        ), getToastTheme());

        try {
            // Assuming reports are typically PDFs for now, adjust 'pdf' if your reports can be other types
            await downloadFile(url, fileName, type || 'pdf');
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    Reporte generado correctamente
                </span>
            ), { id: toastId });
        } catch (error) {
            let errorMessage = 'Error: ocurrió algo inesperado al generar el reporte.';
            if (error instanceof Response && error.status === 403) {
                errorMessage = 'No tienes permiso para generar este reporte.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage, { id: toastId, });
        }
    };

    const handleSelectedRowsExport = async (exportOption) => {
        const { endpoint, fileName, type, waitingMessage } = exportOption;
        const queryString = `ids[]=${selectedRows.join('&ids[]=')}`;
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {type === 'pdf' ? (<FaRegFilePdf className="h-6 w-6 text-red-500" aria-hidden="true" />)
                    : type === 'excel' ? (<PiMicrosoftExcelLogoFill className="h-6 w-6 text-green-500" aria-hidden="true" />)
                        : null}
                {waitingMessage || 'Generando exportación...'}
            </span>
        ), getToastTheme());

        try {
            await downloadFile(url, fileName, type);
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    Exportación generada correctamente
                </span>
            ), { id: toastId });
        } catch (error) {
            let errorMessage = 'Error: ocurrió algo inesperado al generar la exportación.';
            if (error instanceof Response && error.status === 403) {
                errorMessage = 'No tienes permiso para generar esta exportación.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage, { id: toastId, });
        }
    };

    const handleSelectedRowsReport = async (reportOption) => {
        const { endpoint, fileName, type, waitingMessage } = reportOption; // Added 'type' for consistency
        const queryString = `ids[]=${selectedRows.join('&ids[]=')}`;
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {waitingMessage || 'Generando reporte...'}
            </span>
        ), getToastTheme());

        try {
            await downloadFile(url, fileName, type || 'pdf'); // Assuming reports are PDFs
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    Reporte generado correctamente
                </span>
            ), { id: toastId });
        } catch (error) {
            let errorMessage = 'Error: ocurrió algo inesperado al generar el reporte.';
            if (error instanceof Response && error.status === 403) {
                errorMessage = 'No tienes permiso para generar este reporte.';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast.error(errorMessage, { id: toastId, });
        }
    };

    const handleOnSelectionChange = (selectedRows) => {
        setSelectedRows(selectedRows);
    }

    const headerData = {
        title: config.title,
        description: config.description,
    };

    // Handler para abrir modal de creación
    const handleOpenCreate = () => {
        setModal({ open: true, mode: 'create', editId: null });
    };
    // Handler para abrir modal de edición
    const handleOpenEdit = (id) => {
        console.log('id', id);
        setModal({ open: true, mode: 'edit', editId: id });
    };
    // Handler para cerrar modal y refrescar datos si es necesario
    const handleCloseModal = (shouldRefresh = false) => {
        setModal({ open: false, mode: null, editId: null });
        if (shouldRefresh) fetchData(currentPage, filters);
    };

    return (
        <div className='h-full w-full '>
            <GenericTable>
                <Header data={headerData}>
                    {selectedRows.length > 0 && (
                        <>
                            <Button
                                onClick={handleSelectedRowsDelete}
                                variant='destructive'
                            >
                                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                <span className='hidden xl:flex'>Eliminar</span>
                            </Button>

                            {/* Reports */}
                            <Dropdown backdrop="opaque">
                                <DropdownTrigger>
                                    <Button
                                        variant='outline'
                                    >
                                        <ChartPieIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Reportes</span>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                                    {config.reports?.map((reportOption) => (
                                        <DropdownItem
                                            key={reportOption.title}
                                            onClick={() => handleSelectedRowsReport(reportOption)}
                                        >
                                            {reportOption.title}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>

                            {/* Export */}
                            <Dropdown backdrop="opaque">
                                <DropdownTrigger>
                                    <Button
                                        variant='outline'
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Exportar</span>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                                    {config.exports?.map((exportOption) => (
                                        <DropdownItem
                                            key={exportOption.title}
                                            onClick={() => handleSelectedRowsExport(exportOption)}
                                            startContent={
                                                exportOption.type === 'excel'
                                                    ? <PiMicrosoftExcelLogoFill className="text-green-700 w-6 h-6" />
                                                    : <FaRegFilePdf className="text-red-800 w-5 h-5" />
                                            }
                                        >
                                            {exportOption.title}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>



                        </>
                    )}

                    {selectedRows.length === 0 && (
                        <>
                            {/* Reports */}
                            <Dropdown backdrop="opaque">
                                <DropdownTrigger>
                                    <Button
                                        variant='outline'
                                    >
                                        <ChartPieIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Reportes</span>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                                    {config.reports?.map((reportOption) => (
                                        <DropdownItem
                                            key={reportOption.title}
                                            onClick={() => handleReport(reportOption)}
                                        >
                                            {reportOption.title}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                            {/* Export */}
                            <Dropdown backdrop="opaque">
                                <DropdownTrigger>
                                    <Button
                                        variant='outline'
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Exportar</span>
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                                    {config.exports?.map((exportOption) => (
                                        <DropdownItem
                                            key={exportOption.title}
                                            onClick={() => handleExport(exportOption)}
                                            startContent={
                                                exportOption.type === 'excel'
                                                    ? <PiMicrosoftExcelLogoFill className="text-green-700 w-6 h-6" />
                                                    : <FaRegFilePdf className="text-red-800 w-5 h-5" />
                                            }
                                        >
                                            {exportOption.title}
                                        </DropdownItem>
                                    ))}
                                </DropdownMenu>
                            </Dropdown>
                        </>
                    )}
                    {config.actions?.length > 0 && (
                        <Dropdown backdrop="opaque">
                            <DropdownTrigger>
                                <Button variant="outline"
                                    size="icon"
                                >
                                    <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu variant="faded" aria-label="Dropdown de acciones globales">
                                {config.actions.map((action) => (
                                    <DropdownItem
                                        key={action.title}
                                        onClick={() => handleGlobalAction(action)}
                                    >
                                        {action.title}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    )}
                    <GenericFilters
                        data={{
                            configFiltersGroup: config.filtersGroup, // Pasa tanto `search` como `groups`
                            updateFilters: (updatedFilters) => setFilters(updatedFilters),
                        }}
                    />
                    {!config.hideCreateButton && (
                        <Button
                            onClick={handleOpenCreate}
                        >
                            <PlusIcon className="h-5 w-5" aria-hidden="true" />
                            Nuevo
                        </Button>
                    )}
                </Header>
                <Body
                    table={config.table}
                    data={data}
                    emptyState={config.emptyState}
                    isSelectable={true}
                    selectedRows={selectedRows}
                    onSelectionChange={handleOnSelectionChange}
                    // Nuevo: pasar handler de edición
                    onEdit={handleOpenEdit}
                />
                <Footer>
                    <div className='w-full pr-24 '>
                        <PaginationFooter meta={paginationMeta} currentPage={currentPage} onPageChange={handlePageChange} />
                    </div>
                </Footer>
            </GenericTable>
            {/* Modal de creación/edición */}
            <Dialog open={modal.open} onOpenChange={(open) => !open && handleCloseModal(false)}>
                <DialogContent className="max-w-5xl w-full">
                    {modal.mode === 'create' && (
                        <CreateEntityClient config={config} onSuccess={() => handleCloseModal(true)} onCancel={() => handleCloseModal(false)} />
                    )}
                    {modal.mode === 'edit' && modal.editId && (
                        <EditEntityClient config={config} id={modal.editId} onSuccess={() => handleCloseModal(true)} onCancel={() => handleCloseModal(false)} />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}