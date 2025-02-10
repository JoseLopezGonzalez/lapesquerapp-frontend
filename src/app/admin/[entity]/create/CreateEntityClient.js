"use client";

import { AutocompleteInput } from "@/components/Admin/Forms/GenericForm/InputTypes/AutocompleteInput";
import SelectInput from "@/components/Admin/Forms/GenericForm/InputTypes/SelectInput";
import { classNames } from "@/helpers/styles/classNames";
import { useForm, Controller } from "react-hook-form";
import { createPortal } from "react-dom";
import toast, { Toaster } from "react-hot-toast";
import { API_URL_V2 } from "@/configs/config";
import { getSession } from "next-auth/react";

export default function CreateEntityClient({ config }) {


    const { title, endpoint, method, fields, successMessage, errorMessage } = config.createForm;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: 'onChange', // Valida al enviar el formulario
        reValidateMode: 'onChange', // Vuelve a validar al cambiar el valor
    });

    // Manejar envío del formulario
    const onSubmit = async (production) => {

        return await fetch(`https://api.congeladosbrisamar.es/api/v1/productions`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(production)
        })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => {throw new Error(error)})
            .finally(() => console.log('Finalizado'));
    }


    return (
        <div className="h-full">

            <div className="flex flex-col w-full h-full bg-neutral-800 rounded-lg shadow-lg overflow-y-auto p-2 sm:p-14">
                <h1 className="text-xl text-white p-2">{title}</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-6 gap-x-0 gap-y-3 p-5">
                    {fields.map((field, index) => (
                        <div
                            key={`${field.name}-${index}`}
                            className={classNames(
                                "p-2",
                                field.cols?.sm ? `sm:col-span-${field.cols.sm}` : "",
                                field.cols?.md ? `md:col-span-${field.cols.md}` : "",
                                field.cols?.lg ? `lg:col-span-${field.cols.lg}` : "",
                                field.cols?.xl ? `xl:col-span-${field.cols.xl}` : ""
                            )}
                        >
                            <label className="block mb-2 text-sm text-neutral-300">{field.label}</label>

                            {field.type === "Autocomplete" && (
                                <Controller
                                    name={field.name}
                                    control={control}
                                    rules={field.validation || {}}
                                    render={({ field: inputField }) => (
                                        <AutocompleteInput {...inputField} endpoint={field.endpoint} />
                                    )}
                                />
                            )}

                            {field.type === "select" && (
                                <Controller
                                    name={field.name}
                                    control={control}
                                    rules={field.validation || {}}
                                    render={({ field: inputField }) => (
                                        <SelectInput {...inputField} options={field.options} />
                                    )}
                                />
                            )}

                            {field.type === "textarea" && (
                                <textarea
                                    {...register(field.name, field.validation || {})}
                                    placeholder={field.placeholder}
                                    className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                                    rows="3"
                                />
                            )}



                            {(field.type !== "Autocomplete" && field.type !== "select" && field.type !== "textarea" && field.type !== 'password') &&
                                (
                                    <input
                                        {...register(field.name, field.validation || {})}
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        name={field.name}
                                        className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                                    />
                                )
                            }

                            {errors[field.name] && <p className="text-red-400 font-regular text-xs pt-1">* {errors[field.name].message}</p>}
                        </div>
                    ))}

                    <div className="sm:col-span-6 flex justify-end p-4">
                        <button
                            type="submit"
                            className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-1.5 rounded-lg"
                            disabled={isSubmitting}
                        >
                            Agregar
                        </button>
                    </div>
                </form>
            </div>


        </div>
    );
}
