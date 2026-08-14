import { Receipt } from 'lucide-react';
import { MaquilaPlaceholderScreen } from '@/components/External/Maquila/MaquilaPlaceholderScreen';

export default function MaquilaCargoServicioPage() {
  return (
    <MaquilaPlaceholderScreen
      icon={Receipt}
      title="Cargo de servicio"
      description="El importe que te facturamos por el servicio de maquila. Pendiente de que el backend acepte lectura para tu tipo de usuario."
      blockedByBackend
    />
  );
}
