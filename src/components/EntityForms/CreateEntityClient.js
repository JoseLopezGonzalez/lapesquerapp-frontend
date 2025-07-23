// components/CreateEntityClient.jsx
"use client";

import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useEffect, useState, useCallback } from "react"; // Added useCallback
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
import DatePicker from "@/components/Shadcn/Dates/DatePicker";
import { Combobox } from "@/components/Shadcn/Combobox";
import { API_URL_V2 } from "@/configs/config";
import EmailListInput from "@/components/ui/emailListInput";
import { ScrollArea } from "@/components/ui/scroll-area";

// Import the new service functions
import { fetchAutocompleteOptions, createEntity } from '@/services/createEntityService';
import { getToastTheme } from "@/customs/reactHotToast"; // Make sure this import exists and is correct


function prepareValidations(fields) {
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


export default function CreateEntityClient({ config }) {
    const { title, endpoint, successMessage, errorMessage } = config.createForm;
    const fields = config.fields;


    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ mode: "onChange" });

    const [loadedOptions, setLoadedOptions] = useState({});

    // Cargar dinámicamente los options de los campos con endpoint
    const loadAutocompleteOptions = useCallback(async () => {
        const result = {};
        await Promise.all(
            fields.map(async (field) => {
                if (field.type === "Autocomplete" && field.endpoint) {
                    try {
                        const options = await fetchAutocompleteOptions(`${API_URL_V2}${field.endpoint}`);
                        result[field.name] = options;
                    } catch (err) {
                        console.error(`Error cargando opciones para ${field.name}:`, err);
                        result[field.name] = [];
                        // Optionally, show a more specific toast here if an individual autocomplete fails
                    }
                }
            })
        );
        setLoadedOptions(result);
    }, [fields]); // Add fields to dependencies

    useEffect(() => {
        loadAutocompleteOptions();
    }, [loadAutocompleteOptions]); // Dependency on the useCallback function


    const onSubmit = async (data) => {
        try {
            const response = await createEntity(`${API_URL_V2}${endpoint}`, data);

            // You might not need to await response.json() here unless you need it for specific error details.
            // If response.ok, you likely just care that it succeeded.
            // const result = await response.json(); // Uncomment if needed

            if (response.ok) {
                toast.success(successMessage || "Entidad creada con éxito!", getToastTheme());
                reset(); // Clear form after successful submission
                // Redirect to the entity table page
                // Note: Using window.location.href forces a full page reload.
                // Consider useRouter().push() for a smoother Next.js navigation if appropriate.
                window.location.href = `/admin/${endpoint.split("/").pop()}`;
            } else {
                let userErrorMessage = errorMessage || "Error al crear la entidad";
                // Attempt to parse response for more specific error messages (e.g., validation errors)
                try {
                    const errorData = await response.json();
                    userErrorMessage = errorData.message || userErrorMessage;
                    // If your API returns field-specific errors, you could use them here
                    // e.g., if (errorData.errors) { /* map to form errors */ }
                } catch (parseError) {
                    console.error("Error parsing error response:", parseError);
                }
                toast.error(userErrorMessage, getToastTheme());
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
                    userErrorMessage = errorBody.message || userErrorMessage;
                }
            } else if (error instanceof Error) {
                userErrorMessage = error.message;
            }
            toast.error(userErrorMessage, getToastTheme());
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
                                <p className="text-red-400 text-xs pt-1">
                                    * {errors[field.name].message}
                                </p>
                            )}
                        </div>
                    ))}
                </form>
            </ScrollArea>
            <div className="sm:col-span-6 justify-end p-4 flex gap-2 border-t bg-background">
                <Button
                    type="button"
                    variant="outline"
                    className="ml-2"
                    onClick={() => reset()}
                >
                    Cancelar
                </Button>
                <Button type="submit" form="entity-form" disabled={isSubmitting}>
                    Crear
                </Button>
            </div>
        </div>
    );
}