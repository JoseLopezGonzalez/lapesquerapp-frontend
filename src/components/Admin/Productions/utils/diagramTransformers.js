import dagre from 'dagre';
import {
  normalizeCostBreakdown,
  normalizeProductionOutputSource,
} from '@/helpers/production/costNormalizers';
import {
  mergeCostBreakdownMaterialSourcesWithOutput,
  attachParentConsumptionsToSources,
} from '@/helpers/production/mergeCostBreakdownMaterialSources';

/**
 * Calcula el nivel de profundidad de un nodo en el árbol
 */
function getNodeLevel(nodeId, edges, visited = new Set()) {
  if (visited.has(nodeId)) return 0;
  visited.add(nodeId);

  const incomingEdge = edges.find((e) => e.target === nodeId);
  if (!incomingEdge) return 0;

  return 1 + getNodeLevel(incomingEdge.source, edges, visited);
}

/**
 * Extrae información de productos de inputs.
 * Prioriza el coste directo de cada input / consumo padre devuelto por el árbol.
 * Solo usa outputs[].sources[] como fallback defensivo para payloads antiguos.
 */
function extractInputProducts(inputs, parentOutputConsumptions = [], outputs = []) {
  if (!inputs || !Array.isArray(inputs)) return [];

  const parentConsumptionMap = new Map();
  if (Array.isArray(parentOutputConsumptions)) {
    parentOutputConsumptions.forEach((consumption) => {
      if (!consumption) return;
      if (consumption.id !== undefined && consumption.id !== null) {
        parentConsumptionMap.set(`id:${consumption.id}`, consumption);
      }
      const productionOutputId =
        consumption.productionOutputId ??
        consumption.production_output_id ??
        consumption.productionOutput?.id ??
        consumption.production_output?.id;
      if (productionOutputId !== undefined && productionOutputId !== null) {
        parentConsumptionMap.set(`output:${productionOutputId}`, consumption);
      }
    });
  }

  const sourceByConsumptionId = new Map();
  if (Array.isArray(outputs)) {
    outputs.forEach((output) => {
      if (!Array.isArray(output?.sources)) return;
      output.sources.forEach((source) => {
        const consumptionId =
          source?.productionOutputConsumptionId ?? source?.production_output_consumption_id;
        if (
          consumptionId !== undefined &&
          consumptionId !== null &&
          !sourceByConsumptionId.has(consumptionId)
        ) {
          sourceByConsumptionId.set(consumptionId, source);
        }
      });
    });
  }

  const productsMap = {};
  inputs.forEach((input) => {
    if (!input) return;

    const relatedParentConsumption =
      parentConsumptionMap.get(`id:${input.id}`) ||
      parentConsumptionMap.get(
        `output:${input.productionOutputId ?? input.production_output_id ?? input.productionOutput?.id ?? input.production_output?.id}`
      ) ||
      null;

    const relatedSource =
      sourceByConsumptionId.get(input.id) ||
      sourceByConsumptionId.get(relatedParentConsumption?.id) ||
      null;

    const productName =
      input.product?.name ||
      input.box?.product?.name ||
      input.productionOutput?.product?.name ||
      input.production_output?.product?.name ||
      relatedParentConsumption?.product?.name ||
      relatedParentConsumption?.productionOutput?.product?.name ||
      relatedParentConsumption?.production_output?.product?.name;

    if (!productName) return;

    const weight = parseFloat(
      input.consumedWeightKg ??
        input.consumed_weight_kg ??
        input.weightKg ??
        input.weight_kg ??
        input.weight ??
        relatedParentConsumption?.consumedWeightKg ??
        relatedParentConsumption?.consumed_weight_kg ??
        relatedParentConsumption?.weight ??
        input.box?.netWeight ??
        input.box?.net_weight ??
        0
    );

    const boxes = parseFloat(
      input.consumedBoxes ??
        input.consumed_boxes ??
        input.boxes ??
        relatedParentConsumption?.consumedBoxes ??
        relatedParentConsumption?.consumed_boxes ??
        0
    );

    const costPerKg =
      input.costPerKg ??
      input.cost_per_kg ??
      input.box?.costPerKg ??
      input.box?.cost_per_kg ??
      input.productionOutput?.costPerKg ??
      input.productionOutput?.cost_per_kg ??
      input.production_output?.costPerKg ??
      input.production_output?.cost_per_kg ??
      relatedParentConsumption?.costPerKg ??
      relatedParentConsumption?.cost_per_kg ??
      relatedParentConsumption?.productionOutput?.costPerKg ??
      relatedParentConsumption?.productionOutput?.cost_per_kg ??
      relatedParentConsumption?.production_output?.costPerKg ??
      relatedParentConsumption?.production_output?.cost_per_kg ??
      null;

    const totalCost =
      input.totalCost ??
      input.total_cost ??
      relatedParentConsumption?.totalCost ??
      relatedParentConsumption?.total_cost ??
      relatedSource?.sourceTotalCost ??
      relatedSource?.source_total_cost ??
      null;

    const effectiveCostPerKg =
      costPerKg ?? relatedSource?.sourceCostPerKg ?? relatedSource?.source_cost_per_kg ?? null;

    if (!productsMap[productName]) {
      productsMap[productName] = {
        name: productName,
        boxes: 0,
        weight: 0,
        weightedCostTotal: 0,
        costWeightBase: 0,
        costPerKg: null,
      };
    }

    productsMap[productName].boxes += Number.isNaN(boxes)
      ? 0
      : boxes || (input.type === 'stock_box' ? 1 : 0);
    productsMap[productName].weight += Number.isNaN(weight) ? 0 : weight;

    if (totalCost !== null && totalCost !== undefined) {
      const numericTotalCost = parseFloat(totalCost);
      if (!Number.isNaN(numericTotalCost)) {
        const weightBase = !Number.isNaN(weight) && weight > 0 ? weight : 1;
        productsMap[productName].weightedCostTotal += numericTotalCost;
        productsMap[productName].costWeightBase += weightBase;
        productsMap[productName].costPerKg =
          productsMap[productName].weightedCostTotal / productsMap[productName].costWeightBase;
        return;
      }
    }

    if (effectiveCostPerKg !== null && effectiveCostPerKg !== undefined) {
      const numericCostPerKg = parseFloat(effectiveCostPerKg);
      if (!Number.isNaN(numericCostPerKg)) {
        const weightBase = !Number.isNaN(weight) && weight > 0 ? weight : 1;
        productsMap[productName].weightedCostTotal += numericCostPerKg * weightBase;
        productsMap[productName].costWeightBase += weightBase;
        productsMap[productName].costPerKg =
          productsMap[productName].weightedCostTotal / productsMap[productName].costWeightBase;
      }
    }
  });

  return Object.values(productsMap).map(
    ({ weightedCostTotal, costWeightBase, ...product }) => product
  );
}

/**
 * Extrae información de productos de outputs
 */
function extractOutputProducts(outputs) {
  if (!outputs || !Array.isArray(outputs)) return [];

  const productsMap = {};
  outputs.forEach((output) => {
    if (output.product?.name) {
      const productName = output.product.name;
      const weight = parseFloat(output.weightKg || output.weight || 0);
      const costPerKg = output.costPerKg ?? output.cost_per_kg ?? null;
      if (!productsMap[productName]) {
        productsMap[productName] = {
          name: productName,
          boxes: output.boxes || 0,
          weight: 0,
          weightedCostTotal: 0,
          costWeightBase: 0,
          costPerKg: null,
        };
      } else {
        productsMap[productName].boxes += output.boxes || 0;
      }
      productsMap[productName].weight += weight;

      if (costPerKg !== null && costPerKg !== undefined) {
        const numericCostPerKg = parseFloat(costPerKg);
        if (!Number.isNaN(numericCostPerKg)) {
          const weightBase = weight > 0 ? weight : 1;
          productsMap[productName].weightedCostTotal += numericCostPerKg * weightBase;
          productsMap[productName].costWeightBase += weightBase;
          productsMap[productName].costPerKg =
            productsMap[productName].weightedCostTotal / productsMap[productName].costWeightBase;
        }
      }
    }
  });

  return Object.values(productsMap).map(
    ({ weightedCostTotal, costWeightBase, ...product }) => product
  );
}

function normalizeNodeCosts(costs) {
  if (!costs) return null;

  return {
    totalCost: costs.totalCost ?? costs.total_cost ?? null,
    averageCostPerKg: costs.averageCostPerKg ?? costs.average_cost_per_kg ?? null,
    materialsCost: costs.materialsCost ?? costs.materials_cost ?? null,
    processCost: costs.processCost ?? costs.process_cost ?? null,
    productionCost: costs.productionCost ?? costs.production_cost ?? null,
    processProductionCost: costs.processProductionCost ?? costs.process_production_cost ?? null,
    processLaborCost: costs.processLaborCost ?? costs.process_labor_cost ?? null,
    processOperationalCost: costs.processOperationalCost ?? costs.process_operational_cost ?? null,
    processPackagingCost: costs.processPackagingCost ?? costs.process_packaging_cost ?? null,
    productionLevelProductionCost:
      costs.productionLevelProductionCost ?? costs.production_level_production_cost ?? null,
    productionLevelLaborCost:
      costs.productionLevelLaborCost ?? costs.production_level_labor_cost ?? null,
    productionLevelOperationalCost:
      costs.productionLevelOperationalCost ?? costs.production_level_operational_cost ?? null,
    productionLevelPackagingCost:
      costs.productionLevelPackagingCost ?? costs.production_level_packaging_cost ?? null,
  };
}

function normalizeAccountingOutput(output, parentOutputConsumptions = []) {
  if (!output) return null;

  const rawCostBreakdown = output.costBreakdown || output.cost_breakdown;
  const mergedRaw = mergeCostBreakdownMaterialSourcesWithOutput(rawCostBreakdown, output);
  const costBreakdown = normalizeCostBreakdown(mergedRaw);

  const rawSources = Array.isArray(output.sources) ? output.sources : [];
  const normalizedSources = rawSources
    .map((source) => normalizeProductionOutputSource(source))
    .filter(Boolean);

  let materialSources = Array.isArray(costBreakdown?.materials?.sources)
    ? costBreakdown.materials.sources
    : [];

  materialSources = attachParentConsumptionsToSources(materialSources, parentOutputConsumptions);

  const nextCostBreakdown =
    costBreakdown && materialSources.length > 0
      ? {
          ...costBreakdown,
          materials: {
            ...costBreakdown.materials,
            sources: materialSources,
          },
        }
      : costBreakdown;

  return {
    id: output.id,
    productId: output.productId ?? output.product_id ?? output.product?.id ?? null,
    product: output.product || null,
    boxes: output.boxes || 0,
    weightKg: parseFloat(output.weightKg ?? output.weight_kg ?? output.weight ?? 0),
    costPerKg: output.costPerKg ?? output.cost_per_kg ?? null,
    totalCost: output.totalCost ?? output.total_cost ?? null,
    costBreakdown: nextCostBreakdown,
    sources: materialSources.length > 0 ? materialSources : normalizedSources,
  };
}

function normalizeSalesMetrics(entity) {
  if (!entity) return {};

  return {
    salePricePerKg: entity.salePricePerKg ?? entity.sale_price_per_kg ?? null,
    saleSubtotal: entity.saleSubtotal ?? entity.sale_subtotal ?? null,
    saleTotal: entity.saleTotal ?? entity.sale_total ?? null,
    costPerKg: entity.costPerKg ?? entity.cost_per_kg ?? null,
    costTotal: entity.costTotal ?? entity.cost_total ?? null,
    marginTotalExTax: entity.marginTotalExTax ?? entity.margin_total_ex_tax ?? null,
    marginPerKgExTax: entity.marginPerKgExTax ?? entity.margin_per_kg_ex_tax ?? null,
    marginPercentageExTax: entity.marginPercentageExTax ?? entity.margin_percentage_ex_tax ?? null,
  };
}

function normalizeSalesOrders(orders) {
  if (!Array.isArray(orders)) return [];

  return orders.map((orderData) => ({
    ...orderData,
    ...normalizeSalesMetrics(orderData),
    products: Array.isArray(orderData.products)
      ? orderData.products.map((productData) => ({
          ...productData,
          ...normalizeSalesMetrics(productData),
        }))
      : [],
  }));
}

function normalizeStockMetrics(entity) {
  if (!entity) return {};

  return {
    costPerKg: entity.costPerKg ?? entity.cost_per_kg ?? null,
    costTotal: entity.costTotal ?? entity.cost_total ?? null,
  };
}

function normalizeStockStores(stores) {
  if (!Array.isArray(stores)) return [];

  return stores.map((storeData) => ({
    ...storeData,
    ...normalizeStockMetrics(storeData),
    products: Array.isArray(storeData.products)
      ? storeData.products.map((productData) => ({
          ...productData,
          ...normalizeStockMetrics(productData),
        }))
      : [],
  }));
}

function normalizeReprocessedMetrics(entity) {
  if (!entity) return {};

  return {
    costPerKg: entity.costPerKg ?? entity.cost_per_kg ?? null,
    costTotal: entity.costTotal ?? entity.cost_total ?? null,
  };
}

function normalizeReprocessedProcesses(processes) {
  if (!Array.isArray(processes)) return [];

  return processes.map((processData) => ({
    ...processData,
    ...normalizeReprocessedMetrics(processData),
    products: Array.isArray(processData.products)
      ? processData.products.map((productData) => ({
          ...productData,
          ...normalizeReprocessedMetrics(productData),
        }))
      : [],
  }));
}

/**
 * Identifica el tipo de nodo (PROCESS, SALES, STOCK, REPROCESSED, BALANCE)
 */
function getNodeType(node) {
  if (node.type === 'sales') {
    return 'SALES';
  }
  if (node.type === 'stock') {
    return 'STOCK';
  }
  if (node.type === 'reprocessed') {
    return 'REPROCESSED';
  }
  if (node.type === 'balance') {
    return 'BALANCE'; // Nodo de balance (faltantes y sobras)
  }
  // Si no tiene type o es null/undefined, es un nodo de proceso
  return 'PROCESS';
}

/**
 * Verifica si un nodo es de proceso
 */
function isProcessNode(node) {
  return getNodeType(node) === 'PROCESS';
}

/**
 * Verifica si un nodo es de venta
 */
function isSalesNode(node) {
  return getNodeType(node) === 'SALES';
}

/**
 * Verifica si un nodo es de stock
 */
function isStockNode(node) {
  return getNodeType(node) === 'STOCK';
}

/**
 * Verifica si un nodo es de reprocesado
 */
function isReprocessedNode(node) {
  return getNodeType(node) === 'REPROCESSED';
}

/**
 * Verifica si un nodo es de balance
 */
function isBalanceNode(node) {
  return getNodeType(node) === 'BALANCE';
}

/**
 * Transforma el árbol de procesos del API a nodos y edges de React Flow
 * @param {Object} processTree - Árbol de procesos del API
 * @param {boolean} includeDetails - Si incluir información detallada de productos
 * @param {string} viewMode - Modo de visualización ('simple', 'detailed', 'accounting')
 */
export function transformProcessTreeToFlow(
  processTree,
  includeDetails = false,
  viewMode = 'simple'
) {
  if (!processTree) {
    console.warn('transformProcessTreeToFlow: processTree es null o undefined');
    return { nodes: [], edges: [] };
  }

  if (!processTree.processNodes) {
    console.warn(
      'transformProcessTreeToFlow: processTree.processNodes es null o undefined',
      processTree
    );
    return { nodes: [], edges: [] };
  }

  if (!Array.isArray(processTree.processNodes) || processTree.processNodes.length === 0) {
    console.warn(
      'transformProcessTreeToFlow: processTree.processNodes está vacío o no es un array',
      processTree.processNodes
    );
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];
  const nodeMap = new Map();
  const isAccountingMode = viewMode === 'accounting';

  // Crear nodos y edges recursivamente
  function createNodesAndEdges(node, parentId = null) {
    if (!node) {
      console.warn('createNodesAndEdges: node es null o undefined');
      return;
    }

    if (node.id === undefined || node.id === null) {
      console.warn('createNodesAndEdges: node.id es undefined o null', node);
      return;
    }

    const nodeType = getNodeType(node);
    const nodeId = String(node.id);

    let flowNode;

    // Crear nodo según su tipo
    if (isProcessNode(node)) {
      // Nodo de proceso (existente)
      const parentConsumptions =
        node.parentOutputConsumptions || node.parent_output_consumptions || [];
      const inputProducts = includeDetails
        ? extractInputProducts(node.inputs, parentConsumptions, node.outputs)
        : [];
      const outputProducts = includeDetails ? extractOutputProducts(node.outputs) : [];
      const nodeCosts = isAccountingMode ? normalizeNodeCosts(node.costs) : null;
      const accountingOutputs =
        isAccountingMode && Array.isArray(node.outputs)
          ? node.outputs
              .map((out) => normalizeAccountingOutput(out, parentConsumptions))
              .filter(Boolean)
          : [];

      // Verificar si el nodo tiene hijos de venta/stock/reprocessed/balance (para mostrar handle de salida en nodos finales)
      const hasSalesOrStockChildren =
        node.children &&
        Array.isArray(node.children) &&
        node.children.some((child) => {
          const childType = getNodeType(child);
          const isSpecialNode =
            childType === 'SALES' ||
            childType === 'STOCK' ||
            childType === 'REPROCESSED' ||
            childType === 'BALANCE';
          if (isSpecialNode && node.isFinal) {
            console.log(`🔗 Nodo final ${nodeId} tiene hijo especial: ${childType}`);
          }
          return isSpecialNode;
        });

      flowNode = {
        id: nodeId,
        type: 'processNode',
        position: { x: 0, y: 0 }, // Se calculará después
        data: {
          recordId: node.id,
          processName: node.process?.name || 'Sin nombre',
          isRoot: node.isRoot || false,
          isFinal: node.isFinal || false,
          hasSalesOrStockChildren: hasSalesOrStockChildren || false, // Para mostrar handle de salida
          // isCompleted: usar el valor del API si está definido, sino verificar finishedAt
          isCompleted:
            node.isCompleted !== undefined
              ? node.isCompleted === true
              : node.finishedAt !== null && node.finishedAt !== undefined && node.finishedAt !== '',
          totals: node.totals
            ? {
                // Si viene node.totals, parsear valores que pueden ser strings
                inputWeight: parseFloat(node.totals.inputWeight || node.totalInputWeight || 0),
                outputWeight: parseFloat(node.totals.outputWeight || node.totalOutputWeight || 0),
                inputBoxes: parseInt(node.totals.inputBoxes || node.totalInputBoxes || 0, 10),
                outputBoxes: parseInt(node.totals.outputBoxes || node.totalOutputBoxes || 0, 10),
                waste: parseFloat(node.totals.waste || node.waste || 0),
                wastePercentage: parseFloat(
                  node.totals.wastePercentage || node.wastePercentage || 0
                ),
                yield: parseFloat(node.totals.yield || node.yield || 0),
                yieldPercentage: parseFloat(
                  node.totals.yieldPercentage || node.yieldPercentage || 0
                ),
              }
            : {
                // Si no viene node.totals, usar valores directos
                inputWeight: parseFloat(node.totalInputWeight || 0),
                outputWeight: parseFloat(node.totalOutputWeight || 0),
                inputBoxes: parseInt(node.totalInputBoxes || 0, 10),
                outputBoxes: parseInt(node.totalOutputBoxes || 0, 10),
                waste: parseFloat(node.waste || 0),
                wastePercentage: parseFloat(node.wastePercentage || 0),
                yield: parseFloat(node.yield || 0),
                yieldPercentage: parseFloat(node.yieldPercentage || 0),
              },
          startedAt: node.startedAt,
          finishedAt: node.finishedAt,
          notes: node.notes,
          // Información detallada de productos (solo en modo detallado o accounting)
          inputProducts: includeDetails ? inputProducts : [],
          outputProducts: includeDetails ? outputProducts : [],
          nodeCosts,
          accountingOutputs,
          viewMode: viewMode,
        },
      };
    } else if (isSalesNode(node)) {
      // Nodo de venta (v3 - agrupa múltiples productos del nodo final)
      // Determinar el parentRecordId: usar el que viene en el nodo, o el parentId recibido
      const salesParentRecordId = node.parentRecordId || (parentId ? parseInt(parentId, 10) : null);
      const normalizedOrders = normalizeSalesOrders(node.orders);

      flowNode = {
        id: nodeId,
        type: 'salesNode',
        position: { x: 0, y: 0 }, // Se calculará después
        data: {
          orders: normalizedOrders, // v3: Array de pedidos, cada pedido tiene array de productos
          totalBoxes: node.totalBoxes || 0,
          totalNetWeight: node.totalNetWeight || 0,
          summary: {
            ...(node.summary || {}),
            ...normalizeSalesMetrics(node.summary || {}),
          },
          parentRecordId: salesParentRecordId, // Guardar para conexión
          viewMode: viewMode,
        },
      };

      console.log(
        `📦 Nodo de venta creado: ${nodeId}, parentRecordId guardado: ${salesParentRecordId}, orders: ${(normalizedOrders || []).length}`
      );
    } else if (isStockNode(node)) {
      // Nodo de stock (v3 - agrupa múltiples productos del nodo final)
      const stockParentRecordId = node.parentRecordId || (parentId ? parseInt(parentId, 10) : null);
      const normalizedStores = normalizeStockStores(node.stores);

      flowNode = {
        id: nodeId,
        type: 'stockNode',
        position: { x: 0, y: 0 }, // Se calculará después
        data: {
          stores: normalizedStores, // v3: Array de almacenes, cada almacén tiene array de productos
          totalBoxes: node.totalBoxes || 0,
          totalNetWeight: node.totalNetWeight || 0,
          summary: {
            ...(node.summary || {}),
            ...normalizeStockMetrics(node.summary || {}),
          },
          parentRecordId: stockParentRecordId, // Guardar para conexión
          viewMode: viewMode,
        },
      };

      console.log(
        `📦 Nodo de stock creado: ${nodeId}, parentRecordId guardado: ${stockParentRecordId}, stores: ${(normalizedStores || []).length}`
      );
    } else if (isReprocessedNode(node)) {
      // Nodo de reprocesado
      const reprocessedParentRecordId =
        node.parentRecordId || (parentId ? parseInt(parentId, 10) : null);
      const normalizedProcesses = normalizeReprocessedProcesses(node.processes);

      flowNode = {
        id: nodeId,
        type: 'reprocessedNode',
        position: { x: 0, y: 0 }, // Se calculará después
        data: {
          processes: normalizedProcesses, // Array de procesos de reprocesado
          totalBoxes: node.totalBoxes || 0,
          totalNetWeight: node.totalNetWeight || 0,
          summary: {
            ...(node.summary || {}),
            ...normalizeReprocessedMetrics(node.summary || {}),
          },
          parentRecordId: reprocessedParentRecordId, // Guardar para conexión
          viewMode: viewMode,
        },
      };

      console.log(
        `🔄 Nodo de reprocesado creado: ${nodeId}, parentRecordId guardado: ${reprocessedParentRecordId}, processes: ${(normalizedProcesses || []).length}`
      );
    } else if (isBalanceNode(node)) {
      // Nodo de balance (faltantes y sobras)
      const balanceParentRecordId =
        node.parentRecordId || (parentId ? parseInt(parentId, 10) : null);

      flowNode = {
        id: nodeId,
        type: 'restantesNode',
        position: { x: 0, y: 0 }, // Se calculará después
        data: {
          products: node.products || [], // Array de productos con información de balance
          summary: node.summary || {},
          parentRecordId: balanceParentRecordId, // Guardar para conexión
          viewMode: viewMode,
        },
      };

      console.log(
        `📦 Nodo de balance creado: ${nodeId}, parentRecordId guardado: ${balanceParentRecordId}, products: ${(node.products || []).length}`
      );
    } else {
      // Tipo de nodo desconocido, saltarlo
      console.warn(`Tipo de nodo desconocido:`, node);
      return;
    }

    nodes.push(flowNode);
    nodeMap.set(nodeId, { node, flowNode });

    // Para nodos de venta/stock, determinar el parentId correcto
    // Si viene como child en la recursión, usar parentId. Si no, usar parentRecordId
    let effectiveParentId = parentId;

    // Si no hay parentId (no viene de recursión) pero hay parentRecordId, usarlo
    if (!effectiveParentId && node.parentRecordId) {
      effectiveParentId = String(node.parentRecordId);
    }

    // Para nodos de venta/stock que están en children, crear el edge después de procesar todos los nodos
    // Para nodos de proceso, crear el edge inmediatamente si el padre existe
    if (effectiveParentId && isProcessNode(node)) {
      // Para nodos de proceso, crear edge inmediatamente si el padre existe
      const parentExists = nodes.some((n) => n.id === effectiveParentId);
      if (parentExists) {
        const edgeId = `e${effectiveParentId}-${nodeId}`;
        if (!edges.find((e) => e.id === edgeId)) {
          const isCompleted =
            node.isCompleted !== undefined
              ? node.isCompleted === true
              : node.finishedAt !== null && node.finishedAt !== undefined && node.finishedAt !== '';

          edges.push({
            id: edgeId,
            source: effectiveParentId,
            target: nodeId,
            type: 'smoothstep',
            animated: !isCompleted, // Animar si el proceso no está completado
            style: {
              stroke: isCompleted ? '#a1a1aa' : '#9ca3af',
              strokeWidth: 2,
              strokeDasharray: isCompleted ? '0' : '5,5',
            },
            markerEnd: {
              type: 'arrowclosed',
              color: isCompleted ? '#a1a1aa' : '#9ca3af',
            },
          });
        }
      }
    }
    // Para nodos de venta/stock, el edge se creará en el segundo paso después de crear todos los nodos

    // Procesar hijos recursivamente
    if (node.children && Array.isArray(node.children) && node.children.length > 0) {
      // Diagnóstico: para nodos finales, contar cuántos hijos especiales hay
      if (node.isFinal) {
        const salesChildren = node.children.filter((child) => getNodeType(child) === 'SALES');
        const stockChildren = node.children.filter((child) => getNodeType(child) === 'STOCK');
        const reprocessedChildren = node.children.filter(
          (child) => getNodeType(child) === 'REPROCESSED'
        );
        const balanceChildren = node.children.filter((child) => getNodeType(child) === 'BALANCE');
        console.log(
          `🔍 Nodo final ${nodeId} tiene ${salesChildren.length} venta(s), ${stockChildren.length} stock(s), ${reprocessedChildren.length} reprocesado(s), ${balanceChildren.length} balance(s)`
        );

        if (salesChildren.length > 1) {
          console.warn(
            `⚠️ PROBLEMA: El nodo final ${nodeId} tiene ${salesChildren.length} nodos de VENTA. Debería haber solo 1.`
          );
          console.warn(
            'Nodos de venta encontrados:',
            salesChildren.map((c) => ({ id: c.id, parentRecordId: c.parentRecordId }))
          );
        }
        if (stockChildren.length > 1) {
          console.warn(
            `⚠️ PROBLEMA: El nodo final ${nodeId} tiene ${stockChildren.length} nodos de STOCK. Debería haber solo 1.`
          );
          console.warn(
            'Nodos de stock encontrados:',
            stockChildren.map((c) => ({ id: c.id, parentRecordId: c.parentRecordId }))
          );
        }
      }

      node.children.forEach((child) => {
        // Pasar el nodeId del nodo actual como parentId para sus hijos
        const childParentId = isProcessNode(node) ? nodeId : effectiveParentId;
        createNodesAndEdges(child, childParentId);
      });
    }
  }

  // Crear todos los nodos y edges desde los nodos raíz
  try {
    if (Array.isArray(processTree.processNodes)) {
      processTree.processNodes.forEach((rootNode) => {
        try {
          createNodesAndEdges(rootNode);
        } catch (error) {
          console.error('Error al procesar nodo raíz:', rootNode, error);
        }
      });
    }

    // Segundo paso: crear/verificar edges para TODOS los nodos especiales (venta/stock/reprocessed/balance)
    // Esto asegura que los nodos padre ya existan y las conexiones se crean correctamente
    nodes.forEach((flowNode) => {
      if (
        flowNode.type === 'salesNode' ||
        flowNode.type === 'stockNode' ||
        flowNode.type === 'reprocessedNode' ||
        flowNode.type === 'restantesNode'
      ) {
        // Obtener parentRecordId del data o intentar inferirlo
        let parentRecordId = flowNode.data.parentRecordId;

        // Si no hay parentRecordId en data, no podemos crear el edge
        if (!parentRecordId) {
          console.warn(`⚠️ Nodo ${flowNode.id} (${flowNode.type}) no tiene parentRecordId`);
          return;
        }

        const parentId = String(parentRecordId);
        const edgeId = `e${parentId}-${flowNode.id}`;

        // Verificar si el edge ya existe
        const edgeExists = edges.find((e) => e.id === edgeId);

        if (!edgeExists) {
          const parentExists = nodes.some((n) => n.id === parentId);

          if (parentExists) {
            const isSales = flowNode.type === 'salesNode';
            const isStock = flowNode.type === 'stockNode';
            const isReprocessed = flowNode.type === 'reprocessedNode';
            const isBalance = flowNode.type === 'restantesNode';

            // Verificar si el nodo padre es final
            const parentNode = nodes.find((n) => n.id === parentId);
            const isParentFinal = parentNode?.data?.isFinal || false;

            // Determinar color según el tipo de nodo
            let edgeColor = '#a1a1aa';
            if (isSales) {
              edgeColor = '#22c55e'; // Verde para venta
            } else if (isStock) {
              edgeColor = '#3b82f6'; // Azul para stock
            } else if (isReprocessed) {
              edgeColor = '#f97316'; // Naranja para reprocesado
            } else if (isBalance) {
              edgeColor = '#ef4444'; // Rojo para balance (alerta)
            }

            edges.push({
              id: edgeId,
              source: parentId,
              target: flowNode.id,
              type: 'smoothstep',
              animated: false,
              style: {
                stroke: edgeColor,
                strokeWidth: 2.5,
                // Si el padre es final, línea sólida (sin dash)
                strokeDasharray: isParentFinal ? '0' : '8,4',
              },
              markerEnd: {
                type: 'arrowclosed',
                color: edgeColor,
              },
            });
            console.log(
              `✅ Edge creado en segundo paso: ${edgeId} (${parentId} -> ${flowNode.id})`
            );
          } else {
            console.warn(
              `⚠️ Nodo padre ${parentId} no encontrado para nodo ${flowNode.id} (${flowNode.type}). Nodos disponibles:`,
              nodes.map((n) => `${n.id} (${n.type})`)
            );
          }
        } else {
          console.log(`ℹ️ Edge ya existe: ${edgeId}`);
        }
      }
    });

    // Diagnóstico final: contar nodos creados
    const salesNodesCount = nodes.filter((n) => n.type === 'salesNode').length;
    const stockNodesCount = nodes.filter((n) => n.type === 'stockNode').length;
    const reprocessedNodesCount = nodes.filter((n) => n.type === 'reprocessedNode').length;
    const balanceNodesCount = nodes.filter((n) => n.type === 'restantesNode').length;
    const processNodesCount = nodes.filter((n) => n.type === 'processNode').length;

    console.log(
      `transformProcessTreeToFlow: Creados ${nodes.length} nodos totales (${processNodesCount} procesos, ${salesNodesCount} venta(s), ${stockNodesCount} stock(s), ${reprocessedNodesCount} reprocesado(s), ${balanceNodesCount} balance(s)) y ${edges.length} edges`
    );

    if (salesNodesCount > 1) {
      console.warn(
        `⚠️ ATENCIÓN: Se crearon ${salesNodesCount} nodos de VENTA. Debería haber solo 1 por nodo final.`
      );
      const salesNodes = nodes.filter((n) => n.type === 'salesNode');
      console.warn(
        'IDs de nodos de venta:',
        salesNodes.map((n) => ({ id: n.id, parentRecordId: n.data.parentRecordId }))
      );
    }
    if (stockNodesCount > 1) {
      console.warn(
        `⚠️ ATENCIÓN: Se crearon ${stockNodesCount} nodos de STOCK. Debería haber solo 1 por nodo final.`
      );
      const stockNodes = nodes.filter((n) => n.type === 'stockNode');
      console.warn(
        'IDs de nodos de stock:',
        stockNodes.map((n) => ({ id: n.id, parentRecordId: n.data.parentRecordId }))
      );
    }

    return { nodes, edges };
  } catch (error) {
    console.error('Error en transformProcessTreeToFlow:', error);
    return { nodes: [], edges: [] };
  }
}

/**
 * Calcula el layout automático usando dagre
 */
export function getLayoutedElements(nodes, edges, direction = 'LR') {
  if (nodes.length === 0) return { nodes, edges };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configuración del layout
  dagreGraph.setGraph({
    rankdir: direction, // LR = Left to Right, TB = Top to Bottom
    nodesep: 100, // Separación horizontal entre nodos
    ranksep: 200, // Separación vertical entre niveles
    edgesep: 50, // Separación entre edges paralelos
  });

  // Añadir nodos al grafo (tamaño variable según modo y tipo)
  nodes.forEach((node) => {
    const isDetailed = node.data?.viewMode === 'detailed';
    const isAccounting = node.data?.viewMode === 'accounting';
    const isSpecialNode =
      node.type === 'salesNode' ||
      node.type === 'stockNode' ||
      node.type === 'reprocessedNode' ||
      node.type === 'restantesNode';

    // Tamaños base
    let width = isAccounting ? 460 : isDetailed ? 400 : 300;
    let height = isAccounting ? 640 : isDetailed ? 300 : 200;

    // Los nodos especiales: más pequeños en vista simple, más grandes en detallada
    if (isSpecialNode) {
      width = isDetailed ? 450 : 320;
      height = isDetailed ? 400 : 250;
    }

    dagreGraph.setNode(node.id, {
      width,
      height,
    });
  });

  // Añadir edges al grafo
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calcular layout
  dagre.layout(dagreGraph);

  // Aplicar posiciones calculadas
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const isDetailed = node.data?.viewMode === 'detailed';
    const isAccounting = node.data?.viewMode === 'accounting';
    const isSpecialNode =
      node.type === 'salesNode' ||
      node.type === 'stockNode' ||
      node.type === 'reprocessedNode' ||
      node.type === 'restantesNode';

    let nodeWidth = isAccounting ? 460 : isDetailed ? 400 : 300;
    let nodeHeight = isAccounting ? 640 : isDetailed ? 300 : 200;

    // Los nodos especiales: más pequeños en vista simple, más grandes en detallada
    if (isSpecialNode) {
      nodeWidth = isDetailed ? 450 : 320;
      nodeHeight = isDetailed ? 400 : 250;
    }

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2, // Centrar el nodo
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Layout manual simple (fallback si dagre falla)
 */
export function getManualLayout(nodes, edges) {
  if (nodes.length === 0) return { nodes, edges };

  const levels = {};
  const nodeLevels = new Map();

  // Calcular nivel de cada nodo
  nodes.forEach((node) => {
    const level = getNodeLevel(node.id, edges);
    nodeLevels.set(node.id, level);

    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
  });

  // Posicionar nodos por nivel
  const layoutedNodes = nodes.map((node) => {
    const level = nodeLevels.get(node.id);
    const nodesInLevel = levels[level];
    const indexInLevel = nodesInLevel.findIndex((n) => n.id === node.id);
    const isDetailed = node.data?.viewMode === 'detailed';
    const isAccounting = node.data?.viewMode === 'accounting';
    const isSpecialNode =
      node.type === 'salesNode' ||
      node.type === 'stockNode' ||
      node.type === 'reprocessedNode' ||
      node.type === 'restantesNode';

    // Separación horizontal
    const horizontalSpacing = isAccounting ? 520 : isDetailed ? 450 : 350;

    // Separación vertical (más espacio para nodos especiales que pueden tener muchos items)
    const verticalSpacing = isSpecialNode
      ? isDetailed
        ? 450
        : 420
      : isAccounting
        ? 720
        : isDetailed
          ? 320
          : 220;

    const x = level * horizontalSpacing;
    const y = indexInLevel * verticalSpacing;

    return {
      ...node,
      position: { x, y },
    };
  });

  return { nodes: layoutedNodes, edges };
}
