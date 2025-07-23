// components/EditEntityClient.jsx
"use client";

import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useEffect, useState, useCallback } from "react"; // Added useCallback
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/Shadcn/Dates/DatePicker";
import { Combobox } from "@/components/Shadcn/Combobox";
import EmailListInput from "@/components/ui/emailListInput";
import { API_URL_V2 } from "@/configs/config";

import get from "lodash.get";
import { getToastTheme } from "@/customs/reactHotToast";
import Loader from "@/components/Utilities/Loader";

// Import the new service functions
import { fetchEntityData, fetchAutocompleteOptions, submitEntityForm } from '@/services/editEntityService';

export function mapApiDataToFormValues(fields, data) {
    const result = {};

    for (const field of fields) {
        const key = field.name;

        if (field.path) {
            result[key] = get(data, field.path, null);
        } else {
            result[key] = data[key];
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

export default function EditEntityClient({ config, id: propId }) {
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
        register, handleSubmit, control, reset,
        formState: { errors, isSubmitting },
    } = useForm({ mode: "onChange" });

    const [loadedOptions, setLoadedOptions] = useState({});
    const [loading, setLoading] = useState(true);

    // Function to fetch and set entity data
    const loadEntityData = useCallback(async () => {
        try {
            const data = await fetchEntityData(`${API_URL_V2}${endpoint}/${id}`);
            const formValues = mapApiDataToFormValues(fields, data);
            reset(formValues);
        } catch (err) {
            let userMessage = "Error al cargar los datos de la entidad.";
            if (err instanceof Response) {
                if (err.status === 401) userMessage = "No autorizado. Por favor, inicie sesión.";
                else if (err.status === 403) userMessage = "Permiso denegado.";
                else userMessage = `Error ${err.status}: ${userMessage}`;
            }
            toast.error(userMessage, getToastTheme());
            console.error("Error loading entity data:", err);
            // Optionally redirect on error if data is critical
            // router.push('/error-page');
        } finally {
            setLoading(false);
        }
    }, [id, endpoint, fields, reset]); // Add reset to dependencies

    // Function to fetch autocomplete options
    const loadAutocompleteOptions = useCallback(async () => {
        const result = {};
        await Promise.all(
            fields.map(async (field) => {
                if (field.type === "Autocomplete" && field.endpoint) {
                    try {
                        const options = await fetchAutocompleteOptions(`${API_URL_V2}${field.endpoint}`);
                        result[field.name] = options;
                    } catch (err) {
                        console.error(`Error cargando opciones de ${field.name}:`, err);
                        result[field.name] = [];
                        // Optionally show a toast here if an individual autocomplete fails
                    }
                }
            })
        );
        setLoadedOptions(result);
    }, [fields]); // Add fields to dependencies

    // Load initial data and options on component mount
    useEffect(() => {
        loadEntityData();
        loadAutocompleteOptions();
    }, [loadEntityData, loadAutocompleteOptions]);


    const onSubmit = async (data) => {
        try {
            await submitEntityForm(`${API_URL_V2}${endpoint}/${id}`, method, data);
            toast.success(successMessage, getToastTheme());
            // router.push(`/admin/${endpoint}`); // Uncomment if you want to redirect after success
        } catch (err) {
            let userMessage = errorMessage || "Error inesperado al guardar.";
            if (err instanceof Response) {
                if (err.status === 401) userMessage = "No autorizado. Por favor, inicie sesión.";
                else if (err.status === 403) userMessage = "Permiso denegado.";
                else if (err.status === 422) { // Unprocessable Entity - often for validation errors
                    const errorBody = await err.json();
                    userMessage = errorBody.message || userMessage;
                    // You might want to display specific field errors from errorBody.errors here
                }
            }
            toast.error(userMessage, getToastTheme());
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
                            <DatePicker value={value} onChange={onChange} onBlur={onBlur} />
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
                        render={({ field: { onChange, value, onBlur } }) => (
                            <Combobox
                                options={loadedOptions[field.name] || []}
                                value={value}
                                onChange={onChange}
                                onBlur={onBlur}
                                placeholder={field.placeholder}
                            />
                        )}
                    />
                );
            case "textarea":
                return <Textarea {...commonProps} rows={field.rows || 3} />;
            case "emailList":
                return (
                    <Controller
                        name={field.name}
                        control={control}
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
        <div className="h-full">
            <div className="flex flex-col w-full h-full overflow-y-auto p-2 sm:p-14">
                <h1 className="text-xl p-2">{title}</h1>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid grid-cols-1 sm:grid-cols-6 gap-x-0 gap-y-3 p-5"
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

                    <div className="sm:col-span-6 justify-end p-4 flex gap-2">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            Guardar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}