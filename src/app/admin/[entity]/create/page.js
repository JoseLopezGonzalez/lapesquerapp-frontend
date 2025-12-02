import { configs } from "@/configs/entitiesConfig"; // Configuraciones centralizadas
import CreateEntityClient from '@/components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm';

export default async function CreatePage({ params }) {
  const { entity } = await params; // Capturamos el segmento dinámico desde la URL
  const config = configs[entity]; // Buscamos la configuración de la entidad

  if (!config) {
    return <p className="text-red-500">Entidad no encontrada</p>;
  }

  return <CreateEntityClient config={config} />;
}
