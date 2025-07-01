// components/dashboard/DashboardCardWrapper.jsx

import { OrderRankingChart } from "./OrderRanking";

export default function Dashboard() {
    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 auto-rows-min">
            <div className="flex w-full ">
                <OrderRankingChart />
            </div>
        </div>
    );
}
