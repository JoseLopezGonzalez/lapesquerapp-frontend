/**
 * El accessor PHP de `cost_breakdown.materials.sources` suele omitir ids y relaciones;
 * el mismo payload trae `output.sources` alineado por índice. Unimos ambos antes de normalizar.
 * @param {object|null|undefined} costBreakdownRaw
 * @param {object|null|undefined} outputRaw
 * @returns {object|null|undefined}
 */
export function mergeCostBreakdownMaterialSourcesWithOutput(costBreakdownRaw, outputRaw) {
    if (!costBreakdownRaw?.materials?.sources || !outputRaw?.sources) {
        return costBreakdownRaw;
    }
    const mSources = costBreakdownRaw.materials.sources;
    const oSources = outputRaw.sources;
    if (
        !Array.isArray(mSources) ||
        !Array.isArray(oSources) ||
        mSources.length !== oSources.length
    ) {
        return costBreakdownRaw;
    }
    return {
        ...costBreakdownRaw,
        materials: {
            ...costBreakdownRaw.materials,
            sources: mSources.map((row, i) => {
                const o = oSources[i] || {};
                return {
                    ...row,
                    id: row.id ?? o.id,
                    source_type: row.source_type ?? o.source_type ?? o.sourceType,
                    product_id: row.product_id ?? o.product_id ?? o.productId,
                    production_output_consumption_id:
                        row.production_output_consumption_id ??
                        o.production_output_consumption_id ??
                        o.productionOutputConsumptionId,
                    product: row.product ?? o.product,
                    production_output_consumption:
                        row.production_output_consumption ??
                        o.production_output_consumption ??
                        o.productionOutputConsumption,
                };
            }),
        },
    };
}

/**
 * Añade `productionOutputConsumption` a cada fila usando `parentOutputConsumptions` del registro (árbol / API).
 * @param {object[]|undefined} sources
 * @param {object[]|undefined} parentOutputConsumptions
 * @returns {object[]}
 */
export function attachParentConsumptionsToSources(sources, parentOutputConsumptions) {
    if (!Array.isArray(sources) || sources.length === 0) return sources || [];
    if (!Array.isArray(parentOutputConsumptions) || parentOutputConsumptions.length === 0) {
        return sources;
    }
    const map = new Map();
    for (const c of parentOutputConsumptions) {
        if (c?.id != null) map.set(Number(c.id), c);
    }
    return sources.map((s) => {
        const cid = s.productionOutputConsumptionId ?? s.production_output_consumption_id;
        if (cid == null) return s;
        const c = map.get(Number(cid));
        if (!c) return s;
        return { ...s, productionOutputConsumption: c };
    });
}
