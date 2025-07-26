import EntityClient from "@/components/Admin/Entity/EntityClient";
import { configs } from "@/configs/entitiesConfig"; // Configuraciones centralizadas

export default async function EntityPage({ params }) {
  const entity = params.entity; // Capturamos el segmento dinámico desde la URL
  const config = configs[entity]; // Buscamos la configuración de la entidad

  if (!config) {
    return <p className="text-red-500">Entidad no encontrada</p>;
  }

  return <EntityClient config={config} />;
}
