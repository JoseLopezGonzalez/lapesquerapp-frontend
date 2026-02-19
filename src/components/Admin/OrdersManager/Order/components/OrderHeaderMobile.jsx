'use client';

import { ArrowLeft, MoreVertical, Printer, Pencil, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SECTIONS_CONFIG, PRIMARY_SECTION_IDS_MOBILE } from '../config/sectionsConfig';

/**
 * Header móvil: botón back + título (#orderId) + menú ⋮ (secciones overflow, Editar, Imprimir)
 * Solo se muestra cuando existe onClose (contexto sheet/drawer)
 */
export default function OrderHeaderMobile({
  order,
  onClose,
  onNavigateSection,
  onEdit,
  onPrint,
}) {
  if (!onClose) return null;

  const overflowSections = SECTIONS_CONFIG.filter(
    (s) => !PRIMARY_SECTION_IDS_MOBILE.includes(s.id)
  );

  return (
    <div className="bg-background flex-shrink-0 px-0 pt-8 pb-3">
      <div className="relative flex items-center justify-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute left-4 w-12 h-12 rounded-full hover:bg-muted min-w-[44px] min-h-[44px]"
          aria-label="Volver"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-xl font-normal dark:text-white text-center">
            #{order.id}
          </h2>
          {(order?.orderType ?? order?.order_type) === 'autoventa' && (
            <span
              className="inline-flex items-center gap-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-400 dark:border-slate-500"
              aria-label="Tipo de pedido: Autoventa"
            >
              <ShoppingBag className="h-3 w-3" aria-hidden />
              Autoventa
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 w-12 h-12 rounded-full hover:bg-muted min-w-[44px] min-h-[44px]"
              aria-label="Más opciones"
            >
              <MoreVertical className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {overflowSections.map((section) => {
              const Icon = section.icon;
              return (
                <DropdownMenuItem
                  key={section.id}
                  onClick={() => onNavigateSection(section.id)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {section.title}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar pedido
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
