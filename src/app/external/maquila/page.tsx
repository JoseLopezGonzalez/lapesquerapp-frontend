import { LayoutDashboard } from 'lucide-react';
import { MaquilaPlaceholderScreen } from '@/components/External/Maquila/MaquilaPlaceholderScreen';

export default function MaquilaDashboardPage() {
  return (
    <MaquilaPlaceholderScreen
      icon={LayoutDashboard}
      title="Panel de inicio"
      description="Resumen de tu stock, producciones y pedidos. Esta pantalla depende de endpoints que el backend todavía no expone."
      blockedByBackend
    />
  );
}
