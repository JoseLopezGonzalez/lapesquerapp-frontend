import { HomeIcon, TruckIcon, UserGroupIcon, ArchiveBoxIcon, PencilSquareIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import { TbFishHook } from 'react-icons/tb';
import { RiShieldUserLine } from "react-icons/ri";
import { RiShieldUserFill } from "react-icons/ri";
import { RiShipLine } from "react-icons/ri";
import { RiMapPinUserLine } from "react-icons/ri";
import { IoReceiptOutline } from "react-icons/io5";
import { PiFishSimpleDuotone } from "react-icons/pi";
import { TbPlugConnected } from "react-icons/tb";
import { LandPlot, ScanSearch, Settings2, Factory, FileText, Clock, Radio } from 'lucide-react';

export const navigationConfig = [
    {
        name: 'Inicio',
        icon: HomeIcon,
        href: '/admin/home',
        allowedRoles: ["administrador", "direccion"],
    },
    {
        name: 'Almacenes',
        icon: ArchiveBoxIcon,
        allowedRoles: ["administrador", "direccion"],
        childrens: [
            {
                name: 'Cajas',
                href: '/admin/boxes',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Palets',
                href: '/admin/pallets',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Todos los Almacenes',
                href: '/admin/stores',
                allowedRoles: ["administrador", "direccion"],
            },
        ],
    },
    {
        name: 'Recepciones',
        icon: TbFishHook,
        allowedRoles: ["administrador", "direccion"],
        childrens: [
            {
                name: 'Materia Prima',
                href: '/admin/raw-material-receptions',
                allowedRoles: ["administrador", "direccion"],
            },
        ],
    },
    {
        name: 'Salidas de Cebo',
        icon: PiFishSimpleDuotone,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/cebo-dispatches',
    },
    {
        name: 'Producciones',
        icon: Factory,
        allowedRoles: ["administrador", "direccion", "operario"],
        href: '/admin/productions',
    },
    {
        name: 'Pedidos',
        icon: PencilSquareIcon,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/orders',

    },
    {
        name: 'Productos',
        icon: SquaresPlusIcon,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/products',
        childrens: [
            {
                name: 'Todos los Productos',
                href: '/admin/products',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Categorías',
                href: '/admin/product-categories',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Familias',
                href: '/admin/product-families',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Zonas de Captura',
                href: '/admin/capture-zones',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Especies',
                href: '/admin/species',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Artes de Pesca',
                href: '/admin/fishing-gears',
                allowedRoles: ["administrador", "direccion"],
            },
        ],
    },
    {
        name: 'Transportes',
        icon: TruckIcon,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/transports',
    },
    {
        name: 'Incoterms',
        icon: RiShipLine,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/incoterms',
    },
    {
        name: 'Comerciales',
        icon: RiMapPinUserLine,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/salespeople',
    },
    {
        name: 'Clientes',
        icon: RiShieldUserLine,
        allowedRoles: ["administrador", "direccion"],
        childrens: [
            {
                name: 'Formas de Pago',
                href: '/admin/payment-terms',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Paises',
                href: '/admin/countries',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Todos los Clientes',
                href: '/admin/customers',
                allowedRoles: ["administrador", "direccion"],
            },
        ],
    },
    {
        name: 'Proveedores',
        icon: RiShieldUserFill,
        allowedRoles: ["administrador", "direccion"],
        childrens: [
            {
                name: 'Todos los Proveedores',
        href: '/admin/suppliers',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Liquidación de Proveedores',
                href: '/admin/supplier-liquidations',
                allowedRoles: ["administrador", "direccion"],
            },
        ],
    },

    {
        name: 'Usuarios',
        icon: UserGroupIcon,
        allowedRoles: ["administrador", "direccion"],
        childrens: [
            {
                name: 'Todos los Usuarios',
                href: '/admin/users',
                allowedRoles: ["administrador", "direccion"],
            },
        ],
    },
    {
        name: 'Sesiones',
        icon: TbPlugConnected,
        href: '/admin/sessions',
        allowedRoles: ["administrador", "direccion"],
        childrens: [
            {
                name: 'Todas las Sesiones',
                href: '/admin/sessions',
                allowedRoles: ["administrador", "direccion"],
            },
            {
                name: 'Registros de Actividad',
                href: '/admin/activity-logs',
                allowedRoles: ["administrador", "direccion"],
            },
        ],
    },
        {
            name: 'Gestión Horaria',
            icon: Clock,
            allowedRoles: ["administrador", "direccion"],
            childrens: [
                {
                    name: 'Empleados',
                    href: '/admin/employees',
                    allowedRoles: ["administrador", "direccion"],
                },
                {
                    name: 'Eventos de Fichaje',
                    href: '/admin/punches',
                    allowedRoles: ["administrador", "direccion"],
                },
                {
                    name: 'Gestión Manual de Fichajes',
                    href: '/admin/manual-punches',
                    allowedRoles: ["administrador", "direccion"],
                },
                {
                    name: 'Calendario de Fichajes',
                    href: '/admin/punches-calendar',
                    allowedRoles: ["administrador", "direccion"],
                },
            ],
        },
];

export const navigationManagerConfig = [
    {
        name: 'Gestor de pedidos',
        icon: PencilSquareIcon,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/orders-manager',
    },
    {
        name: 'Extracción de datos lonja',
        icon: ScanSearch,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/market-data-extractor',
    },
    {
        name: 'Almacenes interactivos',
        icon: LandPlot,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/stores-manager',
    },

    {
        name: 'Editor de Etiquetas',
        icon: IoReceiptOutline,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/label-editor',
    },
    {
        name: 'Recepciones de Materia Prima',
        icon: TbFishHook,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/raw-material-receptions',
    },
    {
        name: 'Gestor de Registro Horario',
        icon: Clock,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/time-punch-manager',
    },
    {
        name: 'Fichaje Automático NFC',
        icon: Radio,
        allowedRoles: ["administrador", "direccion"],
        href: '/admin/nfc-punch-manager',
    },
    /* {
          name: 'Salidas de Cebo',
          icon: PiFishSimpleDuotone,
          allowedRoles: ["direccion"],
          href: '/admin/cebo-dispatches',
      }, */
]
