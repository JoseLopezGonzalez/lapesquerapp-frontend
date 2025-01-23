import { HomeIcon, TruckIcon, UserGroupIcon, ArchiveBoxIcon, PencilSquareIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';
import { TbFishHook } from 'react-icons/tb';
import { RiShieldUserLine } from "react-icons/ri";
import { RiShieldUserFill } from "react-icons/ri";
import { RiShipLine } from "react-icons/ri";
import { RiMapPinUserLine } from "react-icons/ri";
import { IoReceiptOutline } from "react-icons/io5";


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
        href: '/admin/customers',
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
