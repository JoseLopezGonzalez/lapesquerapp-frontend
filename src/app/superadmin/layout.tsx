import SuperadminLayoutClient from './SuperadminLayoutClient';

export const metadata = {
  title: 'PesquerApp Admin',
  description: 'Panel de administración de la plataforma PesquerApp',
};

export default function SuperadminLayout({ children }) {
  return <SuperadminLayoutClient>{children}</SuperadminLayoutClient>;
}
