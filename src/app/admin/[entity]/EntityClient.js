'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { GenericTable } from '@/components/Admin/Tables/GenericTable';
import { GenericFilters } from '@/components/Admin/Filters/GenericFilters/GenericFilters';
import { Pagination } from '@/components/Admin/Tables/Pagination';
import { Header } from '@/components/Admin/Tables/GenericTable/Header';
import { Body } from '@/components/Admin/Tables/GenericTable/Body';
import { Footer } from '@/components/Admin/Tables/GenericTable/Footer';
import { API_URL_V2 } from '@/configs/config';
import { ArrowDownTrayIcon, ChartPieIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { FaRegFilePdf } from "react-icons/fa";
import toast from 'react-hot-toast';
import { darkToastTheme } from '@/customs/reactHotToast';




const initialData = {
    loading: true,
    rows: [],
};

const initialPaginationMeta = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    perPage: 10,
};

// Helper function to handle nested paths
function getValueByPath(object, path) {
    return path?.split('.').reduce((acc, key) => acc?.[key] ?? 'N/A', object);
}

// Reusable filter formatting function
const formatFilters = (filters, paginationMeta) => {
    const formattedFilters = filters.reduce((acc, filter) => {
        if (filter.type === 'dateRange' && filter.value) {
            if (filter.value.start) acc[`${filter.name}[start]`] = filter.value.start;
            if (filter.value.end) acc[`${filter.name}[end]`] = filter.value.end;
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

    const queryParams = new URLSearchParams({
        page: paginationMeta.currentPage,
    });

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


/* Fetch Export */
const getEntityExport = async (url, fileName) => {
    /* Current date formatted DD-MM-AAAA*/
    const currentDate = new Date().toLocaleDateString().split('/').join('-');
    return await fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `${fileName} (${currentDate})`; // Nombre del archivo para guardar
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        })
        /* .then(response => response.data) */
        .catch(error => console.log(error))
        .finally(() => console.log('Finalizado'));
};

const getEntityReport = async (url, fileName) => {
    /* Current date formatted DD-MM-AAAA*/
    const currentDate = new Date().toLocaleDateString().split('/').join('-');
    return await fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = `${fileName} (${currentDate})`; // Nombre del archivo para guardar
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        })
        /* .then(response => response.data) */
        .catch(error => console.log(error))
        .finally(() => console.log('Finalizado'));
};

/* POR IMPLEMENTAR_____________
- Ojo con Eliminar mas de un id 
- Modal Eliminar 
- Skeleton
*/


export default function EntityClient({ config }) {

    const [data, setData] = useState(initialData);
    const [filters, setFilters] = useState([]);
    const [paginationMeta, setPaginationMeta] = useState(initialPaginationMeta);

    const [selectedRows, setSelectedRows] = useState([]);

    const router = useRouter();

    // Fetch Data
    useEffect(() => {
        if (!config?.endpoint) return;
        const fetchData = async () => {
            setData((prevData) => ({ ...prevData, loading: true }));
            const queryString = formatFilters(filters, paginationMeta);
            const url = `${API_URL_V2}${config.endpoint}?${queryString}`;
        
            try {
                // Solicitar datos
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include', // Incluye cookies para autenticación
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
        
                // Manejar errores HTTP
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('No estás autenticado. Por favor, inicia sesión.');
                    }
                    throw new Error(`Error: ${response.statusText}`);
                }
        
                // Procesar respuesta
                const result = await response.json();
        
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
                                    router.push(viewUrl);
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
                toast.error(error.message, darkToastTheme);
                setData((prevData) => ({ ...prevData, loading: false }));
            }
        };
        

        fetchData();
    }, [config.endpoint, filters, paginationMeta.currentPage]);

    const handlePageChange = (newPage) => {
        setPaginationMeta((prev) => ({ ...prev, currentPage: parseInt(newPage, 10) }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este elemento?')) return;

        const deleteUrl = config.deleteEndpoint.replace(':id', id);

        try {
            const response = await fetch(`${API_URL_V2}${deleteUrl}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                alert('Elemento eliminado con éxito.');
                setData((prevData) => ({
                    ...prevData,
                    rows: prevData.rows.filter((item) => item.id !== id),
                }));
            } else {
                alert('Hubo un error al intentar eliminar el elemento.');
            }
        } catch (error) {
            alert('No se pudo conectar al servidor.');
        }
    };

    const handleSelectedRowsDelete = async () => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar estos elementos?')) return;

        const deleteUrl = config.deleteEndpoint;

        try {
            const response = await fetch(`${API_URL_V2}${deleteUrl}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedRows }),
            });

            if (response.ok) {
                alert('Elementos eliminados con éxito.');
                setData((prevData) => ({
                    ...prevData,
                    rows: prevData.rows.filter((item) => !selectedRows.includes(item.id)),
                }));
                setSelectedRows([]);
            } else {
                alert('Hubo un error al intentar eliminar los elementos.');
            }
        } catch (error) {
            alert('No se pudo conectar al servidor.');
        }
    }

    const handleExport = async (exportOption) => {
        const { endpoint, fileName, type, waitingMessage } = exportOption;
        const queryString = formatFilters(filters, paginationMeta);
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {type === 'pdf' ? (<FaRegFilePdf className="h-6 w-6 text-red-500" aria-hidden="true" />)
                    : type === 'excel' ? (<PiMicrosoftExcelLogoFill className="h-6 w-6 text-green-500" aria-hidden="true" />)
                        : null}
                {waitingMessage || 'Generando exportación...'}
            </span>
        ), darkToastTheme);

        return await getEntityExport(url, fileName).then(() => {
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    {/* <PiMicrosoftExcelLogoFill className="h-6 w-6 text-white" aria-hidden="true" /> */}
                    Exportación generada correctamente
                </span>
            ), { id: toastId });
        }).catch((error) => {
            toast.error('Error: ocurrió algo inesperado.', { id: toastId, });
            throw new Error(error);
        })
    };

    const handleReport = async (reportOption) => {
        const { endpoint, fileName, waitingMessage } = reportOption;
        const queryString = formatFilters(filters, paginationMeta);
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {waitingMessage || 'Generando reporte...'}
            </span>
        ), darkToastTheme);

        return await getEntityReport(url, fileName).then(() => {
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    Reporte generado correctamente
                </span>
            ), { id: toastId });
        }).catch((error) => {
            toast.error('Error: ocurrió algo inesperado.', { id: toastId, });
            throw new Error(error);
        })
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
        ), darkToastTheme);

        return await getEntityExport(url, fileName).then(() => {
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    {/* <PiMicrosoftExcelLogoFill className="h-6 w-6 text-white" aria-hidden="true" /> */}
                    Exportación generada correctamente
                </span>
            ), { id: toastId });
        }).catch((error) => {
            toast.error('Error: ocurrió algo inesperado.', { id: toastId, });
            throw new Error(error);
        })
    };

    const handleSelectedRowsReport = async (reportOption) => {
        const { endpoint, fileName, waitingMessage } = reportOption;
        const queryString = `ids[]=${selectedRows.join('&ids[]=')}`;
        const url = `${API_URL_V2}${endpoint}?${queryString}`;

        const toastId = toast.loading((t) => (
            <span className="flex gap-2 items-center justify-center" >
                {waitingMessage || 'Generando reporte...'}
            </span>
        ), darkToastTheme);

        return await getEntityReport(url, fileName).then(() => {
            toast.success((t) => (
                <span className="flex gap-2 items-center justify-center">
                    Reporte generado correctamente
                </span>
            ), { id: toastId });
        }).catch((error) => {
            toast.error('Error: ocurrió algo inesperado.', { id: toastId, });
            throw new Error(error);
        })
    };

    const handleOnSelectionChange = (selectedRows) => {
        setSelectedRows(selectedRows);
    }

    const headerData = {
        title: config.title,
        description: config.description,
    };

    return (
        <div className='h-full'>
            <GenericTable>
                <Header data={headerData}>
                    {selectedRows.length > 0 && (
                        <>
                            <button
                                type="button"
                                className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border shadow-sm disabled:opacity-50 disabled:pointer-events-none bg-neutral-800 border-red-700/50 text-red-500 hover:bg-neutral-800"
                                onClick={handleSelectedRowsDelete}
                            >
                                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                <span className='hidden xl:flex'>Eliminar</span>
                            </button>

                            {/* Reports */}
                            <Dropdown backdrop="opaque">
                                <DropdownTrigger>
                                    <button
                                        type="button"
                                        className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border shadow-sm disabled:opacity-50 disabled:pointer-events-none bg-neutral-800 border-sky-700/50 text-sky-500 hover:bg-neutral-800"
                                    >
                                        <ChartPieIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Reportes</span>
                                    </button>
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
                                    <button
                                        type="button"
                                        className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border shadow-sm disabled:opacity-50 disabled:pointer-events-none bg-neutral-900 border-sky-700/50 text-sky-500 hover:bg-neutral-800"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Exportar</span>
                                    </button>
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
                                    <button
                                        type="button"
                                        className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border shadow-sm disabled:opacity-50 disabled:pointer-events-none bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
                                    >
                                        <ChartPieIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Reportes</span>
                                    </button>
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
                                    <button
                                        type="button"
                                        className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border shadow-sm disabled:opacity-50 disabled:pointer-events-none bg-neutral-900 border-neutral-700 text-white hover:bg-neutral-800"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                                        <span className='hidden xl:flex'>Exportar</span>
                                    </button>
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
                    <GenericFilters
                        data={{
                            configFiltersGroup: config.filtersGroup, // Pasa tanto `search` como `groups`
                            updateFilters: (updatedFilters) => setFilters(updatedFilters),
                        }}
                    />
                    <button
                        onClick={() => router.push(config.createPath)}
                        type="button"
                        className="py-1.5 px-3 inline-flex items-center gap-1 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none border-2 border-neutral-800"
                    >
                        <PlusIcon className="h-5 w-5" aria-hidden="true" />
                        Nuevo
                    </button>
                </Header>
                <Body table={config.table} data={data} emptyState={config.emptyState} isSelectable={true} onSelectionChange={handleOnSelectionChange} />
                <Footer>
                    <Pagination meta={paginationMeta} onPageChange={handlePageChange} />
                </Footer>
            </GenericTable>
        </div>
    );
}
