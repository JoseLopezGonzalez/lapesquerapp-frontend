"use client";

import { useOrderContext } from "@/context/OrderContext";
import { useCustomerHistory } from "@/hooks/useCustomerHistory";
import CustomerOrderHistoryView from "@/components/Shared/CustomerOrderHistoryView";

export default function OrderCustomerHistory() {
  const { order } = useOrderContext();
  const historyState = useCustomerHistory(order);

  return <CustomerOrderHistoryView {...historyState} />;
}
