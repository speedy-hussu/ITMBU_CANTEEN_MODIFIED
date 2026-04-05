// import axios from "axios";

// const api = axios.create({
//   baseURL: "https://itmbu-canteeen.onrender.com/api/items",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   withCredentials: true,
//   xsrfCookieName: "csrf_token", // Add this
//   xsrfHeaderName: "X-CSRF-TOKEN", // Add this
// });

// //fetch all items
// export const fetchItems = async () => {
//   const res = await api.get("/");
//   return res.data;
// };
import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Crucial for cookies to work
});

export const loginUser = async (
  enrollmentId: string,
  password: string,
): Promise<any> => {
  const response = await api.post("/auth/login", { enrollmentId, password });
  return response.data;
};

export const getUserItems = async (): Promise<any> => {
  const response = await api.get("/items");
  return response.data;
};
export const getMe = async (): Promise<any> => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const getAdminMe = async (): Promise<any> => {
  const response = await api.get("/admin/auth/me");
  return response.data;
};

export const adminLogin = async (
  username: string,
  password: string,
): Promise<any> => {
  const response = await api.post("/admin/auth/login", { username, password });
  return response.data;
};

export const logoutUser = async (): Promise<any> => {
  const response = await api.post("/auth/logout");
  return response.data;
};

// User API Functions
export const fetchUserItems = async (): Promise<any> => {
  const response = await api.get("/items");
  return response.data;
};

export const fetchUserOrders = async (): Promise<any> => {
  const response = await api.get("/user/orders");
  return response.data;
};

// Admin API Functions
export const fetchAdminItems = async (): Promise<any> => {
  const response = await api.get("/admin/items");
  return response.data;
};

export const createItem = async (itemData: {
  name: string;
  price: number;
  isAvailable: boolean;
}): Promise<any> => {
  const response = await api.post("/admin/items", itemData);
  return response.data;
};

export const updateItem = async (
  itemId: string,
  itemData: {
    name: string;
    price: number;
    isAvailable: boolean;
  },
): Promise<any> => {
  const response = await api.patch(`/admin/items/${itemId}`, itemData);
  return response.data;
};

export const deleteItem = async (itemId: string): Promise<any> => {
  const response = await api.delete(`/admin/items/${itemId}`);
  return response.data;
};

export const fetchOrders = async (): Promise<any> => {
  const response = await api.get(`/admin/orders`);
  return response.data;
};

export const updateOrderItemStatus = async (
  orderId: string,
  itemId: string,
  status: string,
): Promise<any> => {
  const response = await api.patch(`/admin/orders/${orderId}/items/${itemId}`, {
    status,
  });
  return response.data;
};

export const completeOrder = async (orderId: string): Promise<any> => {
  const response = await api.patch(`/admin/orders/${orderId}/complete`);
  return response.data;
};

// Menu Template API Functions
export const fetchMenuTemplates = async (): Promise<any> => {
  const response = await api.get("/admin/menu-templates");
  return response.data;
};

export const fetchMenuTemplatesByDay = async (day: string): Promise<any> => {
  const response = await api.get(`/admin/menu-templates/day/${day}`);
  return response.data;
};

// User - Get Today's Menu (fetches current day's menu templates)
export const getTodayMenu = async (): Promise<any> => {
  const response = await api.get("/menu/today");
  return response.data;
};

export const createMenuTemplate = async (templateData: {
  name: string;
  dayOfWeek: string;
  mealType: string;
  items: Array<{
    itemId: string;
    quantity?: number;
    specialPrice?: number;
  }>;
  description?: string;
}): Promise<any> => {
  const response = await api.post("/admin/menu-templates", templateData);
  return response.data;
};

export const updateMenuTemplate = async (
  templateId: string,
  templateData: {
    name?: string;
    items?: Array<{
      itemId: string;
      quantity?: number;
      specialPrice?: number;
    }>;
    description?: string;
    isActive?: boolean;
  },
): Promise<any> => {
  const response = await api.patch(
    `/admin/menu-templates/${templateId}`,
    templateData,
  );
  return response.data;
};

export const deleteMenuTemplate = async (templateId: string): Promise<any> => {
  const response = await api.delete(`/admin/menu-templates/${templateId}`);
  return response.data;
};

// Analytics API
export const fetchAnalytics = async (): Promise<any> => {
  const response = await api.get("/admin/analytics");
  return response.data;
};

export const setCanteenMode = async (mode: string): Promise<any> => {
  console.warn("setCanteenMode: Backend endpoint not implemented yet");
  throw new Error("Not implemented");
};

export const getCanteenMode = async (): Promise<any> => {
  console.warn("getCanteenMode: Backend endpoint not implemented yet");
  return { mode: "OFFLINE" };
};
