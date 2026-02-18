import { HomeIcon, TruckIcon, UserGroupIcon, ArchiveBoxIcon, PencilSquareIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import { TbFishHook } from 'react-icons/tb';
import { RiShieldUserLine } from "react-icons/ri";
import { RiShieldUserFill } from "react-icons/ri";
import { RiShipLine } from "react-icons/ri";
import { RiMapPinUserLine } from "react-icons/ri";
import { IoReceiptOutline } from "react-icons/io5";
import { PiFishSimpleDuotone } from "react-icons/pi";
import { TbPlugConnected } from "react-icons/tb";
import { LandPlot, ScanSearch, Settings2, Factory, FileText, Clock, Radio, LayoutDashboard } from 'lucide-react';

export const navigationConfig = [
    /* Solo operario: acceso desde dashboard (/operator) */
    {
        name: 'Inicio',
        icon: HomeIcon,
        href: '/operator',
        allowedRoles: ["operario"],
    },
    {
        name: 'Inicio',
        icon: HomeIcon,
        href: '/comercial',
        allowedRoles: ["comercial"],
    },
    {
        name: 'Inicio',
        icon: HomeIcon,
        href: '/admin/home',
        allowedRoles: ["administrador", "direccion", "tecnico"],
    },
    {
        name: 'Almacenes',
        icon: ArchiveBoxIcon,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        childrens: [
            {
                name: 'Cajas',
                href: '/admin/boxes',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Palets',
                href: '/admin/pallets',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Todos los Almacenes',
                href: '/admin/stores',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
        ],
    },
    {
        name: 'Recepciones',
        icon: TbFishHook,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        childrens: [
            {
                name: 'Materia Prima',
                href: '/admin/raw-material-receptions',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
        ],
    },
    {
        name: 'Salidas de Cebo',
        icon: PiFishSimpleDuotone,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/cebo-dispatches',
    },
    {
        name: 'Producciones',
        icon: Factory,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/productions',
    },
    {
        name: 'Pedidos',
        icon: PencilSquareIcon,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/orders',

    },
    {
        name: 'Productos',
        icon: SquaresPlusIcon,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/products',
        childrens: [
            {
                name: 'Todos los Productos',
                href: '/admin/products',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Categorías',
                href: '/admin/product-categories',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Familias',
                href: '/admin/product-families',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Zonas de Captura',
                href: '/admin/capture-zones',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Especies',
                href: '/admin/species',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Artes de Pesca',
                href: '/admin/fishing-gears',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
        ],
    },
    {
        name: 'Transportes',
        icon: TruckIcon,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/transports',
    },
    {
        name: 'Incoterms',
        icon: RiShipLine,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/incoterms',
    },
    {
        name: 'Comerciales',
        icon: RiMapPinUserLine,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/salespeople',
    },
    {
        name: 'Clientes',
        icon: RiShieldUserLine,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        childrens: [
            {
                name: 'Formas de Pago',
                href: '/admin/payment-terms',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Paises',
                href: '/admin/countries',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Todos los Clientes',
                href: '/admin/customers',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
        ],
    },
    {
        name: 'Proveedores',
        icon: RiShieldUserFill,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        childrens: [
            {
                name: 'Todos los Proveedores',
        href: '/admin/suppliers',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Liquidación de Proveedores',
                href: '/admin/supplier-liquidations',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
        ],
    },

    {
        name: 'Usuarios',
        icon: UserGroupIcon,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        childrens: [
            {
                name: 'Todos los Usuarios',
                href: '/admin/users',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
        ],
    },
    {
        name: 'Sesiones',
        icon: TbPlugConnected,
        href: '/admin/sessions',
        allowedRoles: ["administrador", "direccion", "tecnico"],
        childrens: [
            {
                name: 'Todas las Sesiones',
                href: '/admin/sessions',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
            {
                name: 'Registros de Actividad',
                href: '/admin/activity-logs',
                allowedRoles: ["administrador", "direccion", "tecnico"],
            },
        ],
    },
        {
            name: 'Gestión Horaria',
            icon: Clock,
            allowedRoles: ["administrador", "direccion", "tecnico"],
            childrens: [
                {
                    name: 'Empleados',
                    href: '/admin/employees',
                    allowedRoles: ["administrador", "direccion", "tecnico"],
                },
                {
                    name: 'Eventos de Fichaje',
                    href: '/admin/punches',
                    allowedRoles: ["administrador", "direccion", "tecnico"],
                },
                {
                    name: 'Gestión Manual de Fichajes',
                    href: '/admin/manual-punches',
                    allowedRoles: ["administrador", "direccion", "tecnico"],
                },
                {
                    name: 'Calendario de Fichajes',
                    href: '/admin/punches-calendar',
                    allowedRoles: ["administrador", "direccion", "tecnico"],
                },
            ],
        },
];

export const navigationManagerConfig = [
    {
        name: 'Gestor de pedidos',
        icon: PencilSquareIcon,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/orders-manager',
    },
    {
        name: 'Preparación de pedidos',
        icon: LayoutDashboard,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/orquestador',
    },
    {
        name: 'Extracción de datos lonja',
        icon: ScanSearch,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/market-data-extractor',
    },
    {
        name: 'Almacenes interactivos',
        icon: LandPlot,
        allowedRoles: ["operario"],
        href: '/operator/stores-manager',
    },
    {
        name: 'Almacenes interactivos',
        icon: LandPlot,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/stores-manager',
    },
    {
        name: 'Editor de Etiquetas',
        icon: IoReceiptOutline,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/label-editor',
    },
    {
        name: 'Recepciones de Materia Prima',
        icon: TbFishHook,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/raw-material-receptions',
    },
    {
        name: 'Gestor de Registro Horario',
        icon: Clock,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/time-punch-manager',
    },
    {
        name: 'Fichaje Automático NFC',
        icon: Radio,
        allowedRoles: ["operario"],
        href: '/operator/nfc-punch-manager',
    },
    {
        name: 'Fichaje Automático NFC',
        icon: Radio,
        allowedRoles: ["administrador", "direccion", "tecnico"],
        href: '/admin/nfc-punch-manager',
    },
    /* {
          name: 'Salidas de Cebo',
          icon: PiFishSimpleDuotone,
          allowedRoles: ["direccion", "tecnico"],
          href: '/admin/cebo-dispatches',
      }, */
]
