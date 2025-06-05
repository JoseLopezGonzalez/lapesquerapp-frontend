// components/Print/PalletLabel.js
import { forwardRef } from "react";
import { Badge } from "@/components/ui/badge";
import { PALLET_LABEL_SIZE } from "@/configs/config";

const PalletLabel = forwardRef(({ pallet }, ref) => {
    return (
        <div
            ref={ref}
            style={{
                width: PALLET_LABEL_SIZE.width,
                height: PALLET_LABEL_SIZE.height,
                padding: "12px",
                boxSizing: "border-box",
                backgroundColor: "white",
                color: "black",
            }}
        >
            <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "8px" }}>
                Palet #{pallet.id}
            </h1>
            {pallet.orderId && (
                <p style={{ fontSize: "12px", marginBottom: "6px" }}>
                    Pedido vinculado: #{pallet.orderId}
                </p>
            )}

            <div style={{ fontSize: "13px", marginBottom: "8px" }}>
                <strong>Productos:</strong>
                <ul style={{ marginLeft: "16px" }}>
                    {[...new Set(pallet.boxes.map((b) => b.product.name))].map((name) => (
                        <li key={name}>{name}</li>
                    ))}
                </ul>
            </div>

            <div style={{ fontSize: "13px", marginBottom: "8px" }}>
                <strong>Lotes:</strong>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {[...new Set(pallet.boxes.map((b) => b.lot))].map((lot) => (
                        <Badge key={lot} variant="outline" className="text-xs">
                            {lot}
                        </Badge>
                    ))}
                </div>
            </div>

            {pallet.observations && (
                <div style={{ fontSize: "12px", marginBottom: "8px" }}>
                    <strong>Observaciones:</strong>
                    <div style={{ background: "#f3f4f6", padding: "4px", borderRadius: "4px" }}>
                        {pallet.observations}
                    </div>
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", fontSize: "14px", fontWeight: "bold" }}>
                <div>{pallet.numberOfBoxes} cajas</div>
                <div>{pallet.netWeight.toFixed(2)} kg</div>
            </div>
        </div>
    );
});

export default PalletLabel;
