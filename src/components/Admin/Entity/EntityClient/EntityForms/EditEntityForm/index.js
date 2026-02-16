// components/EditEntityClient.jsx
"use client";

import { useForm, Controller } from "react-hook-form";import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/datePicker";
import { format } from "date-fns"
import { Combobox } from "@/components/Shadcn/Combobox";
import { Loader2 } from "lucide-react";
import EmailListInput from "@/components/ui/emailListInput";

import get from "lodash.get";import Loader from "@/components/Utilities/Loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notify } from '@/lib/notifications';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';

// Import domain services and mapper
import { getEntityService } from '@/services/domain/entityServiceMapper';
import { isoToDateTimeLocal, datetimeLocalToIso } from '@/helpers/production/dateFormatters';

export function mapApiDataToFormValues(fields, data) {
    const result = {};

    for (const field of fields) {
        const key = field.name;

        if (field.path) {
            result[key] = get(data, field.path, null);
        } else {
            result[key] = data[key];
        }

        // Convertir fechas de string a Date si el campo es de tipo date
        if (field.type === "date" && result[key]) {
            result[key] = typeof result[key] === 'string' ? new Date(result[key]) : result[key];
        }
        
        // Convertir timestamps ISO a datetime-local si el campo es de tipo datetime-local
        if (field.type === "datetime-local" && result[key]) {
            result[key] = isoToDateTimeLocal(result[key]);
        }
    }
    return result;
}

function prepareValidations(fields) {
    return fields.map((field) => {
        const newField = { ...field };
        if (newField.validation?.pattern?.value && typeof newField.validation.pattern.value === "string") {
            newField.validation.pattern.value = new RegExp(newField.validation.pattern.value.replace(/^\/|\/$/g, ""));
        }
        return newField;
    });
}

export default function EditEntityForm({ config, id: propId, onSuccess, onCancel }) {
    const params = useParams();
    const id = propId || params.id;
    const router = useRouter();

    const {
        title,
        endpoint,
        method = "PUT",
        successMessage,
        errorMessage,
    } = config.editForm;

    const fields = config.fields;

    const {
        register, handleSubmit, control, reset, setError,
        formState: { errors, isSubmitting },
    } = useForm({ mode: "onChange" });

    const [loadedOptions, setLoadedOptions] = useState({});
    const [loadingOptions, setLoadingOptions] = useState({});
    const [loading, setLoading] = useState(true);

    // Function to fetch and set entity data
    const loadEntityData = useCallback(async () => {
        const entityService = getEntityService(endpoint);
        if (!entityService) {
            notify.error('No se encontró el servicio para esta entidad.');
            setLoading(false);
            return;
        }

        try {
            const data = await entityService.getById(id);
            const formValues = mapApiDataToFormValues(fields, data);
            reset(formValues);
        } catch (err) {
            let userMessage = "Error al cargar los datos de la entidad.";
            if (err instanceof Response) {
                if (err.status === 401) userMessage = "No autorizado. Por favor, inicie sesión.";
                else if (err.status === 403) userMessage = "Permiso denegado.";
                else userMessage = `Error ${err.status}: ${userMessage}`;
            } else if (err instanceof Error) {
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                userMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || userMessage;
            }
            notify.error(userMessage);
            console.error("Error loading entity data:", err);
        } finally {
            setLoading(false);
        }
    }, [id, endpoint, fields, reset]);

    // Function to fetch autocomplete options
    const loadAutocompleteOptions = useCallback(async () => {
        const result = {};
        const loadingStates = {};
        
        // Inicializar estados de loading para cada campo autocomplete
        fields.forEach((field) => {
            if (field.type === "Autocomplete" && field.endpoint) {
                loadingStates[field.name] = true;
            }
        });
        setLoadingOptions(loadingStates);
        
        await Promise.all(
            fields.map(async (field) => {
                if (field.type === "Autocomplete" && field.endpoint) {
                    try {
                        // Extraer nombre de entidad del endpoint (ej: "suppliers/options" -> "suppliers")
                        const entityName = field.endpoint.replace('/options', '');
                        const entityService = getEntityService(entityName);
                        
                        if (entityService) {
                            const options = await entityService.getOptions();
                            result[field.name] = options;
                        } else {
                            console.warn(`No se encontró servicio para entidad "${entityName}"`);
                            result[field.name] = [];
                        }
                    } catch (err) {
                        console.error(`Error cargando opciones de ${field.name}:`, err);
                        result[field.name] = [];
                    } finally {
                        setLoadingOptions((prev) => ({
                            ...prev,
                            [field.name]: false,
                        }));
                    }
                }
            })
        );
        setLoadedOptions(result);
    }, [fields]);

    // Load initial data and options on component mount
    useEffect(() => {
        loadEntityData();
        loadAutocompleteOptions();
    }, [loadEntityData, loadAutocompleteOptions]);


    const onSubmit = async (data) => {
        try {
            // Convertir fechas a string YYYY-MM-DD si son Date
            const processedData = { ...data };
            Object.keys(processedData).forEach(key => {
                if (processedData[key] instanceof Date) {
                    processedData[key] = format(processedData[key], 'yyyy-MM-dd');
                }
            });
            
            // Convertir campos datetime-local a ISO antes de enviar
            const fields = config.fields || config.editForm?.fields || [];
            fields.forEach(field => {
                if (field.type === "datetime-local" && processedData[field.name]) {
                    const isoValue = datetimeLocalToIso(processedData[field.name]);
                    if (isoValue) {
                        processedData[field.name] = isoValue;
                    }
                }
            });

            // Convertir camelCase a snake_case para campos específicos de punches
            // Laravel normalmente acepta ambos, pero para consistencia con la API
            const snakeCaseMap = {
                'employeeId': 'employee_id',
                'eventType': 'event_type',
                'deviceId': 'device_id',
            };
            
            const finalData = {};
            
            // Procesar todos los campos
            Object.keys(processedData).forEach(key => {
                if (snakeCaseMap[key]) {
                    // Convertir a snake_case
                    finalData[snakeCaseMap[key]] = processedData[key];
                } else {
                    // Mantener el nombre original
                    finalData[key] = processedData[key];
                }
            });

            const entityService = getEntityService(endpoint);
            if (!entityService) {
                notify.error('No se encontró el servicio para esta entidad.');
                return;
            }

            await entityService.update(id, finalData);
            notify.success(successMessage);
            if (typeof onSuccess === 'function') onSuccess();
            // router.push(`/admin/${endpoint}`); // Uncomment if you want to redirect after success
        } catch (err) {
            let userMessage = errorMessage || "Error inesperado al guardar.";
            if (err instanceof Response) {
                if (err.status === 401) userMessage = "No autorizado. Por favor, inicie sesión.";
                else if (err.status === 403) userMessage = "Permiso denegado.";
                else if (err.status === 422) {
                    const errorBody = await err.json();
                    userMessage = errorBody.userMessage || errorBody.message || userMessage;
                    if (errorBody?.errors) setErrorsFrom422(setError, errorBody.errors);
                }
            } else if (err instanceof Error) {
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                userMessage = err.userMessage || err.data?.userMessage || err.response?.data?.userMessage || err.message || userMessage;
            }
            notify.error(userMessage);
            console.error("Submission error:", err);
        }
    };

    const renderField = (field) => {
        const commonProps = {
            id: field.name,
            placeholder: field.placeholder || "",
            ...register(field.name, field.validation),
        };

        switch (field.type) {
            case "date":
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={field.validation}
                        render={({ field: { onChange, value, onBlur } }) => (
                            <DatePicker 
                                date={value} 
                                onChange={onChange} 
                                onBlur={onBlur}
                                formatStyle="short"
                            />
                        )}
                    />
                );
            case "select":
                // Para selects estáticos (field.options), no hay loading
                // Para selects dinámicos que vienen de fetch, se debería pasar loading como prop
                const selectLoading = field.loading || false;
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={field.validation}
                        render={({ field: { onChange, value, onBlur } }) => (
                            <Select value={value} onValueChange={onChange} onBlur={onBlur}>
                                <SelectTrigger loading={selectLoading}>
                                    <SelectValue 
                                        placeholder={field.placeholder} 
                                        loading={selectLoading}
                                        value={value}
                                        options={field.options}
                                    />
                                </SelectTrigger>
                                <SelectContent loading={selectLoading}>
                                    {field.options?.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                );
            case "Autocomplete":
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={field.validation}
                        render={({ field: { onChange, value, onBlur } }) => (
                            <Combobox
                                options={loadedOptions[field.name] || []}
                                value={value}
                                onChange={onChange}
                                onBlur={onBlur}
                                placeholder={field.placeholder}
                                loading={loadingOptions[field.name] || false}
                            />
                        )}
                    />
                );
            case "textarea":
                return <Textarea {...commonProps} rows={field.rows || 3} />;
            case "emailList":
                // Crear función validate dentro del componente para evitar problemas de serialización
                const emailListRules = field.validation?.validate 
                    ? field.validation 
                    : field.validation?.required 
                        ? {
                            validate: (emails) =>
                                Array.isArray(emails) && emails.length > 0
                                    ? true
                                    : field.validation.required || "Al menos un email es obligatorio",
                          }
                        : field.validation;
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={emailListRules}
                        render={({ field: { value, onChange } }) => (
                            <EmailListInput value={value || []} onChange={onChange} placeholder={field.placeholder} />
                        )}
                    />
                );
            default:
                return <Input {...commonProps} type={field.type || "text"} />;
        }
    };

    if (loading) return (
        <div className="h-full w-full flex items-center justify-center">
            <Loader className="h-10 w-10" />
        </div>
    );

    return (
        <div className="h-full flex flex-col ">
            <ScrollArea className="w-full h-full max-h-[70vh] p-2 ">
                <form
                    id="entity-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid grid-cols-1 sm:grid-cols-6 gap-x-0 gap-y-3 "
                >
                    {prepareValidations(fields).map((field, index) => (
                        <div
                            key={`${field.name}-${index}`}
                            className={`p-2 sm:col-span-${field.cols?.sm || 6} md:col-span-${field.cols?.md || 6} lg:col-span-${field.cols?.lg || 6} xl:col-span-${field.cols?.xl || 6}`}
                        >
                            <Label htmlFor={field.name} className="text-sm mb-1">
                                {field.label}
                            </Label>
                            {renderField(field)}
                            {errors[field.name] && (
                                <p className="text-red-400 text-xs pt-1">* {errors[field.name].message}</p>
                            )}
                        </div>
                    ))}
                </form>
            </ScrollArea>
            <div className="sm:col-span-6 p-4 flex justify-end gap-2 border-t bg-background">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="entity-form"
                        disabled={isSubmitting}
                        title={Object.keys(errors).length > 0 ? 'Hay errores. Pulsa para verlos junto a cada campo.' : undefined}
                        aria-label={Object.keys(errors).length > 0 ? 'Hay errores: pulsa para ver los detalles' : undefined}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar'
                        )}
                    </Button>
            </div>
        </div>
    );
}