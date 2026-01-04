import { HomeIcon, TruckIcon, UserGroupIcon, ArchiveBoxIcon, PencilSquareIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import { TbFishHook } from 'react-icons/tb';
import { RiShieldUserLine } from "react-icons/ri";
import { RiShieldUserFill } from "react-icons/ri";
import { RiShipLine } from "react-icons/ri";
import { RiMapPinUserLine } from "react-icons/ri";
import { IoReceiptOutline } from "react-icons/io5";
import { PiFishSimpleDuotone } from "react-icons/pi";
import { TbPlugConnected } from "react-icons/tb";
import { LandPlot, ScanSearch, Settings2, Factory, FileText } from 'lucide-react';

export const navigationConfig = [
    {
        name: 'Inicio',
        icon: HomeIcon,
        href: '/admin/home',
        allowedRoles: ["admin", "manager", "superuser"],
    },
    {
        name: 'Almacenes',
        icon: ArchiveBoxIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        childrens: [
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
            {
                name: 'Todos los Almacenes',
                href: '/admin/stores',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
    {
        name: 'Recepciones',
        icon: TbFishHook,
        allowedRoles: ["admin", "manager", "superuser"],
        childrens: [
            {
                name: 'Materia Prima',
                href: '/admin/raw-material-receptions',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
    {
        name: 'Salidas de Cebo',
        icon: PiFishSimpleDuotone,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/cebo-dispatches',
    },
    {
        name: 'Producciones',
        icon: Factory,
        allowedRoles: ["admin", "manager", "superuser", "store_operator"],
        href: '/admin/productions',
    },
    {
        name: 'Pedidos',
        icon: PencilSquareIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/orders',

    },
    {
        name: 'Productos',
        icon: SquaresPlusIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/products',
        childrens: [
            {
                name: 'Todos los Productos',
                href: '/admin/products',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Categorías',
                href: '/admin/product-categories',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Familias',
                href: '/admin/product-families',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Zonas de Captura',
                href: '/admin/capture-zones',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Especies',
                href: '/admin/species',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Artes de Pesca',
                href: '/admin/fishing-gears',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
    {
        name: 'Transportes',
        icon: TruckIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/transports',
    },
    {
        name: 'Incoterms',
        icon: RiShipLine,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/incoterms',
    },
    {
        name: 'Comerciales',
        icon: RiMapPinUserLine,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/salespeople',
    },
    {
        name: 'Clientes',
        icon: RiShieldUserLine,
        allowedRoles: ["admin", "manager", "superuser"],
        childrens: [
            {
                name: 'Formas de Pago',
                href: '/admin/payment-terms',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Paises',
                href: '/admin/countries',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Todos los Clientes',
                href: '/admin/customers',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
    {
        name: 'Proveedores',
        icon: RiShieldUserFill,
        allowedRoles: ["admin", "manager", "superuser"],
        childrens: [
            {
                name: 'Todos los Proveedores',
        href: '/admin/suppliers',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Liquidación de Proveedores',
                href: '/admin/supplier-liquidations',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },

    {
        name: 'Usuarios',
        icon: UserGroupIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        childrens: [
            {
                name: 'Todos los Usuarios',
                href: '/admin/users',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
    {
        name: 'Sesiones',
        icon: TbPlugConnected,
        href: '/admin/sessions',
        allowedRoles: ["admin", "manager", "superuser"],
        childrens: [
            {
                name: 'Todas las Sesiones',
                href: '/admin/sessions',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            {
                name: 'Registros de Actividad',
                href: '/admin/activity-logs',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
];

export const navigationManagerConfig = [
    {
        name: 'Gestor de pedidos',
        icon: PencilSquareIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/orders-manager',
    },
    {
        name: 'Extracción de datos lonja',
        icon: ScanSearch,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/market-data-extractor',
    },
    {
        name: 'Almacenes interactivos',
        icon: LandPlot,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/stores-manager',
    },

    {
        name: 'Editor de Etiquetas',
        icon: IoReceiptOutline,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/label-editor',
    },
    {
        name: 'Recepciones de Materia Prima',
        icon: TbFishHook,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/raw-material-receptions',
    },
    /* {
          name: 'Salidas de Cebo',
          icon: PiFishSimpleDuotone,
          allowedRoles: ["manager"],
          href: '/admin/cebo-dispatches',
      }, */
]
