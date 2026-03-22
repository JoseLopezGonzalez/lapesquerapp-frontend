import FieldLayoutClient from './FieldLayoutClient';

export const dynamic = 'force-dynamic';

export default function FieldLayout({ children }) {
  return <FieldLayoutClient>{children}</FieldLayoutClient>;
}
