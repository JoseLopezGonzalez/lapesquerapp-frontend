'use client'

import React, { useState, useEffect } from 'react'
import { getProductionInputs, getProductionOutputConsumptions } from '@/services/productionService'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatWeight } from '@/helpers/production/formatters'
import { formatDecimal } from '@/helpers/formats/numbers/formatNumbers'
import { Badge } from '@/components/ui/badge'

/**
 * Componente para seleccionar sources de un output
 * @param {number} productionRecordId - ID del proceso
 * @param {number} totalWeightKg - Peso total del output
 * @param {Array} selectedSources - Sources ya seleccionados
 * @param {Function} onChange - Callback cuando cambian los sources
 */
export default function CostSourceSelector({ 
    productionRecordId, 
    totalWeightKg,
    selectedSources = [],
    onChange 
}) {
    const { data: session } = useSession();
    const [inputs, setInputs] = useState([]);
    const [consumptions, setConsumptions] = useState([]);
    const [sources, setSources] = useState(selectedSources);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (session?.user?.accessToken && productionRecordId) {
            loadSources();
        }
    }, [session?.user?.accessToken, productionRecordId]);

    useEffect(() => {
        setSources(selectedSources);
    }, [selectedSources]);

    const loadSources = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = session.user.accessToken;

            const [inputsData, consumptionsData] = await Promise.all([
                getProductionInputs(token, { production_record_id: productionRecordId }),
                getProductionOutputConsumptions(token, { production_record_id: productionRecordId }),
            ]);

            setInputs(inputsData.data || []);
            setConsumptions(consumptionsData.data || []);
        } catch (err) {
            console.error('Error loading sources:', err);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar las fuentes';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const addSource = (type, sourceId) => {
        const newSource = {
            source_type: type,
            [type === 'stock_box' ? 'production_input_id' : 'production_output_consumption_id']: sourceId,
            contributed_weight_kg: null,
            contribution_percentage: null,
        };
        const updated = [...sources, newSource];
        setSources(updated);
        if (onChange) {
            onChange(updated);
        }
    };

    const removeSource = (index) => {
        const updated = sources.filter((_, i) => i !== index);
        setSources(updated);
        if (onChange) {
            onChange(updated);
        }
    };

    const updateSource = (index, field, value) => {
        const updated = [...sources];
        const currentSource = { ...updated[index] };
        
        // Si se actualiza weight_kg, calcular percentage y limpiar el otro campo
        if (field === 'contributed_weight_kg' && totalWeightKg > 0) {
            const weight = parseFloat(value) || 0;
            currentSource.contributed_weight_kg = value === '' ? null : weight;
            currentSource.contribution_percentage = weight > 0 ? (weight / totalWeightKg) * 100 : null;
        }
        // Si se actualiza percentage, calcular weight_kg y limpiar el otro campo
        else if (field === 'contribution_percentage' && totalWeightKg > 0) {
            const percentage = parseFloat(value) || 0;
            currentSource.contribution_percentage = value === '' ? null : percentage;
            currentSource.contributed_weight_kg = percentage > 0 ? (percentage / 100) * totalWeightKg : null;
        }
        // Para otros campos, actualizar directamente
        else {
            currentSource[field] = value;
        }
        
        updated[index] = currentSource;
        setSources(updated);
        if (onChange) {
            onChange(updated);
        }
    };

    const totalPercentage = sources.reduce((sum, s) => {
        return sum + (parseFloat(s.contribution_percentage) || 0);
    }, 0);

    const isValid = Math.abs(totalPercentage - 100) < 0.01;

    if (loading) {
        return <div className="text-center py-4">Cargando fuentes...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fuentes de Materia Prima</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!isValid && sources.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            El porcentaje total debe ser 100%. Actual: {formatDecimal(totalPercentage, 2)}%
                        </AlertDescription>
                    </Alert>
                )}

                {sources.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                        No hay fuentes seleccionadas. Se calcularán automáticamente de forma proporcional.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Origen</TableHead>
                                <TableHead>Peso (kg)</TableHead>
                                <TableHead>Porcentaje (%)</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sources.map((source, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Badge>
                                            {source.source_type === 'stock_box' ? 'Stock' : 'Output Padre'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {source.source_type === 'stock_box' 
                                            ? `Input #${source.production_input_id}`
                                            : `Consumo #${source.production_output_consumption_id}`
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={source.contributed_weight_kg || ''}
                                            onChange={(e) => updateSource(index, 'contributed_weight_kg', e.target.value)}
                                            className="w-24"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={source.contribution_percentage || ''}
                                            onChange={(e) => updateSource(index, 'contribution_percentage', e.target.value)}
                                            className="w-24"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSource(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <div className="flex gap-2">
                    <Select onValueChange={(value) => {
                        const [type, id] = value.split('-');
                        addSource(type, parseInt(id));
                    }}>
                        <SelectTrigger className="w-64">
                            <SelectValue placeholder="Añadir fuente" />
                        </SelectTrigger>
                        <SelectContent>
                            {inputs.length > 0 && (
                                <>
                                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">Materias Primas</div>
                                    {inputs.map(input => (
                                        <SelectItem key={`stock_box-${input.id}`} value={`stock_box-${input.id}`}>
                                            Input #{input.id} - {formatWeight(input.box?.netWeight)}
                                        </SelectItem>
                                    ))}
                                </>
                            )}
                            {consumptions.length > 0 && (
                                <>
                                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">Outputs Padre</div>
                                    {consumptions.map(consumption => (
                                        <SelectItem 
                                            key={`parent_output-${consumption.id}`} 
                                            value={`parent_output-${consumption.id}`}
                                        >
                                            Consumo #{consumption.id} - {formatWeight(consumption.consumedWeightKg)}
                                        </SelectItem>
                                    ))}
                                </>
                            )}
                            {inputs.length === 0 && consumptions.length === 0 && (
                                <SelectItem value="none" disabled>No hay fuentes disponibles</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {sources.length > 0 && (
                    <div className="text-sm text-gray-600">
                        Total: {formatDecimal(totalPercentage, 2)}% / 100%
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

