"use client";

import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { getSession } from "next-auth/react";
import { useEffect, useState } from "react";
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

export default function CreateEntityClient({ config }) {
    const { title, endpoint, fields, successMessage, errorMessage } = config.createForm;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ mode: "onChange" });

    const [loadedOptions, setLoadedOptions] = useState({});

    // Cargar dinámicamente los options de los campos con endpoint
    useEffect(() => {
        const fetchOptions = async () => {
            const result = {};

            await Promise.all(
                fields.map(async (field) => {
                    if (field.type === "Autocomplete" && field.endpoint) {
                        try {
                            const res = await fetch(`/api/${field.endpoint}`);
                            const data = await res.json();
                            result[field.name] = data;
                        } catch (err) {
                            console.error(`Error cargando opciones para ${field.name}`, err);
                            result[field.name] = [];
                        }
                    }
                })
            );

            setLoadedOptions(result);
        };

        fetchOptions();
    }, [fields]);

    const onSubmit = async (data) => {
        try {
            const session = await getSession();
            const response = await fetch("/api/submit-entity", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${session?.user?.accessToken}`,
                    "User-Agent": navigator.userAgent,
                },
                body: JSON.stringify({ endpoint, data }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(successMessage || "Entidad creada con éxito!");
                reset();
            } else {
                toast.error(errorMessage || "Error al crear la entidad");
            }
        } catch (error) {
            console.error("Error al enviar el formulario:", error);
            toast.error("Ocurrió un error inesperado");
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
            default:
                return <Input {...commonProps} type={field.type || "text"} />;
        }
    };

    return (
        <div className="h-full">
            <div className="flex flex-col w-full h-full rounded-lg shadow-lg overflow-y-auto p-2 sm:p-14">
                <h1 className="text-xl p-2">{title}</h1>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid grid-cols-1 sm:grid-cols-6 gap-x-0 gap-y-3 p-5"
                >
                    {fields.map((field, index) => (
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

                    <div className="sm:col-span-6 flex justify-end p-4">
                        <Button type="submit" disabled={isSubmitting}>
                            Agregar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
