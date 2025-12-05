export function mapEntityRows(rawRows, headers, handleDelete, config) {
    // console.log('rawRows', rawRows);
    // console.log('headers', headers);
    const isProductionStatus = config?.endpoint === "productions";
    
    return rawRows.map((row) => {
        const rowData = headers.reduce((acc, header) => {
            let value;
            
            // Lógica especial para badge de status de producciones
            if (isProductionStatus && header.name === "status" && header.type === "badge") {
                const openedAt = row.openedAt || row.opened_at;
                const closedAt = row.closedAt || row.closed_at;
                
                // Si tiene closedAt, está cerrado
                if (closedAt) {
                    value = "closed";
                }
                // Si tiene openedAt y no tiene closedAt, está abierto
                else if (openedAt && !closedAt) {
                    value = "open";
                }
                // Si no tiene openedAt, estado desconocido
                else {
                    value = "default";
                }
            }
            else if (header.path) {
                value = header.path.split('.').reduce((acc2, key) => acc2?.[key], row);
                // Para badges y dates, si no hay valor, usar undefined en lugar de 'N/A'
                if ((header.type === 'badge' || header.type === 'date' || header.type === 'dateHour') && (value === undefined || value === null)) {
                    value = undefined;
                } else if (value === undefined || value === null) {
                    value = 'N/A';
                }
            } else {
                value = row[header.name];
                // Para badges y dates, si no hay valor, usar undefined en lugar de 'N/A'
                if ((header.type === 'badge' || header.type === 'date' || header.type === 'dateHour') && (value === undefined || value === null)) {
                    value = undefined;
                } else if (value === undefined || value === null) {
                    value = 'N/A';
                }
            }
            acc[header.name] = value;
            return acc;
        }, {});
        return {
            ...rowData,
            actions: {
                view: {
                    label: 'Ver',
                    onClick: () => {
                        if (config?.viewRoute) {
                            const viewUrl = config.viewRoute.replace(':id', row.id);
                            window.open(viewUrl, '_blank');
                        }
                    },
                },
                delete: {
                    label: 'Eliminar',
                    onClick: async () => handleDelete(row.id),
                },
            },
            id: row.id,
        };
    });
} 