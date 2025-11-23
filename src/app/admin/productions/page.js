import EntityClient from "@/components/Admin/Entity/EntityClient";
import { configs } from "@/configs/entitiesConfig";

export default async function ProductionsPage() {
  const config = configs['productions'];

  if (!config) {
    return <p className="text-red-500">Configuración de producciones no encontrada</p>;
  }

  return <EntityClient config={config} />;
}

