/**
 * Copia del palet sin campos de coste en raíz ni en cajas, para POST/PUT cuando
 * el usuario no está autorizado a gestionar costes (alineado con PalletManualCostPolicy).
 *
 * @param {Record<string, unknown>} pallet
 * @returns {Record<string, unknown>}
 */
export function stripPalletCostFieldsFromPayload(pallet) {
  if (!pallet || typeof pallet !== 'object') return pallet;

  const { costPerKg, totalCost, ...palletRest } = pallet;

  return {
    ...palletRest,
    boxes: Array.isArray(pallet.boxes)
      ? pallet.boxes.map((box) => {
          if (!box || typeof box !== 'object') return box;
          const {
            manualCostPerKg,
            traceableCostPerKg,
            costPerKg: boxCostPerKg,
            totalCost: boxTotalCost,
            ...boxRest
          } = box;
          return boxRest;
        })
      : pallet.boxes,
  };
}
