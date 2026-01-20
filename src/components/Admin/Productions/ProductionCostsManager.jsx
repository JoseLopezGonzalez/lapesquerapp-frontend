'use client'

import React, { useState, useEffect } from 'react'
import { 
    getProductionCosts, 
    createProductionCost, 
    updateProductionCost, 
    deleteProductionCost 
} from '@/services/costService'
import { getCostCatalog } from '@/services/costService'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { formatCostPerKg, formatTotalCost, getCostTypeColor, getCostTypeLabel } from '@/helpers/production/costFormatters'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

/**
 * Componente para gestionar costes de producción
 * @param {number} productionRecordId - ID del proceso (opcional)
 * @param {number} productionId - ID de la producción/lote (opcional)
 */
export default function ProductionCostsManager({ 
    productionRecordId = null, 
    productionId = null 
}) {
    const { data: session } = useSession();
    const [costs, setCosts] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCost, setEditingCost] = useState(null);
    const [formData, setFormData] = useState({
        cost_catalog_id: '',
        name: '',
        cost_type: '',
        description: '',
        total_cost: '',
        cost_per_kg: '',
        cost_date: new Date().toISOString().split('T')[0],
    });
    const [useCatalog, setUseCatalog] = useState(true);
    const [costUnit, setCostUnit] = useState('total');

    useEffect(() => {
        if (session?.user?.accessToken) {
            loadCosts();
            loadCatalog();
        }
    }, [session?.user?.accessToken, productionRecordId, productionId]);

    const loadCosts = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = session.user.accessToken;
            const params = {};
            if (productionRecordId) params.production_record_id = productionRecordId;
            if (productionId) params.production_id = productionId;

            const response = await getProductionCosts(token, params);
            setCosts(response.data || []);
        } catch (err) {
            console.error('Error loading costs:', err);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar los costes';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const loadCatalog = async () => {
        try {
            const token = session.user.accessToken;
            const response = await getCostCatalog(token, { active_only: true });
            setCatalog(response.data || []);
        } catch (err) {
            console.error('Error loading catalog:', err);
        }
    };

    const handleOpenDialog = (cost = null) => {
        if (cost) {
            setEditingCost(cost);
            setFormData({
                cost_catalog_id: cost.costCatalogId || '',
                name: cost.name || '',
                cost_type: cost.costType || '',
                description: cost.description || '',
                total_cost: cost.totalCost || '',
                cost_per_kg: cost.costPerKg || '',
                cost_date: cost.costDate || new Date().toISOString().split('T')[0],
            });
            setUseCatalog(!!cost.costCatalogId);
            setCostUnit(cost.costPerKg ? 'per_kg' : 'total');
        } else {
            setEditingCost(null);
            setFormData({
                cost_catalog_id: '',
                name: '',
                cost_type: '',
                description: '',
                total_cost: '',
                cost_per_kg: '',
                cost_date: new Date().toISOString().split('T')[0],
            });
            setUseCatalog(true);
            setCostUnit('total');
        }
        setDialogOpen(true);
    };

    const handleCatalogSelect = (catalogId) => {
        const catalogItem = catalog.find(c => c.id === parseInt(catalogId));
        if (catalogItem) {
            setFormData(prev => ({
                ...prev,
                cost_catalog_id: catalogId,
                name: catalogItem.name,
                cost_type: catalogItem.costType,
            }));
            setCostUnit(catalogItem.defaultUnit);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = session.user.accessToken;

            const submitData = {
                production_record_id: productionRecordId || null,
                production_id: productionId || null,
                cost_catalog_id: useCatalog && formData.cost_catalog_id ? parseInt(formData.cost_catalog_id) : null,
                name: useCatalog && formData.cost_catalog_id ? null : formData.name,
                cost_type: useCatalog && formData.cost_catalog_id ? null : formData.cost_type,
                description: formData.description || null,
                total_cost: costUnit === 'total' ? parseFloat(formData.total_cost) : null,
                cost_per_kg: costUnit === 'per_kg' ? parseFloat(formData.cost_per_kg) : null,
                cost_date: formData.cost_date,
            };

            if (editingCost) {
                await updateProductionCost(editingCost.id, submitData, token);
            } else {
                await createProductionCost(submitData, token);
            }

            setDialogOpen(false);
            loadCosts();
        } catch (err) {
            console.error('Error saving cost:', err);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al guardar el coste';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (costId) => {
        if (!confirm('¿Estás seguro de eliminar este coste?')) return;

        try {
            setLoading(true);
            const token = session.user.accessToken;
            await deleteProductionCost(costId, token);
            loadCosts();
        } catch (err) {
            console.error('Error deleting cost:', err);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al eliminar el coste';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Costes de {productionRecordId ? 'Proceso' : 'Producción'}</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir Coste
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCost ? 'Editar Coste' : 'Nuevo Coste'}
                            </DialogTitle>
                            <DialogDescription>
                                {productionRecordId 
                                    ? 'Añade un coste asociado a este proceso'
                                    : 'Añade un coste asociado a esta producción (lote)'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="useCatalog"
                                    checked={useCatalog}
                                    onChange={(e) => {
                                        const newUseCatalog = e.target.checked;
                                        setUseCatalog(newUseCatalog);
                                        // Si se desactiva el catálogo, limpiar cost_catalog_id
                                        if (!newUseCatalog) {
                                            setFormData(prev => ({
                                                ...prev,
                                                cost_catalog_id: ''
                                            }));
                                        }
                                    }}
                                    className="rounded"
                                />
                                <Label htmlFor="useCatalog">Usar catálogo de costes</Label>
                            </div>

                            {useCatalog ? (
                                <div className="space-y-2">
                                    <Label>Coste del Catálogo</Label>
                                    <Select onValueChange={handleCatalogSelect} value={formData.cost_catalog_id}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un coste del catálogo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {catalog.map(item => (
                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                    {item.name} ({getCostTypeLabel(item.costType)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label>Nombre *</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo de Coste *</Label>
                                        <Select
                                            value={formData.cost_type}
                                            onValueChange={(value) => setFormData({ ...formData, cost_type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="production">Producción</SelectItem>
                                                <SelectItem value="labor">Personal</SelectItem>
                                                <SelectItem value="operational">Operativos</SelectItem>
                                                <SelectItem value="packaging">Envases</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Unidad de Coste</Label>
                                <Select value={costUnit} onValueChange={setCostUnit}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="total">Coste Total</SelectItem>
                                        <SelectItem value="per_kg">Coste por kg</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {costUnit === 'total' ? (
                                <div className="space-y-2">
                                    <Label>Coste Total (€) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.total_cost}
                                        onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                                        required
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Coste por kg (€/kg) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.cost_per_kg}
                                        onChange={(e) => setFormData({ ...formData, cost_per_kg: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Fecha del Coste</Label>
                                <Input
                                    type="date"
                                    value={formData.cost_date}
                                    onChange={(e) => setFormData({ ...formData, cost_date: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {loading && costs.length === 0 ? (
                    <div className="text-center py-8">Cargando...</div>
                ) : costs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No hay costes registrados
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Coste</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {costs.map(cost => (
                                <TableRow key={cost.id}>
                                    <TableCell>{cost.name}</TableCell>
                                    <TableCell>
                                        <Badge className={getCostTypeColor(cost.costType)}>
                                            {getCostTypeLabel(cost.costType)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {cost.totalCost 
                                            ? formatTotalCost(cost.totalCost)
                                            : formatCostPerKg(cost.costPerKg)
                                        }
                                    </TableCell>
                                    <TableCell>{cost.costDate}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenDialog(cost)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(cost.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

