import ComercialLayoutClient from './ComercialLayoutClient';

export const dynamic = 'force-dynamic';

export default function ComercialLayout({ children }) {
  return <ComercialLayoutClient>{children}</ComercialLayoutClient>;
}
