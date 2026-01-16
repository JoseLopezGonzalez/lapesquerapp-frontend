import { configs } from "@/configs/entitiesConfig"; // Configuraciones centralizadas
import CreateEntityClient from '@/components/Admin/Entity/EntityClient/EntityForms/CreateEntityForm';
import { notFound } from "next/navigation";

export default async function CreatePage({ params }) {
  const { entity } = await params; // Capturamos el segmento dinámico desde la URL
  const config = configs[entity]; // Buscamos la configuración de la entidad

  if (!config) {
    notFound();
  }

  return <CreateEntityClient config={config} />;
}
