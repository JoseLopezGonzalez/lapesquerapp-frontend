import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";



export default function SummaryPieChart({ data }) {

    const COLORS = [
        '#8884d8', // violeta suave
        '#82ca9d', // verde menta
        '#ffc658', // amarillo pastel
        '#ff7f50', // coral suave
        '#a3e1d4', // verde agua claro
        '#d62728', // rojo
        '#8dd1e1', // azul celeste
        '#c6b3ec', // lavanda
        '#fcbf49', // mostaza claro
        '#e377c2', // rosa fuerte
        '#b5bd89', // verde oliva claro
        '#ffbb28', // amarillo dorado
    ];


    return (
        <div className="w-full flex flex-col gap-4 mt-20">
            {data.length === 0 ? (
                <span className="text-muted-foreground italic">Sin datos para mostrar</span>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Leyenda personalizada */}
                    <div className="flex flex-wrap gap-4 justify-center mt-2">
                        {data.map((entry, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div
                                    className="w-4 h-4 rounded-sm"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span>{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );

}
