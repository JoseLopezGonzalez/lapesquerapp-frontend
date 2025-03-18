import Layout from '@/components/Admin/Layout';
import { AppSidebar } from '@/components/Admin/Layout/SideBar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export const metadata = {
  title: 'Panel de Administración',
  description: 'Sección de administración de la aplicación',
};

export default function AdminLayout({ children }) {
  return (
    <div className='h-screen'>

    {/* <Layout>
      {children}
    </Layout> */}

    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>

    </div>
  );
}
