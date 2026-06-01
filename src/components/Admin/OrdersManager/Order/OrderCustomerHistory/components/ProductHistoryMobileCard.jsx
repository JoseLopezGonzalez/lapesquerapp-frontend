'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  formatDecimalCurrency,
  formatDecimalWeight,
  formatInteger,
} from '@/helpers/formats/numbers/formatNumbers';
import { formatDateShort } from '@/helpers/formats/dates/formatDates';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  CartesianGrid,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import ChartTooltip from './ChartTooltip';

export default function ProductHistoryMobileCard({
  product,
  chartData,
  trend,
  getTrendTooltipText,
  ChartTooltipComponent = ChartTooltip,
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{product.product.name}</h3>
            {trend.direction !== 'stable' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={trend.direction === 'up' ? 'default' : 'destructive'}
                    className="flex h-6 cursor-help items-center gap-1 px-2.5 text-xs"
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
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="flex h-6 items-center gap-1 px-2.5 text-xs">
              <Calendar className="h-3 w-3" />
              <span>Último: {formatDateShort(product.last_order_date)}</span>
            </Badge>
            {product.lines?.length > 0 && (
              <Badge variant="outline" className="flex h-6 items-center gap-1 px-2.5 text-xs">
                <Package className="h-3 w-3" />
                <span>{product.lines.length} pedidos</span>
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t pt-2 text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Cajas Totales</span>
              <span className="text-base font-semibold">{formatInteger(product.total_boxes)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Peso Neto</span>
              <span className="text-base font-semibold">
                {formatDecimalWeight(product.total_net_weight)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Precio Medio</span>
              <span className="text-base font-semibold">
                {formatDecimalCurrency(product.average_unit_price)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs font-medium">Importe Total</span>
              <span className="text-base font-semibold">
                {formatDecimalCurrency(product.total_amount)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 pt-2">
          <Card className="flex h-48 w-full flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0 pb-2">
              <CardTitle className="text-sm font-semibold">Evolución de precio</CardTitle>
            </CardHeader>
            <CardContent className="text-primary/50 min-h-0 flex-1 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id={`colorPrice-mobile-${product.product.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
          <Card className="flex h-48 w-full flex-col overflow-hidden">
            <CardHeader className="flex-shrink-0 pb-2">
              <CardTitle className="text-sm font-semibold">Evolución de peso</CardTitle>
            </CardHeader>
            <CardContent className="text-primary/50 min-h-0 flex-1 pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id={`colorWeight-mobile-${product.product.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<ChartTooltipComponent />} />
                  <Line
                    type="monotone"
                    dataKey="net_weight"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    dot={{ r: 1.5 }}
                  />
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
          <Card className="overflow-x-auto">
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
                    <TableCell className="text-right">
                      {formatDecimalWeight(order.net_weight)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDecimalCurrency(Number(order.unit_price))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDecimalCurrency(order.subtotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDecimalCurrency(order.total)}
                    </TableCell>
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
