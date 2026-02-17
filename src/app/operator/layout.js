import OperatorLayoutClient from './OperatorLayoutClient';

export const dynamic = 'force-dynamic';

export default function OperatorLayout({ children }) {
  return <OperatorLayoutClient>{children}</OperatorLayoutClient>;
}
