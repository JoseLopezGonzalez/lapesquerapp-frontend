import Layout from '@/components/Admin/Layout';
import { AppSidebar } from '@/components/Admin/Layout/SideBar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export const metadata = {
  title: 'Panel de Administración',
  description: 'Sección de administración de la aplicación',
};

export default function AdminLayout({ children }) {
  return (
    <div className='h-screen bg-neutral-800'>

      {/* <Layout>
      {children}
    </Layout> */}

      <SidebarProvider className='h-full'>
        <AppSidebar />
        <main className='flex flex-col h-full overflow-hidden w-full  p-2 '>
          <div className='p-1'>
            <SidebarTrigger />
          </div>
          <div className='flex-1 w-full overflow-hidden'>
            {children}
          </div>
        </main>
      </SidebarProvider>

    </div>
  );
}
