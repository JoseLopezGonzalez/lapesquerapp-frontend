import { HomeIcon, TicketIcon, EllipsisHorizontalCircleIcon, TruckIcon } from '@heroicons/react/24/outline';
import { TbTruckLoading, TbFishHook } from 'react-icons/tb';
import { BsDiagram3 } from 'react-icons/bs';
import { GrBucket } from 'react-icons/gr';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';

export const navigation = [
    {
        name: 'Inicio',
        icon: HomeIcon,
        href: '/home',
    },
    {
        name: 'Recepciones',
        icon: TbFishHook,
        children: [
            { name: 'Materia Prima', href: '/admin/raw-material-receptions' },
           /*  { name: 'Ingredientes y Aditivos', href: '#' },
            { name: 'Envases y embalajes', href: '#' }, */
        ],
    },
    /* {
        name: 'Cebo',
        icon: GrBucket,
        href: '/cebo_dispatches',
    }, */
    /* {
        name: 'Producciones',
        icon: BsDiagram3,
        children: [
            { name: 'Todas las producciones', href: '/productions' },
            { name: 'Añadir Producción', href: '/insert_production' },
        ],
    }, */
    /* {
        name: 'Almacenes',
        icon: TbTruckLoading,
        children: [
            { name: 'Gestor de Almacenes', href: '/stores_manager' },
            { name: 'Todos los Palets', href: '/pallets' },
        ],
    }, */
    {
        name: 'Pedidos',
        icon: TruckIcon,
        children: [
            /* { name: 'Pedidos Activos', href: '/orders_manager' }, */
            { name: 'Todos los Pedidos', href: '/admin/orders' },
            /* { name: 'Añadir Pedido', href: '/insert_order' }, */
        ],
    },
   /*  {
        name: 'Etiquetas',
        icon: TicketIcon,
        href: '/labels_manager',
    }, */
    /* {
        name: 'Conversor A3ERP',
        icon: PiMicrosoftExcelLogoFill,
        href: '/isla_cristina_reception_converter',
    }, */
    /* {
        name: 'Otros',
        icon: EllipsisHorizontalCircleIcon,
        children: [
            { name: 'Especies', href: '#' },
            { name: 'Zonas de capturas', href: '#' },
        ],
    }, */
];
