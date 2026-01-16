import { configs } from "@/configs/entitiesConfig"; // Configuraciones centralizadas
import EditEntityClient from '@/components/Admin/Entity/EntityClient/EntityForms/EditEntityForm';
import { notFound } from "next/navigation";

export default async function EditPage({ params }) {
  const { entity } = await params; // Capturamos el segmento dinámico desde la URL
  const config = configs[entity]; // Buscamos la configuración de la entidad

  if (!config) {
    notFound();
  }

  return <EditEntityClient config={config} />;
}
