'use client';

import { useCallback, useState } from 'react';
import { ApiError } from '@/lib/api/apiHelpers';

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

const initialState = {
  step: 1,
  customerId: null,
  customerName: null,
  newCustomerName: '',
  entryDate: todayStr,
  loadDate: todayStr,
  boxes: [],
  items: [],
  invoiceRequired: false,
  observations: '',
  createdOrderId: null,
  createdOrder: null,
  routeId: null,
  routeStopId: null,
};

function aggregateItemsFromBoxes(boxes) {
  const byProduct = new Map();
  for (const box of boxes) {
    const id = Number(box.productId);
    if (!byProduct.has(id)) {
      byProduct.set(id, {
        productId: id,
        productName: box.productName ?? '',
        boxesCount: 0,
        totalWeight: 0,
        unitPrice: 0,
        subtotal: 0,
      });
    }
    const row = byProduct.get(id);
    row.boxesCount += 1;
    row.totalWeight += Number(box.netWeight) || 0;
  }
  const items = Array.from(byProduct.values());
  items.forEach((item) => {
    item.subtotal = item.totalWeight * item.unitPrice;
  });
  return items;
}

export function useFieldAutoventa({ createAutoventa, routeId = null, routeStopId = null, customerId = null } = {}) {
  const [state, setState] = useState({
    ...initialState,
    customerId: customerId ? String(customerId) : null,
    routeId: routeId ? String(routeId) : null,
    routeStopId: routeStopId ? String(routeStopId) : null,
  });

  const setStep = useCallback((step) => {
    setState((s) => ({ ...s, step: Math.max(1, Math.min(7, step)) }));
  }, []);

  const setCustomer = useCallback((customerIdValue, customerName) => {
    setState((s) => ({
      ...s,
      customerId: customerIdValue != null ? String(customerIdValue) : null,
      customerName: customerName ?? null,
      newCustomerName: '',
    }));
  }, []);

  const setNewCustomerName = useCallback((value) => {
    const nextName = typeof value === 'string' ? value.trim() : '';
    setState((s) => ({
      ...s,
      customerId: null,
      customerName: nextName || null,
      newCustomerName: nextName,
    }));
  }, []);

  const setDates = useCallback((entryDate, loadDate) => {
    setState((s) => ({
      ...s,
      entryDate: entryDate ?? s.entryDate,
      loadDate: loadDate ?? s.loadDate,
    }));
  }, []);

  const addBox = useCallback((box) => {
    setState((s) => ({
      ...s,
      boxes: [...(s.boxes || []), { ...box, productId: Number(box.productId), netWeight: Number(box.netWeight) || 0 }],
    }));
  }, []);

  const removeAllBoxes = useCallback(() => {
    setState((s) => ({ ...s, boxes: [], items: [] }));
  }, []);

  const removeBox = useCallback((index) => {
    setState((s) => {
      const boxes = [...(s.boxes || [])];
      if (index < 0 || index >= boxes.length) return s;
      boxes.splice(index, 1);
      const items = aggregateItemsFromBoxes(boxes);
      return { ...s, boxes, items };
    });
  }, []);

  const setItemsFromBoxes = useCallback(() => {
    setState((s) => {
      const items = aggregateItemsFromBoxes(s.boxes || []);
      return { ...s, items };
    });
  }, []);

  const setItemPrice = useCallback((productId, unitPrice) => {
    const price = Number(unitPrice) || 0;
    setState((s) => ({
      ...s,
      items: (s.items || []).map((item) =>
        Number(item.productId) === Number(productId)
          ? { ...item, unitPrice: price, subtotal: (item.totalWeight || 0) * price }
          : item
      ),
    }));
  }, []);

  const setInvoiceRequired = useCallback((value) => {
    setState((s) => ({ ...s, invoiceRequired: Boolean(value) }));
  }, []);

  const setObservations = useCallback((value) => {
    setState((s) => ({ ...s, observations: typeof value === 'string' ? value : '' }));
  }, []);

  const submitAutoventa = useCallback(async () => {
    const payload = {
      customer: state.customerId ? Number(state.customerId) : undefined,
      newCustomerName: state.customerId ? undefined : (state.newCustomerName || undefined),
      entryDate: state.entryDate,
      loadDate: state.loadDate,
      invoiceRequired: Boolean(state.invoiceRequired),
      observations: typeof state.observations === 'string' ? state.observations.slice(0, 1000) : '',
      routeId: state.routeId ? Number(state.routeId) : undefined,
      routeStopId: state.routeStopId ? Number(state.routeStopId) : undefined,
      items: (state.items || []).map((item) => ({
        productId: Number(item.productId),
        boxesCount: Number(item.boxesCount) || 0,
        totalWeight: Number(item.totalWeight) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        subtotal: Number(item.subtotal) || 0,
        tax: item.tax != null ? Number(item.tax) : undefined,
      })),
      boxes: (state.boxes || []).map((box) => ({
        productId: Number(box.productId),
        lot: box.lot || undefined,
        netWeight: Number(box.netWeight) || 0,
        gs1128: box.gs1128 || undefined,
        grossWeight: box.grossWeight != null ? Number(box.grossWeight) : undefined,
      })),
    };

    try {
      const response = await createAutoventa(payload);
      const order = response?.data ?? response;
      setState((s) => ({
        ...s,
        createdOrderId: order?.id ?? null,
        createdOrder: order ?? null,
        step: 7,
      }));
      return order;
    } catch (err) {
      if (err instanceof ApiError && err.data?.errors) {
        const messages = Object.values(err.data.errors).flat();
        throw new Error(messages.length ? messages.join(' ') : err.message);
      }
      throw err;
    }
  }, [createAutoventa, state]);

  const setCreatedOrder = useCallback((order) => {
    setState((s) => ({
      ...s,
      createdOrderId: order?.id ?? null,
      createdOrder: order ?? null,
    }));
  }, []);

  const reset = useCallback(() => {
    const currentDate = new Date().toISOString().slice(0, 10);
    setState({
      ...initialState,
      entryDate: currentDate,
      loadDate: currentDate,
      routeId: routeId ? String(routeId) : null,
      routeStopId: routeStopId ? String(routeStopId) : null,
    });
  }, [routeId, routeStopId]);

  const totalAmount = (state.items || []).reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  return {
    state,
    setStep,
    setCustomer,
    setNewCustomerName,
    setDates,
    addBox,
    removeBox,
    removeAllBoxes,
    setItemsFromBoxes,
    setItemPrice,
    setInvoiceRequired,
    setObservations,
    submitAutoventa,
    setCreatedOrder,
    reset,
    totalAmount,
  };
}
