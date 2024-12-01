import React, { useState } from "react";
import Modal from "../../Modals/GenericModal";


export const GenericFilters = ({ config, open, onApply, onReset, onClose }) => {
    const [draftFilters, setDraftFilters] = useState({});

    const handleChange = (name, value) => {
        setDraftFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = () => {
        onApply(draftFilters);
    };

    const handleReset = () => {
        setDraftFilters({});
        onReset();
    };

    return (
        <Modal showModal={open} onClose={onClose} size="lg">
            <h2 className="text-xl font-bold mb-4">Filtros</h2>
            <div className="space-y-4">
                {config.map((filter) => (
                    <div key={filter.name}>
                        <label className="block text-sm font-medium">
                            {filter.label}
                        </label>
                        {filter.type === "text" && (
                            <input
                                type="text"
                                value={draftFilters[filter.name] || ""}
                                onChange={(e) => handleChange(filter.name, e.target.value)}
                                className="w-full p-2 border rounded-md"
                                placeholder={filter.placeholder}
                            />
                        )}
                        {filter.type === "textarea" && (
                            <textarea
                                value={draftFilters[filter.name] || ""}
                                onChange={(e) => handleChange(filter.name, e.target.value)}
                                className="w-full p-2 border rounded-md"
                                placeholder={filter.placeholder}
                            />
                        )}
                        {filter.type === "dateRange" && (
                            <div className="flex space-x-2">
                                <input
                                    type="date"
                                    value={draftFilters[filter.name]?.start || ""}
                                    onChange={(e) =>
                                        handleChange(filter.name, {
                                            ...draftFilters[filter.name],
                                            start: e.target.value,
                                        })
                                    }
                                    className="w-1/2 p-2 border rounded-md"
                                />
                                <input
                                    type="date"
                                    value={draftFilters[filter.name]?.end || ""}
                                    onChange={(e) =>
                                        handleChange(filter.name, {
                                            ...draftFilters[filter.name],
                                            end: e.target.value,
                                        })
                                    }
                                    className="w-1/2 p-2 border rounded-md"
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
                <button
                    onClick={handleReset}
                    className="py-2 px-4 bg-gray-500 text-white rounded-md"
                >
                    Resetear
                </button>
                <button
                    onClick={handleSubmit}
                    className="py-2 px-4 bg-blue-500 text-white rounded-md"
                >
                    Aplicar
                </button>
            </div>
        </Modal>
    );
};
