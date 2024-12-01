import { GenericTable } from "@/components/Tables/GenericTable";
import { rawMaterialReceptionsConfig } from "@/configs/rawMaterialReceptionsConfig";

const RawMaterialReceptionsPage = ({ data }) => {
  const handleTableAction = (action, payload) => {
    if (action === "delete") {
      console.log("Eliminar:", payload);
    } else if (action === "view") {
      console.log("Ver:", payload);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white">
        {rawMaterialReceptionsConfig.title}
      </h1>
      <p className="text-neutral-400">
        {rawMaterialReceptionsConfig.description}
      </p>
      <GenericTable
        data={data}
        config={rawMaterialReceptionsConfig}
        onAction={handleTableAction}
      />
    </div>
  );
};

export default RawMaterialReceptionsPage;
