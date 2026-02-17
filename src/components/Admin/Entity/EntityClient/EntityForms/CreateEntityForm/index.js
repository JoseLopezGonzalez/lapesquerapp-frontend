// components/CreateEntityClient.jsx
"use client";

import { useForm, Controller } from "react-hook-form";import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/datePicker";
import { Combobox } from "@/components/Shadcn/Combobox";
import EmailListInput from "@/components/ui/emailListInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notify } from '@/lib/notifications';
import { format } from "date-fns"
import { Loader2 } from "lucide-react";

// Import domain services and mapper
import { getEntityService } from '@/services/domain/entityServiceMapper';import { getErrorMessage } from '@/lib/api/apiHelpers';
import { setErrorsFrom422 } from '@/lib/validation/setErrorsFrom422';


function prepareValidations(fields) {
    if (!fields || !Array.isArray(fields)) {
        return [];
    }
    return fields.map((field) => {
        const newField = { ...field };

        if (
            newField.validation?.pattern?.value &&
            typeof newField.validation.pattern.value === "string"
        ) {
            const raw = newField.validation.pattern.value;
            const regexBody = raw.replace(/^\/|\/$/g, ""); // Remove leading and trailing slashes
            newField.validation.pattern.value = new RegExp(regexBody);
        }
        return newField;
    });
}


export default function CreateEntityForm({ config, onSuccess, onCancel }) {
    const { title, endpoint, successMessage, errorMessage } = config.createForm;
    // Los campos pueden estar en config.fields o en config.createForm.fields
    const fields = config.createForm?.fields || config.fields || [];
    const router = useRouter();

    const {
        register,
        handleSubmit,
        control,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm({ mode: "onChange" });

    const [loadedOptions, setLoadedOptions] = useState({});
    const [loadingOptions, setLoadingOptions] = useState({});

    // Cargar dinámicamente los options de los campos con endpoint
    const loadAutocompleteOptions = useCallback(async () => {
        if (!fields || !Array.isArray(fields)) {
            return;
        }
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
                        console.error(`Error cargando opciones para ${field.name}:`, err);
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

    useEffect(() => {
        loadAutocompleteOptions();
    }, [loadAutocompleteOptions]); // Dependency on the useCallback function


    const onSubmit = async (data) => {
        try {
            // Convertir fechas a string YYYY-MM-DD si son Date
            const processedData = { ...data };
            Object.keys(processedData).forEach(key => {
                if (processedData[key] instanceof Date) {
                    processedData[key] = format(processedData[key], 'yyyy-MM-dd');
                }
            });

            // Convertir camelCase a snake_case para campos específicos si es necesario
            // Laravel normalmente hace esto automáticamente, pero por si acaso
            const snakeCaseMap = {
                'speciesId': 'species_id',
                'captureZoneId': 'capture_zone_id',
            };
            
            const finalData = {};
            
            // Primero, procesar todos los campos que NO están en el mapeo
            Object.keys(processedData).forEach(key => {
                if (!snakeCaseMap[key]) {
                    finalData[key] = processedData[key];
                }
            });
            
            // Luego, procesar los campos que SÍ están en el mapeo
            Object.keys(snakeCaseMap).forEach(camelKey => {
                const snakeKey = snakeCaseMap[camelKey];
                const value = processedData[camelKey];
                
                // Incluir el campo solo si tiene un valor válido
                if (value !== null && value !== undefined && value !== '') {
                    finalData[snakeKey] = value;
                }
            });

            const entityService = getEntityService(endpoint);
            if (!entityService) {
                notify.error({
                  title: 'Servicio no disponible',
                  description: 'No se encontró el servicio para esta entidad. Contacte al administrador.',
                });
                return;
            }

            try {
                const createdEntity = await entityService.create(finalData);
                const createdId = createdEntity?.id || createdEntity?.data?.id || null;

                notify.success({
                  title: 'Entidad creada',
                  description: successMessage || 'La entidad se ha creado correctamente.',
                });
                reset(); // Clear form after successful submission
                
                // Si es una producción y tenemos el ID, redirigir a la página de producción
                if (endpoint === "productions" && createdId) {
                    router.push(`/admin/productions/${createdId}`);
                } else {
                    // Para otras entidades, solo cerrar el modal
                    if (typeof onSuccess === 'function') onSuccess();
                }
            } catch (createError) {
                let userErrorMessage = errorMessage || "Error al crear la entidad";
                if (createError instanceof Response) {
                    try {
                        const errorData = await createError.json();
                        userErrorMessage = getErrorMessage(errorData) || userErrorMessage;
                        if (createError.status === 422 && errorData?.errors) {
                            setErrorsFrom422(setError, errorData.errors);
                        }
                    } catch (parseError) {
                        console.error("Error parsing error response:", parseError);
                    }
                } else if (createError instanceof Error) {
                    userErrorMessage = createError.userMessage || createError.message || userErrorMessage;
                }
                notify.error({ title: 'Error al crear entidad', description: userErrorMessage });
            }
        } catch (error) {
            console.error("Error al enviar el formulario:", error);
            let userErrorMessage = "Ocurrió un error inesperado";
            if (error instanceof Response) { // Catch errors thrown by the service
                if (error.status === 401) userErrorMessage = "No autorizado. Por favor, inicie sesión.";
                else if (error.status === 403) userErrorMessage = "Permiso denegado.";
                else if (error.status === 422) { // Unprocessable Entity - often for validation errors
                    // You might want to parse and display specific validation errors here
                    const errorBody = await error.json();
                    // Priorizar userMessage sobre message para mostrar errores en formato natural
                    userErrorMessage = errorBody.userMessage || errorBody.message || userErrorMessage;
                }
            } else if (error instanceof Error) {
                // Priorizar userMessage sobre message para mostrar errores en formato natural
                userErrorMessage = error.userMessage || error.data?.userMessage || error.response?.data?.userMessage || error.message || userErrorMessage;
            }
            notify.error({ title: 'Error al crear entidad', description: userErrorMessage });
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
                return (
                    <Controller
                        name={field.name}
                        control={control}
                        rules={field.validation}
                        render={({ field: { onChange, value, onBlur } }) => (
                            <Select value={value} onValueChange={onChange} onBlur={onBlur}>
                                <SelectTrigger>
                                    <SelectValue placeholder={field.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
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
                        defaultValue={field.defaultValue || ""}
                        render={({ field: { onChange, value, onBlur } }) => (
                            <Combobox
                                options={loadedOptions[field.name] || []}
                                value={value || ""}
                                onChange={(newValue) => {
                                    onChange(newValue || "");
                                }}
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
                        defaultValue={[]}
                        render={({ field: { value, onChange } }) => (
                            <EmailListInput value={value} onChange={onChange} placeholder={field.placeholder} />
                        )}
                    />
                );
            default:
                return <Input {...commonProps} type={field.type || "text"} />;
        }
    };

    return (
        <div className="h-full flex flex-col">
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
                                <p className="text-red-400 text-xs pt-1">
                                    * {errors[field.name].message}
                                </p>
                            )}
                        </div>
                    ))}
                </form>
            </ScrollArea>
            <div className="sm:col-span-6 p-4 flex justify-end gap-2 border-t bg-background">
                    <Button
                        type="button"
                        variant="outline"
                        className="ml-2"
                        onClick={onCancel ? onCancel : () => reset()}
                    >
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
                                Creando...
                            </>
                        ) : (
                            'Crear'
                        )}
                    </Button>
            </div>
        </div>
    );
}