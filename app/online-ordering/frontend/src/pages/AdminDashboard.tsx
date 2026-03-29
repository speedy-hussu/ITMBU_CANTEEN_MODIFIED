import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  ChefHat,
  UtensilsCrossed,
  Power,
  LogOut,
  Check,
  X,
  Clock,
  Package,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  Store,
  Moon,
  User,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

import { useAuthStore } from "@/store/authStore";
import {
  fetchOrders,
  updateOrderItemStatus,
  completeOrder,
  fetchAdminItems,
  createItem,
  updateItem,
  deleteItem,
  setCanteenMode,
  getCanteenMode,
  logoutUser,
} from "@/api/api";

interface Order {
  _id: string;
  token: string;
  status: "IN QUEUE" | "READY" | "DELIVERED" | "CANCELLED";
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    price: number;
    status: "PENDING" | "IN QUEUE" | "READY" | "CANCELLED";
  }>;
  userId: string;
  totalAmount: number;
  createdAt: string;
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "profile">(
    "orders",
  );
  const [orderFilter, setOrderFilter] = useState<
    "IN QUEUE" | "READY" | "DELIVERED" | "CANCELLED"
  >("IN QUEUE");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [canteenMode, setCanteenModeState] = useState<
    "ONLINE" | "OFFLINE" | "DRAINING"
  >("OFFLINE");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      toast.error("Access denied. Admin only.");
      navigate("/admin/login");
    }
  }, [user, navigate]);

  // Fetch orders
  const fetchOrdersData = useCallback(async () => {
    try {
      const response = await fetchOrders();
      setOrders(response.orders || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }, []);

  // Fetch menu items
  const fetchMenuData = useCallback(async () => {
    try {
      const response = await fetchAdminItems();
      setMenuItems(response.items || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }
  }, []);

  // Fetch canteen mode
  const fetchCanteenMode = useCallback(async () => {
    try {
      const response = await getCanteenMode();
      setCanteenModeState(response.mode || "OFFLINE");
    } catch (error) {
      console.error("Failed to fetch canteen mode:", error);
    }
  }, []);

  useEffect(() => {
    fetchOrdersData();
  }, [fetchOrdersData]);

  useEffect(() => {
    if (activeTab === "menu") {
      fetchMenuData();
    }
  }, [activeTab, fetchMenuData]);

  useEffect(() => {
    fetchCanteenMode();
  }, [fetchCanteenMode]);

  // Handle item status update
  const handleItemStatus = async (
    orderId: string,
    itemId: string,
    status: "IN QUEUE" | "READY" | "CANCELLED",
  ) => {
    try {
      await updateOrderItemStatus(orderId, itemId, status);
      toast.success(`Item ${status.toLowerCase()}`);
      fetchOrdersData();
    } catch (error: any) {
      toast.error(error.message || "Failed to update item");
    }
  };

  // Handle complete order
  const handleCompleteOrder = async (orderId: string) => {
    try {
      await completeOrder(orderId);
      toast.success("Order completed!");
      fetchOrdersData();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete order");
    }
  };

  // Handle canteen mode toggle
  const handleCanteenModeChange = async (
    mode: "ONLINE" | "OFFLINE" | "DRAINING",
  ) => {
    try {
      setIsLoading(true);
      await setCanteenMode(mode);
      setCanteenModeState(mode);
      toast.success(`Canteen is now ${mode.toLowerCase()}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to change mode");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      toast.success("Logged out successfully");
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Menu Management Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    price: "",
    isAvailable: true,
  });

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        name: menuForm.name,
        description: menuForm.description,
        price: parseFloat(menuForm.price),
        isAvailable: menuForm.isAvailable,
      };

      if (editingItem) {
        await updateItem(editingItem._id, itemData);
        toast.success("Item updated successfully");
      } else {
        await createItem(itemData);
        toast.success("Item created successfully");
      }

      setIsMenuModalOpen(false);
      setEditingItem(null);
      setMenuForm({ name: "", description: "", price: "", isAvailable: true });
      fetchMenuData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteItem(itemId);
      toast.success("Item deleted successfully");
      fetchMenuData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    }
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      isAvailable: item.isAvailable,
    });
    setIsMenuModalOpen(true);
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-800">
                Admin Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Canteen Mode Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Canteen:
                </span>
                <Badge
                  variant={
                    canteenMode === "ONLINE"
                      ? "default"
                      : canteenMode === "DRAINING"
                        ? "secondary"
                        : "destructive"
                  }
                  className={
                    canteenMode === "ONLINE"
                      ? "bg-green-500 hover:bg-green-600"
                      : canteenMode === "DRAINING"
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-red-500 hover:bg-red-600"
                  }
                >
                  {canteenMode === "ONLINE" && (
                    <Store className="h-3 w-3 mr-1" />
                  )}
                  {canteenMode === "DRAINING" && (
                    <Moon className="h-3 w-3 mr-1" />
                  )}
                  {canteenMode === "OFFLINE" && (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {canteenMode}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex bg-white rounded-xl shadow-sm p-1 mb-6">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "orders"
                ? "tab-gradient-active text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            Live Orders
          </button>
          <button
            onClick={() => setActiveTab("menu")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "menu"
                ? "tab-gradient-active text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Menu Management
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === "profile"
                ? "tab-gradient-active text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <User className="h-4 w-4" />
            Profile
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Canteen Mode Control */}
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Power className="h-5 w-5 text-gradient-primary" />
                  Canteen Mode Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleCanteenModeChange("ONLINE")}
                    disabled={isLoading || canteenMode === "ONLINE"}
                    className={`flex-1 ${
                      canteenMode === "ONLINE"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Online
                  </Button>
                  <Button
                    onClick={() => handleCanteenModeChange("DRAINING")}
                    disabled={isLoading || canteenMode === "DRAINING"}
                    className={`flex-1 ${
                      canteenMode === "DRAINING"
                        ? "bg-yellow-500 hover:bg-yellow-600"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Draining
                  </Button>
                  <Button
                    onClick={() => handleCanteenModeChange("OFFLINE")}
                    disabled={isLoading || canteenMode === "OFFLINE"}
                    className={`flex-1 ${
                      canteenMode === "OFFLINE"
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Offline
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order Filter Tabs */}
            <div className="flex bg-white rounded-xl shadow-sm p-1">
              <button
                onClick={() => setOrderFilter("IN QUEUE")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  orderFilter === "IN QUEUE"
                    ? "bg-orange-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                In Queue ({orders.filter((o) => o.status === "IN QUEUE").length}
                )
              </button>
              <button
                onClick={() => setOrderFilter("READY")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  orderFilter === "READY"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Ready ({orders.filter((o) => o.status === "READY").length})
              </button>
              <button
                onClick={() => setOrderFilter("DELIVERED")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  orderFilter === "DELIVERED"
                    ? "bg-green-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Check className="h-4 w-4 inline mr-2" />
                Delivered (
                {orders.filter((o) => o.status === "DELIVERED").length})
              </button>
              <button
                onClick={() => setOrderFilter("CANCELLED")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  orderFilter === "CANCELLED"
                    ? "bg-red-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <X className="h-4 w-4 inline mr-2" />
                Cancelled (
                {orders.filter((o) => o.status === "CANCELLED").length})
              </button>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">
                    No {orderFilter.toLowerCase()} orders
                  </p>
                  <p className="text-sm">
                    Orders will appear here when customers place them
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <Card
                    key={order._id}
                    className="border-none shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          #{order.token}
                        </CardTitle>
                        <Badge
                          variant={
                            order.status === "DELIVERED"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            order.status === "DELIVERED"
                              ? "bg-green-500"
                              : order.status === "IN QUEUE"
                                ? "bg-orange-500"
                                : order.status === "READY"
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-40 mb-4">
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2 rounded-lg ${
                                item.status === "CANCELLED"
                                  ? "bg-red-50"
                                  : item.status === "READY"
                                    ? "bg-green-50"
                                    : "bg-gray-50"
                              }`}
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {item.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={
                                    item.status === "CANCELLED"
                                      ? "border-red-500 text-red-600"
                                      : item.status === "READY"
                                        ? "border-green-500 text-green-600"
                                        : item.status === "IN QUEUE"
                                          ? "border-orange-500 text-orange-600"
                                          : "border-gray-500 text-gray-600"
                                  }
                                >
                                  {item.status}
                                </Badge>
                                {(orderFilter === "IN QUEUE" ||
                                  orderFilter === "READY") && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-orange-600 hover:bg-orange-100"
                                      onClick={() =>
                                        handleItemStatus(
                                          order._id,
                                          item.itemId,
                                          "IN QUEUE",
                                        )
                                      }
                                      disabled={item.status === "IN QUEUE"}
                                    >
                                      <Clock className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-green-600 hover:bg-green-100"
                                      onClick={() =>
                                        handleItemStatus(
                                          order._id,
                                          item.itemId,
                                          "READY",
                                        )
                                      }
                                      disabled={item.status === "READY"}
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 text-red-600 hover:bg-red-100"
                                      onClick={() =>
                                        handleItemStatus(
                                          order._id,
                                          item.itemId,
                                          "CANCELLED",
                                        )
                                      }
                                      disabled={item.status === "CANCELLED"}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <p className="font-bold text-lg">
                          ₹{order.totalAmount}
                        </p>
                        {(orderFilter === "IN QUEUE" ||
                          orderFilter === "READY") && (
                          <Button
                            onClick={() => handleCompleteOrder(order._id)}
                            className="btn-gradient-primary text-white"
                            size="sm"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Complete Order
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Menu Management Tab */}
        {activeTab === "menu" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Menu Items</h2>
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setMenuForm({
                    name: "",
                    description: "",
                    price: "",
                    isAvailable: true,
                  });
                  setIsMenuModalOpen(true);
                }}
                className="btn-gradient-primary text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <Card key={item._id} className="border-none shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {item.description}
                        </p>
                      </div>
                      <Badge
                        variant={item.isAvailable ? "default" : "secondary"}
                        className={
                          item.isAvailable ? "bg-green-500" : "bg-gray-400"
                        }
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-gradient-primary">
                        ₹{item.price}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteItem(item._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-gradient-primary" />
                  Admin Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-primary p-4 rounded-full">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{user?.username}</p>
                    <Badge variant="outline" className="mt-1">
                      {user?.role}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-gradient-primary">
                      {orders.length}
                    </p>
                    <p className="text-sm text-gray-600">Total Orders</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-3xl font-bold text-gradient-primary">
                      {menuItems.length}
                    </p>
                    <p className="text-sm text-gray-600">Menu Items</p>
                  </div>
                </div>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Menu Item Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingItem ? "Edit Item" : "Add New Item"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMenuSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={menuForm.name}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={menuForm.description}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={menuForm.price}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="available"
                    checked={menuForm.isAvailable}
                    onCheckedChange={(checked) =>
                      setMenuForm({ ...menuForm, isAvailable: checked })
                    }
                  />
                  <Label htmlFor="available">Available</Label>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsMenuModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 btn-gradient-primary text-white"
                  >
                    {editingItem ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
