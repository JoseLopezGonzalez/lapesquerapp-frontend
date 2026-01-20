'use client'

import React, { useState, useEffect } from 'react'
import { 
    getCostCatalog, 
    createCostCatalogItem, 
    updateCostCatalogItem, 
    deleteCostCatalogItem 
} from '@/services/costService'
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
import { getCostTypeColor, getCostTypeLabel } from '@/helpers/production/costFormatters'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

/**
 * Componente para gestionar el catálogo de costes
 */
export default function CostCatalogManager() {
    const { data: session } = useSession();
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        cost_type: '',
        description: '',
        default_unit: 'total',
        is_active: true,
    });
    const [filter, setFilter] = useState({
        cost_type: '',
        active_only: true,
    });

    useEffect(() => {
        if (session?.user?.accessToken) {
            loadCatalog();
        }
    }, [session?.user?.accessToken, filter]);

    const loadCatalog = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = session.user.accessToken;
            const params = {};
            if (filter.cost_type) params.cost_type = filter.cost_type;
            if (filter.active_only) params.active_only = true;

            const response = await getCostCatalog(token, params);
            setCatalog(response.data || []);
        } catch (err) {
            console.error('Error loading catalog:', err);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al cargar el catálogo';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name || '',
                cost_type: item.costType || '',
                description: item.description || '',
                default_unit: item.defaultUnit || 'total',
                is_active: item.isActive !== undefined ? item.isActive : true,
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                cost_type: '',
                description: '',
                default_unit: 'total',
                is_active: true,
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const token = session.user.accessToken;

            const submitData = {
                name: formData.name,
                cost_type: formData.cost_type,
                description: formData.description || null,
                default_unit: formData.default_unit,
                is_active: formData.is_active,
            };

            if (editingItem) {
                await updateCostCatalogItem(editingItem.id, submitData, token);
            } else {
                await createCostCatalogItem(submitData, token);
            }

            setDialogOpen(false);
            loadCatalog();
        } catch (err) {
            console.error('Error saving catalog item:', err);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al guardar el elemento';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (itemId) => {
        if (!confirm('¿Estás seguro de eliminar este elemento del catálogo?')) return;

        try {
            setLoading(true);
            const token = session.user.accessToken;
            await deleteCostCatalogItem(itemId, token);
            loadCatalog();
        } catch (err) {
            console.error('Error deleting catalog item:', err);
            // Priorizar userMessage sobre message para mostrar errores en formato natural
            const errorMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || 'Error al eliminar el elemento';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Catálogo de Costes</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir Coste
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? 'Editar Coste' : 'Nuevo Coste en Catálogo'}
                            </DialogTitle>
                            <DialogDescription>
                                Los costes del catálogo pueden reutilizarse en múltiples procesos
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

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

                            <div className="space-y-2">
                                <Label>Descripción</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Unidad por Defecto *</Label>
                                <Select
                                    value={formData.default_unit}
                                    onValueChange={(value) => setFormData({ ...formData, default_unit: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="total">Coste Total</SelectItem>
                                        <SelectItem value="per_kg">Coste por kg</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => 
                                        setFormData({ ...formData, is_active: checked })
                                    }
                                />
                                <Label htmlFor="is_active">Activo</Label>
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
                {/* Filtros */}
                <div className="flex gap-4 mb-4">
                    <Select
                        value={filter.cost_type}
                        onValueChange={(value) => setFilter({ ...filter, cost_type: value })}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Filtrar por tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Todos los tipos</SelectItem>
                            <SelectItem value="production">Producción</SelectItem>
                            <SelectItem value="labor">Personal</SelectItem>
                            <SelectItem value="operational">Operativos</SelectItem>
                            <SelectItem value="packaging">Envases</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="active_only"
                            checked={filter.active_only}
                            onCheckedChange={(checked) => 
                                setFilter({ ...filter, active_only: checked })
                            }
                        />
                        <Label htmlFor="active_only">Solo activos</Label>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading && catalog.length === 0 ? (
                    <div className="text-center py-8">Cargando...</div>
                ) : catalog.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No hay costes en el catálogo
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {catalog.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>
                                        <Badge className={getCostTypeColor(item.costType)}>
                                            {getCostTypeLabel(item.costType)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {item.defaultUnit === 'total' ? 'Total' : 'Por kg'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.isActive ? 'default' : 'secondary'}>
                                            {item.isActive ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleOpenDialog(item)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
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

