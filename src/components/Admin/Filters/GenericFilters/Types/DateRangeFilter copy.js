import { DateRangePicker } from "@nextui-org/react";
import { parseDate } from "@internationalized/date";


const MyComponent = () => {



    return (
        <DateRangePicker
            /* defaultValue={{
                start: parseDate("2024-04-01"),
                end: parseDate("2024-04-08"),
            }} */
                visibleMonths={2}
            className= 'mb-4 dark:text-white'
            classNames={{
                innerWrapper: "bg-transparent dark:text-white",
                inputWrapper: [
                  "border text-sm rounded-xl h-5 block w-full flex items-center bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-500 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500",
                ],
            }}
            /* label="Stay duration" */
            calendarProps={{
                classNames: {
                   
                    base: "text-sm rounded-xl block w-full p-2.5 bg-neutral-50 text-neutral-900 placeholder-neutral-500 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700/50 dark:border-neutral-600 dark:placeholder-neutral-500 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500",
                    headerWrapper: "pt-4 bg-transparent dark:text-white",
                    prevButton: "  rounded-small ",
                    nextButton: " rounded-small",
                    gridHeader: "bg-transparent shadow-none ",
                    cellButton: [
                        "data-[today=true]:dark:text-sky-500 data-[selected=true]:dark:bg-transparent rounded-small data-[selected=true]:dark:text-white",
                        // start (pseudo)
                        "data-[range-start=true]:before:rounded-l-small",

                        "data-[selection-start=true]:before:rounded-l-small",
                        // end (pseudo)
                        "data-[range-end=true]:before:rounded-r-small",
                        "data-[selection-end=true]:before:rounded-r-small",
                        // start (selected)
                        "data-[selected=true]:data-[selection-start=true]:data-[range-selection=true]:rounded-small ",
                        "data-[selected=true]:data-[selection-start=true]:data-[range-selection=true]:dark:bg-sky-500",
                        // end (selected)
                        "data-[selected=true]:data-[selection-end=true]:data-[range-selection=true]:rounded-small",
                        "data-[selected=true]:data-[selection-end=true]:data-[range-selection=true]:dark:bg-sky-500",
                        'data-[range-selection=true]:before:dark:bg-sky-900/50',
                    ],
                },
            }}
        />
    );
}

export default MyComponent;
