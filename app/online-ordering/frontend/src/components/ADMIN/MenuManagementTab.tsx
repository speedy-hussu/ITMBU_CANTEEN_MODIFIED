import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Calendar, UtensilsCrossed, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  fetchAdminItems,
  createItem,
  updateItem,
  deleteItem,
  fetchMenuTemplates,
  createMenuTemplate,
  updateMenuTemplate,
  deleteMenuTemplate,
} from "@/api/api";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  category?: string;
}

interface MenuTemplate {
  _id: string;
  name: string;
  dayOfWeek: string;
  mealType: string;
  items: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  isActive: boolean;
  description?: string;
}

export default function MenuManagementTab() {
  const [menuSubTab, setMenuSubTab] = useState<"items" | "templates">("items");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuTemplates, setMenuTemplates] = useState<MenuTemplate[]>([]);

  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: "",
    price: "",
    category: "Dish",
    isAvailable: true,
  });

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MenuTemplate | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [templateForm, setTemplateForm] = useState({
    name: "",
    dayOfWeek: "Monday",
    mealType: "Breakfast",
    description: "",
    selectedItems: [] as Array<{
      itemId: string;
      name: string;
      price: number;
      quantity: number;
      specialPrice?: number;
    }>,
  });

  const fetchMenuData = useCallback(async () => {
    try {
      const response = await fetchAdminItems();
      setMenuItems(response.items || []);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }
  }, []);

  const fetchMenuTemplatesData = useCallback(async () => {
    try {
      const response = await fetchMenuTemplates();
      setMenuTemplates(response.templates || []);
    } catch (error) {
      console.error("Failed to fetch menu templates:", error);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
    if (menuSubTab === "templates") {
      fetchMenuTemplatesData();
    }
  }, [menuSubTab, fetchMenuData, fetchMenuTemplatesData]);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const itemData = {
        ...menuForm,
        price: Number(menuForm.price),
      };

      if (editingItem) {
        await updateItem(editingItem._id, itemData);
        toast.success("Item updated successfully");
      } else {
        await createItem(itemData);
        toast.success("Item created successfully");
      }

      setIsItemModalOpen(false);
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

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (templateForm.selectedItems.length === 0) {
        toast.error("Please add at least one item to the template");
        return;
      }
      const templateData = {
        name: templateForm.name,
        dayOfWeek: templateForm.dayOfWeek,
        mealType: templateForm.mealType,
        description: templateForm.description,
        items: templateForm.selectedItems.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
      };

      if (editingTemplate) {
        await updateMenuTemplate(editingTemplate._id, templateData);
        toast.success("Menu template updated successfully");
      } else {
        await createMenuTemplate(templateData);
        toast.success("Menu template created successfully");
      }

      setIsTemplateModalOpen(false);
      fetchMenuTemplatesData();
    } catch (error: any) {
      toast.error(error.message || "Failed to save menu template");
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteMenuTemplate(templateId);
      toast.success("Menu template deleted successfully");
      fetchMenuTemplatesData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  const toggleItemSelection = (item: MenuItem) => {
    setTemplateForm((prev) => {
      const existing = prev.selectedItems.find((i) => i.itemId === item._id);
      if (existing) {
        return {
          ...prev,
          selectedItems: prev.selectedItems.filter((i) => i.itemId !== item._id),
        };
      }
      return {
        ...prev,
        selectedItems: [
          ...prev.selectedItems,
          { itemId: item._id, name: item.name, price: item.price, quantity: 1 },
        ],
      };
    });
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setTemplateForm((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.map((item) =>
        item.itemId === itemId ? { ...item, quantity: Math.max(1, quantity) } : item
      ),
    }));
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const mealTypes = ["Breakfast", "Lunch", "Snacks", "Dinner"];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              menuSubTab === "items" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setMenuSubTab("items")}
          >
            <UtensilsCrossed className="w-4 h-4 inline-block mr-2" />
            Menu Items
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              menuSubTab === "templates" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setMenuSubTab("templates")}
          >
            <Calendar className="w-4 h-4 inline-block mr-2" />
            Weekly Templates
          </button>
        </div>
      </div>

      {menuSubTab === "items" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">All Items</h3>
            <Button
              onClick={() => {
                setEditingItem(null);
                setMenuForm({ name: "", price: "", category: "Dish", isAvailable: true });
                setIsItemModalOpen(true);
              }}
              className="btn-gradient-primary text-white"
            >
              <Plus className="h-4 w-4 mr-2" /> Add New Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <Card key={item._id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-gray-500 font-medium">₹{item.price}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={item.isAvailable ? "default" : "secondary"} className={item.isAvailable ? "bg-green-500" : "bg-gray-400"}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </Badge>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setEditingItem(item);
                          setMenuForm({
                            name: item.name,
                            price: item.price.toString(),
                            category: item.category || "Dish",
                            isAvailable: item.isAvailable,
                          });
                          setIsItemModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
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

      {menuSubTab === "templates" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedDay === day ? "bg-orange-500 text-white shadow-md transform scale-105" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <Button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ name: "", dayOfWeek: selectedDay, mealType: "Breakfast", description: "", selectedItems: [] });
                setIsTemplateModalOpen(true);
              }}
              className="btn-gradient-primary text-white ml-4 flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" /> New Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {menuTemplates
              .filter((t) => t.dayOfWeek === selectedDay)
              .map((template) => (
                <Card key={template._id} className={`${template.isActive ? "border-l-4 border-l-green-500" : "opacity-75"} border border-gray-100 shadow-md`}>
                  <CardHeader className="bg-gray-50/50 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl font-bold">{template.name}</CardTitle>
                          <Badge variant="outline" className={template.isActive ? "border-green-500 text-green-600" : "border-gray-400 text-gray-500"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">{template.mealType}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setEditingTemplate(template);
                            setTemplateForm({
                              name: template.name,
                              dayOfWeek: template.dayOfWeek,
                              mealType: template.mealType,
                              description: template.description || "",
                              selectedItems: template.items.map((i) => ({
                                itemId: i.itemId,
                                name: i.name,
                                price: i.price,
                                quantity: i.quantity,
                              })),
                            });
                            setIsTemplateModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteTemplate(template._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {template.description && <p className="text-gray-500 text-sm mb-4 italic">{template.description}</p>}
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 border-b pb-1">Menu Items ({template.items.length})</h4>
                    <div className="space-y-2">
                      {template.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{item.name}</span>
                            <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">x{item.quantity}</span>
                          </div>
                          <span className="font-semibold">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t flex justify-between items-center">
                      <span className="font-semibold text-gray-600">Template Total</span>
                      <span className="font-bold text-lg text-orange-600">
                        ₹
                        {template.items.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-gray-50 rounded-t-xl border-b">
              <div className="flex items-center justify-between">
                <CardTitle>{editingItem ? "Edit Item" : "Create New Item"}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsItemModalOpen(false)}>
                  <Plus className="h-5 w-5 transform rotate-45 text-gray-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSaveItem} className="space-y-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input type="number" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} required min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label className="cursor-pointer">Available in Store</Label>
                  <Switch checked={menuForm.isAvailable} onCheckedChange={(c) => setMenuForm({ ...menuForm, isAvailable: c })} />
                </div>
                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 btn-gradient-primary text-white">Save Item</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-gray-50 rounded-t-xl border-b px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{editingTemplate ? "Edit Menu Template" : "Create Menu Template"}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsTemplateModalOpen(false)}>
                  <Plus className="h-5 w-5 transform rotate-45 text-gray-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-gray-100">
                <form id="templateForm" onSubmit={handleSaveTemplate} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Template Name</Label>
                    <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g., Special Thali" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Day of Week</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={templateForm.dayOfWeek} onChange={(e) => setTemplateForm({ ...templateForm, dayOfWeek: e.target.value })}>
                        {days.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Meal Type</Label>
                      <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={templateForm.mealType} onChange={(e) => setTemplateForm({ ...templateForm, mealType: e.target.value })}>
                        {mealTypes.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Input value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} placeholder="What's special about this menu?" />
                  </div>
                  <div className="pt-2">
                    <Label className="mb-2 block">Selected Items ({templateForm.selectedItems.length})</Label>
                    {templateForm.selectedItems.length === 0 ? (
                      <div className="text-sm text-gray-500 italic p-3 bg-gray-50 rounded-md border border-dashed">No items selected yet. Please select items from the right panel.</div>
                    ) : (
                      <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
                        {templateForm.selectedItems.map((item) => (
                          <div key={item.itemId} className="flex items-center justify-between bg-gray-50 p-2 rounded-md border border-gray-100">
                            <div className="flex-1 truncate pr-2">
                              <p className="text-sm font-medium truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">₹{item.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border rounded-md bg-white">
                                <button type="button" className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md transition-colors" onClick={() => updateItemQuantity(item.itemId, item.quantity - 1)}>-</button>
                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                <button type="button" className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md transition-colors" onClick={() => updateItemQuantity(item.itemId, item.quantity + 1)}>+</button>
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" 
                                onClick={() =>
                                  setTemplateForm((prev) => ({
                                    ...prev,
                                    selectedItems: prev.selectedItems.filter((i) => i.itemId !== item.itemId),
                                  }))
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="pt-3 border-t mt-3 flex justify-between items-center px-1">
                          <span className="font-bold text-sm">Total Value:</span>
                          <span className="font-bold text-orange-600">
                            ₹{templateForm.selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </form>
              </div>
              <div className="w-full md:w-1/2 p-0 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                  <h3 className="font-semibold text-gray-800">Available Menu Items</h3>
                  <p className="text-xs text-gray-500">Click to add/remove from template</p>
                </div>
                <ScrollArea className="flex-1 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {menuItems.filter((i) => i.isAvailable).map((item) => {
                      const isSelected = templateForm.selectedItems.some((i) => i.itemId === item._id);
                      return (
                        <div
                          key={item._id}
                          onClick={() => toggleItemSelection(item)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected ? "bg-orange-50 border-orange-200 shadow-sm" : "bg-white border-gray-200 hover:border-orange-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span className="font-medium text-sm line-clamp-1">{item.name}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-gray-300"}`}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1 block">₹{item.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <Button type="button" variant="outline" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
              <Button type="submit" form="templateForm" className="btn-gradient-primary text-white">Save Template</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
