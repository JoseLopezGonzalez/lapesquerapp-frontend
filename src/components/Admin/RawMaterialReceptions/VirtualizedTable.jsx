/**
 * Virtualized table component for large lists
 * Uses @tanstack/react-virtual for performance
 */
'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Virtualized table wrapper
 * Only virtualizes when item count exceeds threshold
 * @param {Array} items - Array of items to render
 * @param {Function} renderRow - Function to render each row: (item, index) => JSX
 * @param {Array} headers - Array of header objects: [{ label, className }]
 * @param {number} threshold - Minimum items to enable virtualization (default: 20)
 * @param {number} rowHeight - Estimated row height in pixels (default: 60)
 */
export const VirtualizedTable = ({ 
    items = [], 
    renderRow, 
    headers = [], 
    threshold = 20,
    rowHeight = 60 
}) => {
    const parentRef = useRef(null);
    const shouldVirtualize = items.length > threshold;

    // Virtualizer for large lists
    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 5, // Render 5 extra items for smooth scrolling
    });

    if (!shouldVirtualize) {
        // Render normal table for small lists
        return (
            <div className="overflow-x-auto">
                <Table>
                    {headers.length > 0 && (
                        <TableHeader>
                            <TableRow>
                                {headers.map((header, idx) => (
                                    <TableHead key={idx} className={header.className || ''}>
                                        {header.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                    )}
                    <TableBody>
                        {items.map((item, index) => (
                            <React.Fragment key={index}>
                                {renderRow(item, index)}
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    // Virtualized table for large lists
    const virtualItems = virtualizer.getVirtualItems();
    const totalSize = virtualizer.getTotalSize();

    return (
        <div className="overflow-x-auto">
            <Table>
                {headers.length > 0 && (
                    <TableHeader>
                        <TableRow>
                            {headers.map((header, idx) => (
                                <TableHead key={idx} className={header.className || ''}>
                                    {header.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                )}
            </Table>
            <div
                ref={parentRef}
                className="overflow-auto"
                style={{ height: '600px', maxHeight: '80vh' }}
                role="table"
                aria-label="Tabla virtualizada"
            >
                <div
                    style={{
                        height: `${totalSize}px`,
                        width: '100%',
                        position: 'relative',
                    }}
                >
                    <Table role="table" aria-label="Tabla de palets">
                        <TableBody>
                            {virtualItems.map((virtualItem) => {
                                const item = items[virtualItem.index];
                                return (
                                    <TableRow
                                        key={virtualItem.key}
                                        data-index={virtualItem.index}
                                        ref={virtualizer.measureElement}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            transform: `translateY(${virtualItem.start}px)`,
                                        }}
                                        role="row"
                                    >
                                        {renderRow(item, virtualItem.index)}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

