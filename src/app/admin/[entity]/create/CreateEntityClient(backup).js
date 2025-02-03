"use client";

import { AutocompleteInput } from "@/components/Admin/Forms/GenericForm/InputTypes/AutocompleteInput";
import SelectInput from "@/components/Admin/Forms/GenericForm/InputTypes/SelectInput";
import { classNames } from "@/helpers/styles/classNames";
import { useState } from "react";
import { createPortal } from "react-dom";
import toast, { Toaster } from "react-hot-toast";

export default function CreateEntityClient({ config }) {
    if (!config?.createForm)
        return <p className="text-red-500">No se encontró la configuración de creación.</p>;

    const { title, endpoint, method, fields } = config.createForm;

    // Estado del formulario
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    // Manejar cambios en los inputs
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                toast.success("Entidad creada con éxito!");
                setFormData({}); // Resetear el formulario
            } else {
                toast.error("Error al crear la entidad");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Hubo un problema en la creación");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full">
            {loading ? (
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
                        <path
                            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                            fill="currentFill"
                        />
                    </svg>
                </div>
            ) : (
                // 📋 Formulario
                <div className="flex flex-col w-full h-full  bg-neutral-800 rounded-lg shadow-lg overflow-y-auto p-2 sm:p-14">
                    <h1 className="text-xl text-white  p-2">{title}</h1>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-6 gap-x-0 gap-y-3 p-5">
                        {fields.map((field) => (
                            <div key={field.name}
                                className={classNames(
                                    'p-2 ', // Añade estilos para verificar visualmente
                                    field.cols?.sm ? `sm:col-span-${field.cols.sm}` : '',
                                    field.cols?.md ? `md:col-span-${field.cols.md}` : '',
                                    field.cols?.lg ? `lg:col-span-${field.cols.lg}` : '',
                                    field.cols?.xl ? `xl:col-span-${field.cols.xl}` : ''
                                )}
                            >
                                <label className="block mb-2 text-sm  text-neutral-300">{field.label}</label>
                                {field.type === "textarea" ? (
                                    <textarea
                                        name={field.name}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        onChange={handleChange}
                                        className=" w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                                        rows="3"
                                    />
                                ) :
                                    field.type === "select" ? (
                                        <SelectInput
                                            name={field.name}
                                            required={field.required}
                                            onChange={(value) => setFormData({ ...formData, [field.name]: value })}
                                            options={field.options}
                                        />
                                    ) : field.type === "Autocomplete" ? (
                                        <AutocompleteInput
                                            placeholder={field.placeholder}
                                            endpoint={field.endpoint}
                                            onChange={(item) =>
                                                setFormData({
                                                    ...formData,
                                                    [field.name]: item.id,
                                                })
                                            }
                                            onDelete={() => setFormData({ ...formData, [field.name]: null })}
                                            value={formData[field.name]}
                                        />
                                    ) :
                                        (
                                            <input
                                                type={field.type}
                                                name={field.name}
                                                onChange={handleChange}
                                                required={field.required}
                                                placeholder={field.placeholder}
                                                className=" w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                                            />
                                        )}
                            </div>
                        ))}

                        <div className="sm:col-span-6 flex justify-end p-4">
                            <button
                                type="submit"
                                className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-1.5 rounded-lg"
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
