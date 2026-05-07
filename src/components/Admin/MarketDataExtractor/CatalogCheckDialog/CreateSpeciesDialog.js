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
import { speciesService } from '@/services/domain/species/speciesService';
import { fetchAutocompleteOptionsGeneric } from '@/services/generic/editEntityService';
import { getAuthToken } from '@/lib/auth/getAuthToken';
import { API_URL_V2 } from '@/configs/config';
import { notify } from '@/lib/notifications';

async function loadFishingGearOptions() {
    const token = await getAuthToken();
    return fetchAutocompleteOptionsGeneric(`${API_URL_V2}fishing-gears/options`, token);
}

// Lazy-loaded once per session; resolves to getScientificNameByFao fn
let asfisLookupPromise = null;
function getAsfisLookup() {
    if (!asfisLookupPromise) {
        asfisLookupPromise = import('@/data/asfisSpecies').then((m) => m.getScientificNameByFao);
    }
    return asfisLookupPromise;
}

function capitalizeSuggestedName(value) {
    if (!value) return '';
    return value
        .toLowerCase()
        .replace(/(^|[\s/()-])([a-záéíóúüñ])/g, (_, sep, letter) => `${sep}${letter.toUpperCase()}`);
}

export default function CreateSpeciesDialog({ open, onOpenChange, prefill, onCreated }) {
    const [fishingGearOptions, setFishingGearOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [loadingScientific, setLoadingScientific] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: {
            fao: prefill?.fao || '',
            name: capitalizeSuggestedName(prefill?.name || ''),
            scientificName: '',
            fishingGearId: null,
        },
    });

    useEffect(() => {
        if (open) {
            reset({
                fao: prefill?.fao || '',
                name: capitalizeSuggestedName(prefill?.name || ''),
                scientificName: '',
                fishingGearId: null,
            });

            setLoadingOptions(true);
            loadFishingGearOptions()
                .then(setFishingGearOptions)
                .catch(() => setFishingGearOptions([]))
                .finally(() => setLoadingOptions(false));

            if (prefill?.fao) {
                setLoadingScientific(true);
                getAsfisLookup()
                    .then((fn) => {
                        const sciName = fn(prefill.fao);
                        if (sciName) setValue('scientificName', sciName);
                    })
                    .finally(() => setLoadingScientific(false));
            }
        }
    }, [open, prefill, reset, setValue]);

    const onSubmit = async (data) => {
        try {
            const created = await speciesService.create({
                fao: data.fao.trim().toUpperCase(),
                name: data.name.trim(),
                scientificName: data.scientificName.trim(),
                fishingGearId: data.fishingGearId,
            });
            notify.success({ title: 'Especie creada', description: `${data.name} añadida al catálogo.` });
            onCreated(created);
        } catch (err) {
            notify.error({
                title: 'Error al crear especie',
                description: err.userMessage || err.message || 'Error inesperado.',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent size="md">
                <DialogHeader>
                    <DialogTitle>Nueva especie</DialogTitle>
                    <DialogDescription>
                        Datos pre-rellenos desde el documento. Revisa y completa antes de guardar.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 py-2">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-1 space-y-1.5">
                            <Label htmlFor="cs-fao">Código FAO</Label>
                            <Input
                                id="cs-fao"
                                {...register('fao', {
                                    required: 'Requerido',
                                    pattern: { value: /^[A-Za-z]{2,5}$/, message: '2-5 letras' },
                                })}
                                placeholder="Ej. OCT"
                                className="uppercase"
                            />
                            {errors.fao && (
                                <p className="text-red-400 text-xs">* {errors.fao.message}</p>
                            )}
                        </div>
                        <div className="col-span-3 space-y-1.5">
                            <Label htmlFor="cs-name">Nombre común</Label>
                            <Input
                                id="cs-name"
                                {...register('name', { required: 'Requerido' })}
                                placeholder="Ej. Pulpo"
                                className="placeholder:capitalize"
                            />
                            {errors.name && (
                                <p className="text-red-400 text-xs">* {errors.name.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="cs-scientific" className="flex items-center gap-2">
                            Nombre científico
                            {loadingScientific && (
                                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                        </Label>
                        <Input
                            id="cs-scientific"
                            {...register('scientificName', { required: 'Requerido' })}
                            placeholder="Ej. Octopus vulgaris"
                            className="italic"
                        />
                        {errors.scientificName && (
                            <p className="text-red-400 text-xs">* {errors.scientificName.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Arte de pesca</Label>
                        <Controller
                            name="fishingGearId"
                            control={control}
                            rules={{ required: 'Requerido' }}
                            render={({ field: { onChange, value } }) => (
                                <Combobox
                                    options={fishingGearOptions}
                                    value={value}
                                    onChange={onChange}
                                    placeholder="Seleccionar arte de pesca"
                                    searchPlaceholder="Buscar..."
                                    notFoundMessage="Sin resultados"
                                    loading={loadingOptions}
                                />
                            )}
                        />
                        {errors.fishingGearId && (
                            <p className="text-red-400 text-xs">* {errors.fishingGearId.message}</p>
                        )}
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
                                'Crear especie'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
