"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { OrderRankingChart } from "./OrderRanking";
import { SalesBySalespersonPieChart } from "./SalesBySalespersonPieChart";
import { TotalQuantitySoldCard } from "./TotalQuantitySoldCard";
import { TotalAmountSoldCard } from "./TotalAmountSoldCard";
import { StockBySpeciesCard } from "./StockBySpeciesCard";
import { StockByProductsCard } from "./StockByProductsCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NewLabelingFeatureCard } from "./NewLabelingFeatureCard";
import { CurrentStockCard } from "./CurrentStockCard";
import { WorkingEmployeesCard } from "./WorkingEmployeesCard";
import { WorkerStatisticsCard } from "./WorkerStatisticsCard";
import { SalesChart } from "./SalesChart";
import { ReceptionChart } from "./ReceptionChart";
import { DispatchChart } from "./DispatchChart";
import { TransportRadarChart } from "./TransportRadarChart";
import Masonry from "react-masonry-css";

const breakpointColumnsObj = {
    default: 3,
    1920: 3,
    1536: 3,
    1280: 2,
    768: 1,
    640: 1,
};

const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 6 && hour < 12) {
        return "Buenos días,";
        } else if (hour >= 12 && hour < 20) {
        return "Buenas tardes,";
        } else {
        return "Buenas noches,";
        }
};

export default function Dashboard() {
    const [greeting] = useState(() => getGreeting());
    const { data: session } = useSession();
    const userName = session?.user?.name || "Usuario";

    return (
        <div className="h-full w-full flex flex-col gap-4 px-4 md:px-6 py-3">
            <ScrollArea className="w-full h-full pr-4">
                <div className="w-full h-full flex flex-col gap-4 pb-4">
                    <div className="w-full">
                        <div className="flex flex-col items-start justify-center mb-2 md:mb-4">
                            <p className="text-lg md:text-md text-neutral-500 dark:text-neutral-400">{greeting}</p>
                            <h1 className="text-3xl md:text-4xl font-light">{userName}</h1>
                        </div>
                    </div>

                    {/* Cards principales - Desocultar uno por uno para corregirlos */}
                    {/* 
                        ESTRATEGIA: Desocultar uno por uno para corregirlos
                        Para ocultar un card: cambiar a {false && ...}
                        Para desocultar: cambiar a {true && ...}
                    */}
                    {true && (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
                            {/* Card 1: CurrentStockCard - VISIBLE */}
                            {true && (
                                <div className="w-full overflow-hidden">
                                    <CurrentStockCard />
                                </div>
                            )}
                            
                            {/* Card 2: TotalQuantitySoldCard - VISIBLE */}
                            {true && (
                                <div className="w-full h-full overflow-hidden">
                                    <TotalQuantitySoldCard />
                                </div>
                            )}
                            
                            {/* Card 3: TotalAmountSoldCard - VISIBLE */}
                            {true && (
                                <div className="w-full h-full overflow-hidden">
                                    <TotalAmountSoldCard />
                                </div>
                            )}
                            
                            {/* Card 4: NewLabelingFeatureCard - VISIBLE */}
                            {true && (
                                <div className="w-full overflow-hidden hidden sm:block">
                                    <NewLabelingFeatureCard />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gráficos en Masonry - Desocultar uno por uno para corregirlos */}
                    {true && (
                        <Masonry
                            breakpointCols={breakpointColumnsObj}
                            className="masonry-grid"
                            columnClassName="masonry-grid_column"
                        >
                            {/* Gráfico 1: OrderRankingChart - VISIBLE */}
                            {true && (
                                <div>
                                    <OrderRankingChart />
                                </div>
                            )}
                            
                            {/* Gráfico 2: SalesBySalespersonPieChart - VISIBLE */}
                            {true && (
                                <div>
                                    <SalesBySalespersonPieChart />
                                </div>
                            )}
                            
                            {/* Gráfico 3: StockBySpeciesCard - VISIBLE */}
                            {true && (
                                <div>
                                    <StockBySpeciesCard />
                                </div>
                            )}
                            
                            {/* Gráfico 4: StockByProductsCard - VISIBLE */}
                            {true && (
                                <div>
                                    <StockByProductsCard />
                                </div>
                            )}
                            
                            {/* Gráfico 5: SalesChart - VISIBLE */}
                            {true && (
                                <div className="w-full min-w-0 max-w-full box-border overflow-hidden">
                                    <SalesChart />
                                </div>
                            )}
                            
                            {/* Gráfico 6: ReceptionChart - VISIBLE */}
                            {true && (
                                <div>
                                    <ReceptionChart />
                                </div>
                            )}
                            
                            {/* Gráfico 7: DispatchChart - VISIBLE */}
                            {true && (
                                <div>
                                    <DispatchChart />
                                </div>
                            )}
                            
                            {/* Gráfico 8: TransportRadarChart - VISIBLE */}
                            {true && (
                                <div>
                                    <TransportRadarChart />
                                </div>
                            )}
                            
                            {/* Gráfico 9: WorkingEmployeesCard - VISIBLE */}
                            {true && (
                                <div>
                                    <WorkingEmployeesCard />
                                </div>
                            )}
                            
                            {/* Gráfico 10: WorkerStatisticsCard - VISIBLE */}
                            {true && (
                                <div>
                                    <WorkerStatisticsCard />
                                </div>
                            )}
                        </Masonry>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
