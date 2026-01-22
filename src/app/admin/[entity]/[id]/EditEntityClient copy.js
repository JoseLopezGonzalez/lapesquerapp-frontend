"use client";

import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
import { fetchWithTenant } from "@lib/fetchWithTenant";

export function mapApiDataToFormValues(fields, data) {
    const result = {};

    for (const field of fields) {
        const key = field.name;

        if (field.path) {
            // Usamos lodash.get para acceder a rutas anidadas como 'fishingGear.id'
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

export default function EditEntityClient({ config }) {
    const { id } = useParams();
    const router = useRouter();

    const {
        title,
        endpoint,
        method = "PUT",
        successMessage,
        errorMessage,
    } = config.editForm;

    const fields = config.fields;
    // Reutilizamos solo los campos

    const {
        register, handleSubmit, control, reset,
        formState: { errors, isSubmitting },
    } = useForm({ mode: "onChange" });

    const [loadedOptions, setLoadedOptions] = useState({});
    const [loadingOptions, setLoadingOptions] = useState({});
    const [loading, setLoading] = useState(true);

    // Cargar datos de la entidad
    useEffect(() => {
        const fetchWithTenantData = async () => {
            const session = await getSession();
            const res = await fetchWithTenant(`${API_URL_V2}${endpoint}/${id}`, {
                headers: {
                    Authorization: `Bearer ${session?.user?.accessToken}`,
                },
            });

            const data = await res.json();
            const formValues = mapApiDataToFormValues(fields, data.data);
            reset(formValues);
            setLoading(false);
        };
        fetchWithTenantData();
    }, [id]);

    // Cargar opciones para Autocomplete
    useEffect(() => {
        const fetchWithTenantOptions = async () => {
            const session = await getSession();
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
                            const res = await fetchWithTenant(`${API_URL_V2}${field.endpoint}`, {
                                headers: {
                                    Authorization: `Bearer ${session?.user?.accessToken}`,
                                },
                            });
                            const data = await res.json();
                            result[field.name] = data.map((item) => ({
                                value: item.id,
                                label: item.name,
                            }));
                        } catch (err) {
                            console.error(`Error cargando ${field.name}`, err);
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
        };

        fetchWithTenantOptions();
    }, [fields]);

    const onSubmit = async (data) => {
        try {
            const session = await getSession();
            const res = await fetchWithTenant(`${API_URL_V2}${endpoint}/${id}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken}`,
                },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                toast.success(successMessage, getToastTheme());
                /* router.push(`/admin/${endpoint}`); */
            } else {
                toast.error(errorMessage, getToastTheme());
            }
        } catch (err) {
            console.error(err);
            toast.error("Error inesperado");
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
        </div>)

    return (
        <div className="h-full">
            <div className="flex flex-col w-full h-full rounded-lg shadow-lg overflow-y-auto p-2 sm:p-14">
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

