// hooks/useOrders.ts
import { api } from "@/api/api";
import { useOrderStore } from "@/store/orderStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const useOrders = () => {
  const setOrders = useOrderStore((state) => state.setOrders);
  const existingOrders = useOrderStore((state) => state.orders);

  const query = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await api.get("/user/orders");
      return data.orders;
    },
    // Only fetch if no orders exist (initial load)
    enabled: existingOrders.length === 0,
  });

  // Sync fetched orders to store only on initial load
  useEffect(() => {
    if (query.data && existingOrders.length === 0) {
      setOrders(query.data);
    }
  }, [query.data, setOrders, existingOrders.length]);

  return query;
};
