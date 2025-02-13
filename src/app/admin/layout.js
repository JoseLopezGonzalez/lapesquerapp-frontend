import Layout from '@/components/Admin/Layout';

export const metadata = {
  title: 'Panel de Administración',
  description: 'Sección de administración de la aplicación',
};

export default function AdminLayout({ children }) {
  return (
    <div className='h-screen'>

    <Layout>
      {children}
    </Layout>

    </div>
  );
}
