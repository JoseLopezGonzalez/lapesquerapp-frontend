import { HomeIcon, TruckIcon, UserGroupIcon, ArchiveBoxIcon, PencilSquareIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import { TbFishHook } from 'react-icons/tb';
import { RiShieldUserLine } from "react-icons/ri";
import { RiShieldUserFill } from "react-icons/ri";
import { RiShipLine } from "react-icons/ri";
import { RiMapPinUserLine } from "react-icons/ri";
import { IoReceiptOutline } from "react-icons/io5";
import { LuFlag } from "react-icons/lu";
import { PiFishSimpleDuotone } from "react-icons/pi";




export const navigationConfig = [
    {
        name: 'Inicio',
        icon: HomeIcon,
        href: '/home',
        allowedRoles: ["admin", "manager", "superuser"],
    },
    {
        name: 'Almacenes',
        icon: ArchiveBoxIcon,
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
        children: [
            {
                name: 'Materia Prima',
                href: '/admin/raw-material-receptions',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
    /* CeboDispatches */
    {
        name: 'Salidas de Cebo',
        icon: PiFishSimpleDuotone,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/cebo-dispatches',
    },

    {
        name: 'Pedidos',
        icon: PencilSquareIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        children: [
            {
                name: 'Todos los Pedidos',
                href: '/admin/orders',
                allowedRoles: ["admin", "manager", "superuser"],
            },
        ],
    },
    {
        name: 'Productos',
        icon: SquaresPlusIcon,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/products',
        children: [
            {
                name: 'Todos los Productos',
                href: '/admin/products',
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
            /* fishing-gears */
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
        children: [
            /* paymentTerms */
            {
                name: 'Formas de Pago',
                href: '/admin/payment-terms',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            /* Countries */
            {
                name: 'Paises',
                href: '/admin/countries',
                allowedRoles: ["admin", "manager", "superuser"],
            },
            /* all customers */
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
        href: '/admin/suppliers',
    },
    {
        name: 'Etiquetas',
        icon: IoReceiptOutline,
        allowedRoles: ["admin", "manager", "superuser"],
        href: '/admin/labels',
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
