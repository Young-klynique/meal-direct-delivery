import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle, 
  Package,
  Truck,
  MapPin,
  Phone,
  User,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { MenuItem, AddOn } from "@/types";

interface DBOrder {
  id: string;
  vendor_id: string;
  vendor_name: string;
  items: any;
  total: number;
  delivery_fee: number;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  status: string;
  created_at: string;
}

const VendorDashboard = () => {
  const { vendorId } = useParams();
  const { vendors, setVendors } = useApp();
  const [dbOrders, setDbOrders] = useState<DBOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const vendor = vendors.find((v) => v.id === vendorId);

  // New item form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newAddOnName, setNewAddOnName] = useState("");
  const [newAddOnPrice, setNewAddOnPrice] = useState("");
  const [tempAddOns, setTempAddOns] = useState<AddOn[]>([]);
  const [vendorPhone, setVendorPhone] = useState("");

  // Orders filtering
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "delivered">("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Load vendor phone from database
  useEffect(() => {
    if (!vendorId) return;
    
    const fetchVendorPhone = async () => {
      const { data } = await supabase
        .from("vendors")
        .select("phone")
        .eq("vendor_id", vendorId)
        .maybeSingle();
      
      if (data?.phone) {
        setVendorPhone(data.phone);
      }
    };
    
    fetchVendorPhone();
  }, [vendorId]);

  // Fetch orders from database
  useEffect(() => {
    if (!vendorId) return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        setDbOrders(data || []);
      }
      setLoading(false);
    };

    fetchOrders();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`orders-${vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `vendor_id=eq.${vendorId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDbOrders((prev) => [payload.new as DBOrder, ...prev]);
            toast.success("New order received!", {
              description: `Order from ${(payload.new as DBOrder).customer_name}`,
            });
          } else if (payload.eventType === "UPDATE") {
            setDbOrders((prev) =>
              prev.map((order) =>
                order.id === (payload.new as DBOrder).id
                  ? (payload.new as DBOrder)
                  : order
              )
            );
          } else if (payload.eventType === "DELETE") {
            setDbOrders((prev) =>
              prev.filter((order) => order.id !== (payload.old as DBOrder).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
      console.error(error);
      return;
    }

    toast.success(`Order marked as ${status}`);

    // Send SMS to customer when order is ready
    if (status === "ready") {
      const order = dbOrders.find((o) => o.id === orderId);
      if (order?.customer_phone) {
        try {
          const { data, error: smsError } = await supabase.functions.invoke("send-sms", {
            body: {
              type: "customer_ready",
              customerName: order.customer_name,
              customerPhone: order.customer_phone,
              orderId: orderId,
              location: order.customer_location,
            },
          });

          const smsFailed =
            !!smsError || (data && typeof data === "object" && "success" in data && (data as any).success === false);

          if (smsFailed) {
            console.warn("Customer SMS notification failed:", { smsError, data });
          } else {
            toast.success("Customer notified via SMS");
          }
        } catch (err) {
          console.warn("Failed to send customer SMS:", err);
        }
      }
    }
  };

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Vendor not found</h1>
          <Link to="/vendor-portal">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendor Portal
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const toggleVendorOpen = async () => {
    const newIsOpen = !vendor.isOpen;
    
    // Update in database
    const { error } = await supabase
      .from("vendors")
      .update({ is_open: newIsOpen })
      .eq("vendor_id", vendorId);

    if (error) {
      toast.error("Failed to update vendor status");
      console.error(error);
      return;
    }

    // Update local state
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId ? { ...v, isOpen: newIsOpen } : v
      )
    );
    toast.success(newIsOpen ? "Vendor marked as open" : "Vendor marked as closed");
  };

  const addTempAddOn = () => {
    if (newAddOnName && newAddOnPrice) {
      setTempAddOns((prev) => [
        ...prev,
        { id: `temp-${Date.now()}`, name: newAddOnName, price: parseFloat(newAddOnPrice) || 0 },
      ]);
      setNewAddOnName("");
      setNewAddOnPrice("");
    }
  };

  const removeTempAddOn = (id: string) => {
    setTempAddOns((prev) => prev.filter((a) => a.id !== id));
  };

  const addMenuItem = async () => {
    if (!newItemName || !newItemPrice) {
      toast.error("Please enter item name and price");
      return;
    }

    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: newItemName,
      basePrice: parseFloat(newItemPrice) || 0,
      description: newItemDescription,
      addOns: tempAddOns.map((a, i) => ({ ...a, id: `addon-${Date.now()}-${i}` })),
    };

    const updatedMenu = [...vendor.menuItems, newItem];

    // Update in database
    const { error } = await supabase
      .from("vendors")
      .update({ menu: JSON.parse(JSON.stringify(updatedMenu)) })
      .eq("vendor_id", vendorId);

    if (error) {
      toast.error("Failed to add menu item");
      console.error(error);
      return;
    }

    // Update local state
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? { ...v, menuItems: updatedMenu }
          : v
      )
    );

    // Reset form
    setNewItemName("");
    setNewItemPrice("");
    setNewItemDescription("");
    setTempAddOns([]);
    toast.success("Menu item added!");
  };

  const deleteMenuItem = async (itemId: string) => {
    const updatedMenu = vendor.menuItems.filter((item) => item.id !== itemId);

    // Update in database
    const { error } = await supabase
      .from("vendors")
      .update({ menu: JSON.parse(JSON.stringify(updatedMenu)) })
      .eq("vendor_id", vendorId);

    if (error) {
      toast.error("Failed to delete menu item");
      console.error(error);
      return;
    }

    // Update local state
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? { ...v, menuItems: updatedMenu }
          : v
      )
    );
    toast.success("Menu item deleted");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-accent text-accent-foreground';
      case 'preparing': return 'bg-primary text-primary-foreground';
      case 'ready': return 'bg-secondary text-secondary-foreground';
      case 'delivered': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'ready': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = dbOrders.filter((order) => {
    if (statusFilter === "active" && order.status === "delivered") return false;
    if (statusFilter === "delivered" && order.status !== "delivered") return false;

    const createdAt = new Date(order.created_at);

    if (dateFrom) {
      const from = new Date(dateFrom);
      // include entire day
      from.setHours(0, 0, 0, 0);
      if (createdAt < from) return false;
    }

    if (dateTo) {
      const to = new Date(dateTo);
      // include entire day
      to.setHours(23, 59, 59, 999);
      if (createdAt > to) return false;
    }

    return true;
  });

  const activeCount = dbOrders.filter((o) => o.status !== "delivered").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <Link to="/vendor-portal">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendor Portal
          </Button>
        </Link>

        {/* Vendor Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{vendor.name}</h1>
            <p className="text-muted-foreground">{vendor.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="open-toggle" className="text-sm">
              {vendor.isOpen ? "Open" : "Closed"}
            </Label>
            <Switch
              id="open-toggle"
              checked={vendor.isOpen}
              onCheckedChange={toggleVendorOpen}
            />
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Orders</h2>
                {loading && (
                  <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={statusFilter === "all" ? "default" : "outline"}
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({dbOrders.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === "active" ? "default" : "outline"}
                    onClick={() => setStatusFilter("active")}
                  >
                    Active ({activeCount})
                  </Button>
                  <Button
                    size="sm"
                    variant={statusFilter === "delivered" ? "default" : "outline"}
                    onClick={() => setStatusFilter("delivered")}
                  >
                    Delivered ({dbOrders.filter((o) => o.status === "delivered").length})
                  </Button>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">From</Label>
                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">To</Label>
                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  </div>

                  {(dateFrom || dateTo) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                    >
                      Clear dates
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {filteredOrders.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {loading ? "Loading orders..." : "No orders match your filters"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="shadow-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Order #{order.id.slice(-6).toUpperCase()}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Customer Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{order.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${order.customer_phone}`} className="text-primary hover:underline">
                            {order.customer_phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{order.customer_location}</span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2">
                        {(order.items as any[]).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <div>
                              <span className="font-medium">{item.quantity}x {item.menuItemName}</span>
                              {item.selectedAddOns?.length > 0 && (
                                <p className="text-muted-foreground text-xs">
                                  + {item.selectedAddOns.map((a: any) => a.name).join(', ')}
                                </p>
                              )}
                              {item.customItems?.length > 0 && (
                                <p className="text-muted-foreground text-xs">
                                  + {item.customItems.map((c: any) => c.name).join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="font-bold">Total: GH₵{order.total.toFixed(2)}</span>
                        
                        {order.status !== 'delivered' && (
                          <div className="flex gap-2">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                              >
                                Start Preparing
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                              >
                                Mark Ready
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                              >
                                Mark Delivered
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Menu Management Tab */}
          <TabsContent value="menu" className="space-y-6">
            {/* Add New Item */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Add New Menu Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input
                      placeholder="e.g. Jollof Rice"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base Price (GH₵)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 15"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="Brief description of the item"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                  />
                </div>

                {/* Add-ons */}
                <div className="space-y-3">
                  <Label>Add-ons</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add-on name"
                      value={newAddOnName}
                      onChange={(e) => setNewAddOnName(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={newAddOnPrice}
                      onChange={(e) => setNewAddOnPrice(e.target.value)}
                      className="w-24"
                    />
                    <Button type="button" variant="outline" onClick={addTempAddOn}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tempAddOns.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tempAddOns.map((addon) => (
                        <Badge
                          key={addon.id}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {addon.name} (GH₵{addon.price})
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1"
                            onClick={() => removeTempAddOn(addon.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={addMenuItem} variant="warm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Menu Item
                </Button>
              </CardContent>
            </Card>

            {/* Current Menu Items */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Current Menu ({vendor.menuItems.length} items)
              </h2>
              {vendor.menuItems.length === 0 ? (
                <Card className="shadow-card">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No menu items yet. Add your first item above!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {vendor.menuItems.map((item) => (
                    <Card key={item.id} className="shadow-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold">{item.name}</h3>
                              <Badge variant="outline">GH₵{item.basePrice}</Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                            {item.addOns.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.addOns.map((addon) => (
                                  <Badge key={addon.id} variant="secondary" className="text-xs">
                                    {addon.name} (+GH₵{addon.price})
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deleteMenuItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">SMS Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter your phone number to receive SMS notifications when new orders come in.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    placeholder="e.g. 0201234567"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={async () => {
                      const { error } = await supabase
                        .from("vendors")
                        .update({ phone: vendorPhone.trim() })
                        .eq("vendor_id", vendorId);

                      if (error) {
                        toast.error("Failed to save phone number");
                      } else {
                        toast.success("Phone number saved! You'll receive SMS for new orders.");
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!vendorPhone.trim()) {
                        toast.error("Please enter a phone number first");
                        return;
                      }

                      const { data, error } = await supabase.functions.invoke("send-sms", {
                        body: {
                          vendorPhone: vendorPhone.trim(),
                          vendorName: vendor.name,
                          customerName: "Test Customer",
                          customerPhone: "0000000000",
                          orderItems: "1x Test Order",
                          total: 1,
                          location: "Test Location",
                        },
                      });

                      const failed =
                        !!error || (data && typeof data === "object" && "success" in data && (data as any).success === false);

                      if (failed) {
                        const details =
                          error?.message || (data as any)?.hubtel?.statusDescription || (data as any)?.error || "Unknown error";

                        toast.error("Test SMS failed", {
                          description: details,
                        });
                        console.error("Test SMS error:", error);
                        console.error("Test SMS response:", data);
                      } else {
                        toast.success("Test SMS request sent", {
                          description: "If your Hubtel account is correct, you should receive it shortly.",
                        });
                      }
                    }}
                  >
                    Send Test SMS
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: Ghana phone number (e.g., 0201234567)
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorDashboard;
