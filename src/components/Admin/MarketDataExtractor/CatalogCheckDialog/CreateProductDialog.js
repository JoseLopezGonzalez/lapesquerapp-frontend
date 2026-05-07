'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/Shadcn/Combobox';
import { productService } from '@/services/domain/products/productService';
import { captureZoneService } from '@/services/domain/capture-zones/captureZoneService';
import { productFamilyService } from '@/services/domain/product-families/productFamilyService';
import { speciesService } from '@/services/domain/species/speciesService';
import { normalizeText } from '@/helpers/formats/texts';
import { notify } from '@/lib/notifications';

function capitalizeName(value) {
    if (!value) return '';
    return value
        .toLowerCase()
        .replace(/(^|[\s/()-])([a-záéíóúüñ])/g, (_, sep, letter) => `${sep}${letter.toUpperCase()}`);
}

async function loadSelectOptions() {
    const [species, captureZones, families] = await Promise.all([
        speciesService.getOptions().catch(() => []),
        captureZoneService.getOptions().catch(() => []),
        productFamilyService.getOptions().catch(() => []),
    ]);
    return { species, captureZones, families };
}

function guessSpeciesId(speciesOptions, nombre) {
    if (!nombre || !speciesOptions.length) return null;
    const needle = normalizeText(nombre);
    // 1. Exact match
    let match = speciesOptions.find((s) => normalizeText(s.label) === needle);
    if (match) return match.value;
    // 2. Product name starts with the species name (e.g. "PULPO LIMPIO 1-2 KG" → "Pulpo")
    match = speciesOptions.find((s) => needle.startsWith(normalizeText(s.label)));
    if (match) return match.value;
    // 3. Species name contained in product name (min 4 chars to avoid noise)
    match = speciesOptions.find((s) => {
        const hay = normalizeText(s.label);
        return hay.length >= 4 && needle.includes(hay);
    });
    return match?.value ?? null;
}

export default function CreateProductDialog({ open, onOpenChange, prefill, onCreated }) {
    const [options, setOptions] = useState({ species: [], captureZones: [], families: [] });
    const [loadingOptions, setLoadingOptions] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            name: capitalizeName(prefill?.nombre || ''),
            speciesId: null,
            captureZoneId: null,
            familyId: null,
            a3erpCode: '',
        },
    });

    useEffect(() => {
        if (open) {
            reset({
                name: capitalizeName(prefill?.nombre || ''),
                speciesId: null,
                captureZoneId: null,
                familyId: null,
                a3erpCode: '',
            });
            setLoadingOptions(true);
            loadSelectOptions()
                .then((opts) => {
                    setOptions(opts);
                    const guessed = guessSpeciesId(opts.species, prefill?.nombre);
                    if (guessed !== null) {
                        setValue('speciesId', guessed);
                    }
                })
                .finally(() => setLoadingOptions(false));
        }
    }, [open, prefill, reset]); // setValue is a stable RHF ref — no need in deps

    const onSubmit = async (data) => {
        try {
            const created = await productService.create({
                name: data.name.trim(),
                speciesId: data.speciesId,
                captureZoneId: data.captureZoneId,
                familyId: data.familyId,
                a3erpCode: data.a3erpCode?.trim() || null,
            });
            notify.success({ title: 'Producto creado', description: `"${data.name}" añadido al catálogo.` });
            onCreated?.(created);
            onOpenChange(false);
        } catch (err) {
            notify.error({
                title: 'Error al crear producto',
                description: err.userMessage || err.message || 'Error inesperado.',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="lg">
                <DialogHeader>
                    <DialogTitle>Nuevo producto</DialogTitle>
                    <DialogDescription>
                        Datos pre-rellenos desde el documento. Revisa y completa antes de guardar.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="cp-name">Nombre del producto</Label>
                        <Input
                            id="cp-name"
                            {...register('name', {
                                required: 'Requerido',
                                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
                            })}
                            placeholder="Ej. Pulpo limpio 1-2 kg"
                        />
                        {errors.name && (
                            <p className="text-red-400 text-xs">* {errors.name.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label>Especie</Label>
                            <Controller
                                name="speciesId"
                                control={control}
                                rules={{ required: 'Requerida' }}
                                render={({ field: { onChange, value } }) => (
                                    <Combobox
                                        options={options.species}
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Seleccionar especie"
                                        searchPlaceholder="Buscar..."
                                        notFoundMessage="Sin resultados"
                                        loading={loadingOptions}
                                    />
                                )}
                            />
                            {errors.speciesId && (
                                <p className="text-red-400 text-xs">* {errors.speciesId.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Zona de captura</Label>
                            <Controller
                                name="captureZoneId"
                                control={control}
                                rules={{ required: 'Requerida' }}
                                render={({ field: { onChange, value } }) => (
                                    <Combobox
                                        options={options.captureZones}
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Seleccionar zona"
                                        searchPlaceholder="Buscar..."
                                        notFoundMessage="Sin resultados"
                                        loading={loadingOptions}
                                    />
                                )}
                            />
                            {errors.captureZoneId && (
                                <p className="text-red-400 text-xs">* {errors.captureZoneId.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Familia</Label>
                            <Controller
                                name="familyId"
                                control={control}
                                rules={{ required: 'Requerida' }}
                                render={({ field: { onChange, value } }) => (
                                    <Combobox
                                        options={options.families}
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Seleccionar familia"
                                        searchPlaceholder="Buscar..."
                                        notFoundMessage="Sin resultados"
                                        loading={loadingOptions}
                                    />
                                )}
                            />
                            {errors.familyId && (
                                <p className="text-red-400 text-xs">* {errors.familyId.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cp-a3erp">
                            Código A3ERP{' '}
                            <span className="text-muted-foreground font-normal">(opcional)</span>
                        </Label>
                        <Input
                            id="cp-a3erp"
                            {...register('a3erpCode')}
                            placeholder="Ej. 0000001"
                            className="font-mono"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Crear producto'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
