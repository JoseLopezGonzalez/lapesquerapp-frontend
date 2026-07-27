'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { OrderRankingChart } from './OrderRanking';
import { SalesBySalespersonPieChart } from './SalesBySalespersonPieChart';
import { TotalQuantitySoldCard } from './TotalQuantitySoldCard';
import { TotalAmountSoldCard } from './TotalAmountSoldCard';
import { StockBySpeciesCard } from './StockBySpeciesCard';
import { StockByProductsCard } from './StockByProductsCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CurrentStockCard } from './CurrentStockCard';
import { WorkingEmployeesCard } from './WorkingEmployeesCard';
import { WorkerStatisticsCard } from './WorkerStatisticsCard';
import { SalesChart } from './SalesChart';
import { ReceptionChart } from './ReceptionChart';
import { DispatchChart } from './DispatchChart';
import { TransportRadarChart } from './TransportRadarChart';
import { DailyCalibersBySpeciesCard } from './DailyCalibersBySpeciesCard';
import { OrdersProfitabilitySummaryCard } from './OrdersProfitabilitySummaryCard';
import { OrdersProfitabilityProductsCard } from './OrdersProfitabilityProductsCard';
import { CompanySetupAlert } from './CompanySetupAlert';
import { AuxiliaryLinesByProductCard } from './AuxiliaryLinesByProductCard';
import { AuxiliaryLinesByCustomerCard } from './AuxiliaryLinesByCustomerCard';
import { AuxiliaryLinesChartCard } from './AuxiliaryLinesChartCard';
import Masonry from 'react-masonry-css';

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
    return 'Buenos días,';
  } else if (hour >= 12 && hour < 20) {
    return 'Buenas tardes,';
  } else {
    return 'Buenas noches,';
  }
};

export default function Dashboard() {
  const [greeting] = useState(() => getGreeting());
  const { data: session } = useSession();
  const userName = session?.user?.name || 'Usuario';
  const userRole = Array.isArray(session?.user?.role) ? session.user.role[0] : session?.user?.role;
  const isSupervisor = userRole === 'supervisor';

  return (
    <div className="flex h-full w-full flex-col gap-4 px-4 py-3 md:px-6">
      <CompanySetupAlert />
      <ScrollArea className="h-full w-full pr-4">
        <div className="flex h-full w-full flex-col gap-4 pb-4">
          <div className="w-full">
            <div className="mb-2 flex flex-col items-start justify-center md:mb-4">
              <p className="md:text-md text-lg text-neutral-500 dark:text-neutral-400">
                {greeting}
              </p>
              <h1 className="text-3xl font-light md:text-4xl">{userName}</h1>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
            <div className="w-full overflow-hidden">
              <CurrentStockCard />
            </div>
            <div className="h-full w-full overflow-hidden">
              <TotalQuantitySoldCard />
            </div>
            <div className="h-full w-full overflow-hidden">
              <TotalAmountSoldCard />
            </div>
            <div className="w-full overflow-hidden">
              <OrdersProfitabilitySummaryCard />
            </div>
          </div>

          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            <div>
              <DailyCalibersBySpeciesCard />
            </div>
            {!isSupervisor && (
              <div>
                <OrderRankingChart />
              </div>
            )}
            <div>
              <SalesBySalespersonPieChart />
            </div>
            <div>
              <StockBySpeciesCard />
            </div>
            <div>
              <StockByProductsCard />
            </div>
            <div className="box-border w-full max-w-full min-w-0 overflow-hidden">
              <OrdersProfitabilityProductsCard />
            </div>
            <div className="box-border w-full max-w-full min-w-0 overflow-hidden">
              <SalesChart />
            </div>
            <div className="box-border w-full max-w-full min-w-0 overflow-hidden">
              <AuxiliaryLinesChartCard />
            </div>
            <div className="box-border w-full max-w-full min-w-0 overflow-hidden">
              <AuxiliaryLinesByProductCard />
            </div>
            <div className="box-border w-full max-w-full min-w-0 overflow-hidden">
              <AuxiliaryLinesByCustomerCard />
            </div>
            <div>
              <ReceptionChart />
            </div>
            <div>
              <DispatchChart />
            </div>
            <div>
              <TransportRadarChart />
            </div>
            <div>
              <WorkingEmployeesCard />
            </div>
            <div className="max-w-full min-w-0 overflow-hidden">
              <WorkerStatisticsCard />
            </div>
          </Masonry>
        </div>
      </ScrollArea>
    </div>
  );
}
