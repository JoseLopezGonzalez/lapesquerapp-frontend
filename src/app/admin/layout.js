import FloatingHelpButton from '@/components/Admin/FloatingHelp/FloatingHelpButton';
import { AppSidebar } from '@/components/Admin/Layout/SideBar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"


export const metadata = {
  title: 'Panel de Administración',
  description: 'Sección de administración de la aplicación',
};

const styleSidebar = {
  "--sidebar-width": "18rem",
  "--sidebar-width-mobile": "16rem",
}

export default function AdminLayout({ children }) {
  return (
    <div className='h-screen  overflow-hidden' >
      <SidebarProvider className='h-full' style={styleSidebar}>
        <AppSidebar />
        <main className='flex flex-col h-full overflow-hidden w-full p-2  '>
          <div className='p-1'>
            <SidebarTrigger />
          </div>
          <div className='flex-1 w-full h-full overflow-hidden p-4'>
            {children}
          </div>
        </main>
        {/*  <FloatingHelpButton /> */}
      </SidebarProvider>
    </div>
  );
}
