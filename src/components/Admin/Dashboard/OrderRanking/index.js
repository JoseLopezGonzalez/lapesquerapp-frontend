'use client';

import { notify } from '@/lib/notifications';
import { useState } from 'react';
import { SearchX } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  formatDecimalCurrency,
  formatDecimalWeight,
} from '@/helpers/formats/numbers/formatNumbers';
import { useSpeciesOptions } from '@/hooks/useSpeciesOptions';
import { useOrderRankingStats } from '@/hooks/useOrdersStats';
import { Skeleton } from '@/components/ui/skeleton';
import { actualYearRange } from '@/helpers/dates';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/dateRangePicker';
import Loader from '@/components/Utilities/Loader';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';

const initialDateRange = {
  from: actualYearRange.from,
  to: actualYearRange.to,
};

export function OrderRankingChart() {
  const [groupBy, setGroupBy] = useState('client');
  const [valueType, setValueType] = useState('totalAmount');
  const [speciesId, setSpeciesId] = useState('all');
  const [range, setRange] = useState(initialDateRange);

  const { data: speciesOptions = [], isLoading: speciesLoading } = useSpeciesOptions();
  const {
    data: chartData = [],
    fullData = [],
    isLoading,
  } = useOrderRankingStats({
    range,
    groupBy,
    valueType,
    speciesId,
  });

  const chartConfig = {
    totalAmount: {
      value: {
        label: 'Importe',
        color: 'var(--chart-1)',
      },
      formatter: formatDecimalCurrency,
    },
    totalQuantity: {
      value: {
        label: 'Cantidad',
        color: 'var(--chart-1)',
      },
      formatter: formatDecimalWeight,
    },
  }[valueType];

  const handleExportToExcel = async () => {
    if (fullData.length === 0) {
      notify.error({ title: 'No hay datos para exportar' });
      return;
    }

    const [XLSX, { saveAs }] = await Promise.all([import('xlsx'), import('file-saver')]);

    const rows = fullData.map((item) => ({
      Agrupación: item.name,
      [valueType === 'totalAmount' ? 'Importe (€)' : 'Cantidad (kg)']: item.value,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RankingPedidos');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/octet-stream' });

    const fileName = `ranking_pedidos_${groupBy}_${valueType}.xlsx`;
    saveAs(blob, fileName);
  };

  const isLoadingFirst = speciesLoading;

  if (isLoadingFirst)
    return (
      <Card className="w-full max-w-full overflow-hidden">
        <CardHeader className="space-y-4 pb-2">
          <div className="flex flex-row items-center justify-between gap-4">
            <div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-1 h-4 w-64" />
            </div>
            <Skeleton className="3xl:block hidden h-8 w-40" />
          </div>
          <Skeleton className="h-8 w-full max-w-md" />
          <div className="3xl:grid-cols-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardHeader>
        <CardContent className="mt-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2 text-sm">
          <Skeleton className="3xl:block hidden h-4 w-64" />
          <Skeleton className="h-8 w-40" />
        </CardFooter>
      </Card>
    );

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Ranking Pedidos</CardTitle>
            <CardDescription>
              Agrupado por {valueType === 'totalAmount' ? 'importe total' : 'cantidad total'}
            </CardDescription>
          </div>
          <div className="3xl:flex hidden items-center gap-4">
            <Tabs value={groupBy} onValueChange={setGroupBy}>
              <TabsList>
                <TabsTrigger value="client">Clientes</TabsTrigger>
                <TabsTrigger value="country">Países</TabsTrigger>
                <TabsTrigger value="product">Productos</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="3xl:hidden flex items-center gap-4">
          <Tabs value={groupBy} onValueChange={setGroupBy}>
            <TabsList>
              <TabsTrigger value="client">Clientes</TabsTrigger>
              <TabsTrigger value="country">Países</TabsTrigger>
              <TabsTrigger value="product">Productos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid w-full grid-cols-1 gap-2">
          <div className="w-full min-w-0">
            <DateRangePicker dateRange={range} onChange={setRange} />
          </div>
          <Select value={speciesId} onValueChange={setSpeciesId}>
            <SelectTrigger className="w-full min-w-0">
              <SelectValue placeholder="Todas las especies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las especies</SelectItem>
              {speciesOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[250px] w-full">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader />
            </div>
          ) : !chartData || !Array.isArray(chartData) || chartData.length === 0 ? (
            <div className="flex h-full w-full flex-col items-center justify-center">
              <div className="flex h-full w-full flex-col items-center justify-center">
                <div className="relative">
                  <div className="from-primary/20 to-secondary/20 absolute -inset-1 rounded-full bg-gradient-to-r opacity-70 blur-xl" />
                  <div className="bg-background relative flex h-14 w-14 items-center justify-center rounded-full border shadow-xs">
                    <SearchX className="text-primary h-6 w-6" strokeWidth={1.5} />
                  </div>
                </div>
                <h2 className="mt-3 text-lg font-medium tracking-tight">No hay datos</h2>
                <p className="text-muted-foreground mt-3 mb-2 max-w-[300px] text-center text-xs whitespace-normal">
                  Ajusta el rango de fechas, selecciona una especie o cambia el tipo de agrupación
                  para ver los datos.
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(chartData.length * 45, 200)}>
              <ChartContainer config={chartConfig}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  barCategoryGap={12}
                  margin={{ right: 90, top: 8, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} hide />
                  <XAxis type="number" hide />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                  <Bar dataKey="value" fill={chartConfig.value.color} radius={4} barSize={28}>
                    <LabelList
                      dataKey="value"
                      position="right"
                      offset={8}
                      className="fill-foreground text-nowrap"
                      fontSize={12}
                      formatter={chartConfig.formatter}
                    />
                    <LabelList
                      dataKey="name"
                      position="insideLeft"
                      offset={8}
                      className="fill-background text-nowrap"
                      fontSize={12}
                      formatter={(name) => name}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 text-sm">
        <div className="text-muted-foreground 3xl:flex hidden items-center gap-1">
          * Mostrando {valueType === 'totalAmount' ? 'importe' : 'cantidad'} agrupado por{' '}
          {groupBy === 'client' ? 'cliente' : groupBy === 'country' ? 'país' : 'producto'}
        </div>
        <div className="flex items-center gap-2">
          <Select value={valueType} onValueChange={setValueType}>
            <SelectTrigger className="h-8 w-[160px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalAmount">Importe - €</SelectItem>
              <SelectItem value="totalQuantity">Cantidad - kg</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleExportToExcel}>
            <PiMicrosoftExcelLogoFill className="h-4 w-4 text-green-700" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
