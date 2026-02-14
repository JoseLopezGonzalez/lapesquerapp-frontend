'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  formatDecimalCurrency,
  formatDecimalWeight,
  formatInteger,
} from '@/helpers/formats/numbers/formatNumbers';
import { formatDateShort } from '@/helpers/formats/dates/formatDates';
import { ResponsiveContainer, AreaChart, Area, Line, CartesianGrid, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import ChartTooltip from './ChartTooltip';

export default function ProductHistoryMobileCard({
  product,
  chartData,
  trend,
  getTrendTooltipText,
  ChartTooltipComponent = ChartTooltip,
}) {
  return (
    <Card className="border-2 rounded-lg shadow-md">
      <CardContent className="p-5 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg">{product.product.name}</h3>
            {trend.direction !== 'stable' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={trend.direction === 'up' ? 'default' : 'destructive'}
                    className="flex items-center gap-1 text-xs h-6 px-2.5 cursor-help"
                  >
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {trend.percentage}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTrendTooltipText()}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-1.5">
            <Badge variant="outline" className="flex items-center gap-1 text-xs h-6 px-2.5">
              <Calendar className="h-3 w-3" />
              <span>Último: {formatDateShort(product.last_order_date)}</span>
            </Badge>
            {product.lines?.length > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs h-6 px-2.5">
                <Package className="h-3 w-3" />
                <span>{product.lines.length} pedidos</span>
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm pt-2 border-t">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Cajas Totales</span>
              <span className="font-semibold text-base">{formatInteger(product.total_boxes)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Peso Neto</span>
              <span className="font-semibold text-base">{formatDecimalWeight(product.total_net_weight)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Precio Medio</span>
              <span className="font-semibold text-base">{formatDecimalCurrency(product.average_unit_price)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Importe Total</span>
              <span className="font-semibold text-base">{formatDecimalCurrency(product.total_amount)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full pt-2">
          <Card className="w-full h-48 border-2 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-3 flex-shrink-0">
              <CardTitle className="text-sm font-semibold">Evolución de precio</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-0 px-3 w-full text-primary/50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`colorPrice-mobile-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltipComponent isCurrency />} />
                  <Area
                    type="monotone"
                    dataKey="unit_price"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#colorPrice-mobile-${product.product.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="w-full h-48 border-2 flex flex-col overflow-hidden">
            <CardHeader className="pb-2 px-4 pt-3 flex-shrink-0">
              <CardTitle className="text-sm font-semibold">Evolución de peso</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pt-0 px-3 text-primary/50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`colorWeight-mobile-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltipComponent />} />
                  <Line type="monotone" dataKey="net_weight" stroke="currentColor" strokeWidth={2.5} dot={{ r: 1.5 }} />
                  <Area
                    type="monotone"
                    dataKey="net_weight"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#colorWeight-mobile-${product.product.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {product.lines?.length > 0 && (
          <Card className="overflow-x-auto border-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pedido</TableHead>
                  <TableHead>Fecha de carga</TableHead>
                  <TableHead className="text-right">Cajas</TableHead>
                  <TableHead className="text-right">Peso Neto</TableHead>
                  <TableHead className="text-right">Precio Unitario</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.lines.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-medium">{order.formatted_id}</TableCell>
                    <TableCell>{formatDateShort(order.load_date)}</TableCell>
                    <TableCell className="text-right">{order.boxes}</TableCell>
                    <TableCell className="text-right">{formatDecimalWeight(order.net_weight)}</TableCell>
                    <TableCell className="text-right">{formatDecimalCurrency(Number(order.unit_price))}</TableCell>
                    <TableCell className="text-right">{formatDecimalCurrency(order.subtotal)}</TableCell>
                    <TableCell className="text-right">{formatDecimalCurrency(order.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
