import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  xsrfCookieName: "csrf_token",
  xsrfHeaderName: "X-CSRF-TOKEN",
});

// Get today's menu from local backend
export const getTodayMenu = async (): Promise<any> => {
  const response = await api.get("/menu/today");
  return response.data;
};

export default api;
