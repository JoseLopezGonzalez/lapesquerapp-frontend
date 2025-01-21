import { HomeIcon, TicketIcon, EllipsisHorizontalCircleIcon, TruckIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { TbTruckLoading, TbFishHook, TbBoxPadding } from 'react-icons/tb';
import { BsBox, BsDiagram3 } from 'react-icons/bs';
import { GrBucket } from 'react-icons/gr';
import { PiMicrosoftExcelLogoFill } from 'react-icons/pi';
import { RiShieldUserLine } from "react-icons/ri";
import { RiShieldUserFill } from "react-icons/ri";



export const navigationConfig = [
    {
        name: 'Inicio',
        icon: HomeIcon,
        href: '/home',
        allowedRoles: ["admin", "manager", "superuser"],
    },
    {
        name: 'Recepciones',
        icon: TbFishHook,
        allowedRoles: ["admin", "manager", "superuser"],
        children: [
            {
                name: 'Materia Prima',
                href: '/admin/raw-material-receptions',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            /*  { name: 'Ingredientes y Aditivos', href: '#' },
             { name: 'Envases y embalajes', href: '#' }, */
        ],
    },
    /* Userts */

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
        allowedRoles: ["admin", "manager", "superuser"],
        children: [
            /* { name: 'Pedidos Activos', href: '/orders_manager' }, */
            {
                name: 'Todos los Pedidos',
                href: '/admin/orders',
                allowedRoles: ["admin", "manager", "superuser"],
            },
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
    {
        name: 'Transportes',
        icon: TruckIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/transports',
    },
    {
        name: 'Productos',
        icon: TbBoxPadding,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/products',
    },
    {
        name: 'Almacenes',
        icon: BsBox,
        allowedRoles: ["admin", "manager", "superuser"],
        children: [
            {
                name: 'Cajas',
                href: '/admin/boxes',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Palets',
                href: '/admin/pallets',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            /* Almacenes */
            {
                name: 'Todos los Almacenes',
                href: '/admin/stores',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
    /* customers */
    {
        name: 'Clientes',
        icon: RiShieldUserLine,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/customers',
    },

    /* Suppliers */
    {
        name: 'Proveedores',
        icon: RiShieldUserFill,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/suppliers',
    },
    {
        name: 'Usuarios',
        icon: UserGroupIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        children: [
            {
                name: 'Todos los Usuarios',
                href: '/admin/users',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
];
