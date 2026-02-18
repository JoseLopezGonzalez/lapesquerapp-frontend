'use client';

import { useState, useCallback } from 'react';
import { createAutoventa } from '@/services/autoventaService';

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

const initialState = {
  step: 1,
  customerId: null,
  customerName: null,
  entryDate: todayStr,
  loadDate: todayStr,
  boxes: [],
  items: [],
  invoiceRequired: false,
  observations: '',
  createdOrderId: null,
  createdOrder: null,
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

export function useAutoventa() {
  const [state, setState] = useState(initialState);

  const setStep = useCallback((step) => {
    setState((s) => ({ ...s, step: Math.max(1, Math.min(8, step)) }));
  }, []);

  const setCustomer = useCallback((customerId, customerName) => {
    setState((s) => ({
      ...s,
      customerId: customerId ?? null,
      customerName: customerName ?? null,
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
    const order = await createAutoventa(state);
    setState((s) => ({
      ...s,
      createdOrderId: order?.id ?? null,
      createdOrder: order ?? null,
      step: 8,
    }));
    return order;
  }, [state]);

  const setCreatedOrder = useCallback((order) => {
    setState((s) => ({
      ...s,
      createdOrderId: order?.id ?? null,
      createdOrder: order ?? null,
    }));
  }, []);

  const reset = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    setState({ ...initialState, entryDate: today, loadDate: today });
  }, []);

  const totalAmount = (state.items || []).reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  return {
    state,
    setStep,
    setCustomer,
    setDates,
    addBox,
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
