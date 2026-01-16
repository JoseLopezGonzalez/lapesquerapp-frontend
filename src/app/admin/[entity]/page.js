import EntityClient from "@/components/Admin/Entity/EntityClient";
import { configs } from "@/configs/entitiesConfig"; // Configuraciones centralizadas
import { notFound } from "next/navigation";

export default async function EntityPage({ params }) {
  const { entity } = await params; // Capturamos el segmento dinámico desde la URL
  const config = configs[entity]; // Buscamos la configuración de la entidad

  if (!config) {
    notFound();
  }

  return <EntityClient config={config} />;
}
