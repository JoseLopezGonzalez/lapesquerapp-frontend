'use client';

import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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

export default function ProductHistoryAccordionItem({
  product,
  chartData,
  trend,
  getTrendTooltipText,
  isMobile = false,
  ChartTooltipComponent = ChartTooltip,
}) {
  const triggerClass = isMobile
    ? 'px-5 py-4 hover:bg-muted/50 transition-colors [&>svg]:transition-transform no-underline hover:no-underline'
    : 'px-4 py-3 hover:bg-muted/50 transition-colors [&>svg]:transition-transform no-underline hover:no-underline';
  const itemClass = isMobile ? 'border-2 rounded-lg overflow-hidden shadow-md' : 'border rounded-lg overflow-hidden shadow-sm';
  const titleClass = isMobile ? 'font-semibold text-lg' : 'font-medium text-base';
  const badgeClass = isMobile ? 'flex items-center gap-1 text-xs h-6 px-2.5 cursor-help' : 'flex items-center gap-1 text-xs h-5 cursor-help';
  const iconSize = isMobile ? 'h-3 w-3' : 'h-2.5 w-2.5';
  const metricsGridClass = isMobile ? 'gap-x-6 gap-y-2 text-sm pr-0' : 'gap-x-4 gap-y-1 text-xs pr-4';
  const metricsValueClass = isMobile ? 'font-semibold text-base' : 'font-medium text-sm';
  const contentClass = isMobile ? 'p-4 space-y-3 w-full' : 'p-3 space-y-3 w-full';
  const chartGapClass = isMobile ? 'gap-4' : 'gap-3';
  const chartHeight = isMobile ? 'h-48 border-2' : 'h-40 shadow-sm';
  const chartHeaderClass = isMobile ? 'pb-2 px-4 pt-3' : 'pb-1 px-3 pt-2';
  const chartTitleClass = isMobile ? 'text-sm font-semibold' : 'text-xs font-medium';
  const chartContentClass = isMobile ? 'px-3' : 'px-2';

  return (
    <AccordionItem key={product.product.id} value={product.product.id.toString()} className={itemClass}>
      <AccordionTrigger className={triggerClass}>
        <div className="flex flex-col md:flex-row w-full items-start md:items-center justify-between gap-3 text-left">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={titleClass}>{product.product.name}</h3>
              {trend.direction !== 'stable' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={trend.direction === 'up' ? 'default' : 'destructive'}
                      className={badgeClass}
                    >
                      {trend.direction === 'up' ? (
                        <TrendingUp className={iconSize} />
                      ) : (
                        <TrendingDown className={iconSize} />
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
            <div className={`flex items-center ${isMobile ? 'mt-2' : 'mt-1'} flex-wrap gap-1.5`}>
              <Badge variant="outline" className={`flex items-center gap-1 text-xs ${isMobile ? 'h-6 px-2.5' : 'h-5 px-2'}`}>
                <Calendar className={iconSize} />
                <span>Último: {formatDateShort(product.last_order_date)}</span>
              </Badge>
              {product.lines?.length > 0 && (
                <Badge variant="outline" className={`flex items-center gap-1 text-xs ${isMobile ? 'h-6 px-2.5' : 'h-5 px-2'}`}>
                  <Package className={iconSize} />
                  <span>{product.lines.length} pedidos</span>
                </Badge>
              )}
            </div>
          </div>
          <div className={`grid grid-cols-2 md:grid-cols-4 ${metricsGridClass}`}>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs">Cajas Totales</span>
              <span className={metricsValueClass}>{formatInteger(product.total_boxes)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs">Peso Neto</span>
              <span className={metricsValueClass}>{formatDecimalWeight(product.total_net_weight)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs">Precio Medio</span>
              <span className={metricsValueClass}>{formatDecimalCurrency(product.average_unit_price)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs">Importe Total</span>
              <span className={metricsValueClass}>{formatDecimalCurrency(product.total_amount)}</span>
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className={contentClass}>
        <div className={`grid grid-cols-2 ${chartGapClass} w-full`}>
          <Card className={`w-full ${chartHeight} flex flex-col overflow-hidden`}>
            <CardHeader className={chartHeaderClass}>
              <CardTitle className={chartTitleClass}>Evolución de precio</CardTitle>
            </CardHeader>
            <CardContent className={`h-full pt-0 ${chartContentClass} w-full text-primary/50`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`colorPrice-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <YAxis tick={{ fontSize: isMobile ? 11 : 10 }} />
                  <RechartsTooltip content={<ChartTooltipComponent isCurrency />} />
                  <Area
                    type="monotone"
                    dataKey="unit_price"
                    stroke="currentColor"
                    strokeWidth={isMobile ? 2.5 : 2}
                    fillOpacity={1}
                    fill={`url(#colorPrice-${product.product.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className={`w-full ${chartHeight} flex flex-col overflow-hidden`}>
            <CardHeader className={chartHeaderClass}>
              <CardTitle className={chartTitleClass}>Evolución de peso</CardTitle>
            </CardHeader>
            <CardContent className={`h-full pt-0 ${chartContentClass} text-primary/50`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`colorWeight-${product.product.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <YAxis tick={{ fontSize: isMobile ? 11 : 10 }} />
                  <RechartsTooltip content={<ChartTooltipComponent />} />
                  <Line
                    type="monotone"
                    dataKey="net_weight"
                    stroke="currentColor"
                    strokeWidth={isMobile ? 2.5 : 2}
                    dot={{ r: isMobile ? 1.5 : 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="net_weight"
                    stroke="currentColor"
                    strokeWidth={isMobile ? 2.5 : 2}
                    fillOpacity={1}
                    fill={`url(#colorWeight-${product.product.id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        <Card className={isMobile ? 'overflow-x-auto border-2' : 'overflow-x-auto'}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={isMobile ? 'text-sm' : ''}>ID Pedido</TableHead>
                <TableHead className={isMobile ? 'text-sm' : ''}>Fecha de carga</TableHead>
                <TableHead className={`text-right ${isMobile ? 'text-sm' : ''}`}>Cajas</TableHead>
                <TableHead className={`text-right ${isMobile ? 'text-sm' : ''}`}>Peso Neto</TableHead>
                <TableHead className={`text-right ${isMobile ? 'text-sm' : ''}`}>Precio Unitario</TableHead>
                <TableHead className={`text-right ${isMobile ? 'text-sm' : ''}`}>Subtotal</TableHead>
                <TableHead className={`text-right ${isMobile ? 'text-sm' : ''}`}>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(product.lines || []).map((order) => (
                <TableRow key={order.order_id}>
                  <TableCell className={isMobile ? 'font-semibold text-sm' : 'font-medium'}>
                    {order.formatted_id}
                  </TableCell>
                  <TableCell className={isMobile ? 'text-sm' : ''}>{formatDateShort(order.load_date)}</TableCell>
                  <TableCell className={`text-right ${isMobile ? 'text-sm font-medium' : ''}`}>{order.boxes}</TableCell>
                  <TableCell className={`text-right ${isMobile ? 'text-sm font-medium' : ''}`}>
                    {formatDecimalWeight(order.net_weight)}
                  </TableCell>
                  <TableCell className={`text-right ${isMobile ? 'text-sm font-medium' : ''}`}>
                    {formatDecimalCurrency(Number(order.unit_price))}
                  </TableCell>
                  <TableCell className={`text-right ${isMobile ? 'text-sm font-medium' : ''}`}>
                    {formatDecimalCurrency(order.subtotal)}
                  </TableCell>
                  <TableCell className={`text-right ${isMobile ? 'text-sm font-semibold' : ''}`}>
                    {formatDecimalCurrency(order.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </AccordionContent>
    </AccordionItem>
  );
}
