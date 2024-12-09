'use client';

export const TextAreaFilter = ({ filter }) => {
    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-3 h-full">
            <div className="col-span-2">
                <div className="flex w-full flex-col">
                    <label
                        htmlFor={filter.name}
                        className="w-full mb-2 text-xs font-medium text-neutral-400"
                    >
                        {filter.label}
                    </label>
                    <textarea
                        id={filter.name}
                        rows="4"
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 text-neutral-900 text-sm rounded-xl focus:ring-sky-500 focus:border-sky-500 block p-2.5 dark:bg-neutral-700 dark:border-neutral-600 dark:placeholder-neutral-500 placeholder:italic dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500"
                        placeholder={filter.placeholder}
                    />
                </div>
            </div>
        </div>
    );
};
