import { configs } from "@/configs/entitiesConfig"; // Configuraciones centralizadas
import EntityClient from "./EntityClient"; // Componente cliente que manejará toda la lógica

export default async function EntityPage({ params }) {
  const entity = params.entity; // Capturamos el segmento dinámico desde la URL
  const config = configs[entity]; // Buscamos la configuración de la entidad

  if (!config) {
    return <p className="text-red-500">Entidad no encontrada</p>;
  }

  return <EntityClient config={config} />;
}
