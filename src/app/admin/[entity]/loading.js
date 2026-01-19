import { Skeleton } from "@/components/ui/skeleton";
import { LogoutAwareLoader } from "@/components/Utilities/LogoutAwareLoader";

export default function Loading() {
    // Simula una tabla con 6 columnas y 10 filas
    const columns = 6;
    const rows = 10;
    return (
        <LogoutAwareLoader>
            <div className="w-full h-full flex items-center justify-center bg-background">
                <div className="w-full max-w-6xl p-8">
                    <div className="overflow-x-auto rounded-lg border border-muted bg-white dark:bg-background shadow">
                        <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-foreground-50">
                                <tr>
                                    {[...Array(columns)].map((_, i) => (
                                        <th key={i} className="px-6 py-3">
                                            <Skeleton className="w-24 h-4 rounded" />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {[...Array(rows)].map((_, rowIdx) => (
                                    <tr key={rowIdx}>
                                        {[...Array(columns)].map((_, colIdx) => (
                                            <td key={colIdx} className="px-6 py-3">
                                                <Skeleton className="w-full h-6 rounded-lg" />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </LogoutAwareLoader>
    );
} 