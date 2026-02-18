"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { OrderRankingChart } from "../OrderRanking";
import { SalesBySalespersonPieChart } from "../SalesBySalespersonPieChart";
import { TotalQuantitySoldCard } from "../TotalQuantitySoldCard";
import { TotalAmountSoldCard } from "../TotalAmountSoldCard";
import { TransportRadarChart } from "../TransportRadarChart";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    if (hour >= 6 && hour < 12) return "Buenos días,";
    if (hour >= 12 && hour < 20) return "Buenas tardes,";
    return "Buenas noches,";
};

export default function ComercialDashboard() {
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

                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="w-full h-full overflow-hidden">
                            <TotalQuantitySoldCard />
                        </div>
                        <div className="w-full h-full overflow-hidden">
                            <TotalAmountSoldCard />
                        </div>
                    </div>

                    <Masonry
                        breakpointCols={breakpointColumnsObj}
                        className="masonry-grid"
                        columnClassName="masonry-grid_column"
                    >
                        <div>
                            <OrderRankingChart />
                        </div>
                        <div>
                            <SalesBySalespersonPieChart />
                        </div>
                        <div>
                            <TransportRadarChart />
                        </div>
                    </Masonry>
                </div>
            </ScrollArea>
        </div>
    );
}
