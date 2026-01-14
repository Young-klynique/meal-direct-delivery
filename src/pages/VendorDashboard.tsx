import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useApp } from "@/context/AppContext";
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
  User
} from "lucide-react";
import { toast } from "sonner";
import { MenuItem, AddOn, Order } from "@/types";

const VendorDashboard = () => {
  const { vendorId } = useParams();
  const { vendors, setVendors, orders, updateOrderStatus } = useApp();

  const vendor = vendors.find((v) => v.id === vendorId);
  const vendorOrders = orders.filter((o) => o.vendorId === vendorId);

  // New item form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newAddOnName, setNewAddOnName] = useState("");
  const [newAddOnPrice, setNewAddOnPrice] = useState("");
  const [tempAddOns, setTempAddOns] = useState<AddOn[]>([]);

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

  const toggleVendorOpen = () => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId ? { ...v, isOpen: !v.isOpen } : v
      )
    );
    toast.success(vendor.isOpen ? "Vendor marked as closed" : "Vendor marked as open");
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

  const addMenuItem = () => {
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

    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? { ...v, menuItems: [...v.menuItems, newItem] }
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

  const deleteMenuItem = (itemId: string) => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? { ...v, menuItems: v.menuItems.filter((item) => item.id !== itemId) }
          : v
      )
    );
    toast.success("Menu item deleted");
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-accent text-accent-foreground';
      case 'preparing': return 'bg-primary text-primary-foreground';
      case 'ready': return 'bg-secondary text-secondary-foreground';
      case 'delivered': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'preparing': return <Package className="h-4 w-4" />;
      case 'ready': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
    }
  };

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
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu Management</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <h2 className="text-xl font-semibold">
              Incoming Orders ({vendorOrders.filter(o => o.status !== 'delivered').length})
            </h2>
            
            {vendorOrders.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {vendorOrders.map((order) => (
                  <Card key={order.id} className="shadow-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Order #{order.id.slice(-6).toUpperCase()}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString()}
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
                          <span>{order.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{order.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{order.deliveryLocation}</span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <div>
                              <span className="font-medium">{item.quantity}x {item.menuItemName}</span>
                              {item.selectedAddOns.length > 0 && (
                                <p className="text-muted-foreground text-xs">
                                  + {item.selectedAddOns.map(a => a.name).join(', ')}
                                </p>
                              )}
                              {item.customItems.length > 0 && (
                                <p className="text-muted-foreground text-xs">
                                  + {item.customItems.map(c => c.name).join(', ')}
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
                                variant="success"
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
        </Tabs>
      </div>
    </div>
  );
};

export default VendorDashboard;
