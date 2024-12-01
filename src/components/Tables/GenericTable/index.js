import React from "react";

export const GenericTable = ({ data, config, onAction }) => {
  const { headers } = config.table;

  return (
    <div className="w-full h-full p-4">
      {/* Table container */}
      <div className="w-full overflow-x-auto border rounded-lg bg-neutral-900/50 border-neutral-700">
        <table className="w-full table-auto text-left">
          {/* Table Head */}
          <thead className="bg-neutral-800 sticky top-0 z-10">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.name}
                  className="px-6 py-3 text-sm font-semibold text-neutral-200 uppercase"
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-neutral-700">
            {data.loading ? (
              // Skeleton rows for loading state
              [...Array(5)].map((_, index) => (
                <tr key={index}>
                  {headers.map((_, index) => (
                    <td key={index} className="px-6 py-3">
                      <div className="w-full h-6 bg-neutral-600 rounded-md animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.rows.length > 0 ? (
              data.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-neutral-800 transition-colors"
                >
                  {headers.map((header) => (
                    <td
                      key={header.name}
                      className={`px-6 py-3 ${
                        header.type === "text" ? "text-white" : ""
                      }`}
                    >
                      {header.type === "text" && row[header.name]}
                      {header.type === "button" && (
                        <div className="flex gap-2">
                          {Object.keys(row[header.name]).map((action) => (
                            <button
                              key={action}
                              className={`py-1 px-3 rounded-md ${
                                action === "delete"
                                  ? "bg-red-500 hover:bg-red-600"
                                  : "bg-blue-500 hover:bg-blue-600"
                              } text-white`}
                              onClick={() =>
                                onAction(action, row[header.name][action])
                              }
                            >
                              {action === "delete" ? "Eliminar" : "Ver"}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-10 text-center text-neutral-400"
                >
                  No hay datos disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
