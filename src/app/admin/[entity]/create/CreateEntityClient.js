"use client";

import { AutocompleteInput } from "@/components/Admin/Forms/GenericForm/InputTypes/AutocompleteInput";
import SelectInput from "@/components/Admin/Forms/GenericForm/InputTypes/SelectInput";
import { classNames } from "@/helpers/styles/classNames";
import { useForm, Controller } from "react-hook-form";
import { createPortal } from "react-dom";
import toast, { Toaster } from "react-hot-toast";

export default function CreateEntityClient({ config }) {


    const { title, endpoint, method, fields } = config.createForm;

    // Configurar `react-hook-form`
    const {
        register,
        handleSubmit,
        setValue,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm();

    if (!config?.createForm)
        return <p className="text-red-500">No se encontró la configuración de creación.</p>;

    // Manejar envío del formulario
    const onSubmit = async (data) => {
        try {
            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Entidad creada con éxito!");
                reset(); // Resetear el formulario
            } else {
                toast.error("Error al crear la entidad");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Hubo un problema en la creación");
        }
    };

    return (
        <div className="h-full">
            {isSubmitting ? (
                // 🔄 Spinner de carga
                <div className="py-3 flex justify-center items-center h-[50vh]">
                    <svg
                        aria-hidden="true"
                        className="w-12 h-12 text-neutral-200 animate-spin dark:text-neutral-600 fill-blue-600"
                        viewBox="0 0 100 101"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
            ) : (
                // 📋 Formulario
                <div className="flex flex-col w-full h-full bg-neutral-800 rounded-lg shadow-lg overflow-y-auto p-2 sm:p-14">
                    <h1 className="text-xl text-white p-2">{title}</h1>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-6 gap-x-0 gap-y-3 p-5">
                        {console.log(errors)}
                        {fields.map((field) => (
                            <div
                                key={field.name}
                                className={classNames(
                                    "p-2",
                                    field.cols?.sm ? `sm:col-span-${field.cols.sm}` : "",
                                    field.cols?.md ? `md:col-span-${field.cols.md}` : "",
                                    field.cols?.lg ? `lg:col-span-${field.cols.lg}` : "",
                                    field.cols?.xl ? `xl:col-span-${field.cols.xl}` : ""
                                )}
                            >
                                <label className="block mb-2 text-sm text-neutral-300">{field.label}</label>

                                {/* Autocomplete Input */}
                                {field.type === "Autocomplete" ? (
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        rules={field.validation || {}}
                                        render={({ field: inputField }) => (
                                            <AutocompleteInput {...inputField} endpoint={field.endpoint} />
                                        )}
                                    />
                                ) : field.type === "select" ? (
                                    <Controller
                                        name={field.name}
                                        control={control}
                                        rules={field.validation || {}}
                                        render={({ field: inputField }) => (
                                            <SelectInput {...inputField} options={field.options} />
                                        )}
                                    />
                                ) : field.type === "textarea" ? (
                                    <textarea
                                        {...register(field.name, field.validation || {})}
                                        placeholder={field.placeholder}
                                        className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                                        rows="3"
                                    />
                                ) : (
                                    <input
                                        {...register(field.name, field.validation || {})}
                                        type={field.type}
                                        placeholder={field.placeholder}
                                        className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                                    />
                                )}

                                {errors[field.name] && <p className="text-red-400 font-regular text-xs">* {errors[field.name].message}</p>}
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
            )}

            {/* Toaster para notificaciones */}
            {createPortal(<Toaster position="top-right" />, document.body)}
        </div>
    );
}
