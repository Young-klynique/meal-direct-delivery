import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Trash2, ShoppingBag, MapPin, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { Order } from "@/types";

const Cart = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart, addOrder, deliveryFee } = useApp();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateItemTotal = (item: typeof cart[0]) => {
    const addOnsTotal = item.selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);
    const customTotal = item.customItems.reduce((sum, custom) => sum + custom.price, 0);
    return (item.basePrice + addOnsTotal + customTotal) * item.quantity;
  };

  const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const total = subtotal + deliveryFee;

  // Group cart items by vendor
  const groupedItems = cart.reduce((acc, item, index) => {
    const existing = acc.find((g) => g.vendorId === item.vendorId);
    if (existing) {
      existing.items.push({ ...item, originalIndex: index });
    } else {
      acc.push({
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        items: [{ ...item, originalIndex: index }],
      });
    }
    return acc;
  }, [] as { vendorId: string; vendorName: string; items: (typeof cart[0] & { originalIndex: number })[] }[]);

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !deliveryLocation.trim()) {
      toast.error("Please fill in all delivery details");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    // Create orders for each vendor
    groupedItems.forEach((group) => {
      const groupSubtotal = group.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
      const order: Order = {
        id: `order-${Date.now()}-${group.vendorId}`,
        vendorId: group.vendorId,
        vendorName: group.vendorName,
        items: group.items,
        customerName,
        customerPhone,
        deliveryLocation,
        subtotal: groupSubtotal,
        deliveryFee,
        total: groupSubtotal + deliveryFee,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      addOrder(order);
    });

    clearCart();
    toast.success("Order placed successfully! Pay on delivery.");
    navigate("/order-success");
    setIsSubmitting(false);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <ShoppingBag className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some delicious food from our vendors!
          </p>
          <Link to="/">
            <Button variant="warm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Browse Vendors
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl font-bold">Your Cart ({cart.length} items)</h1>

            {groupedItems.map((group) => (
              <Card key={group.vendorId} className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{group.vendorName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.originalIndex} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{item.menuItemName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × GH₵{item.basePrice}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(item.originalIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {item.selectedAddOns.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Add-ons:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.selectedAddOns.map((addon) => (
                                <span
                                  key={addon.id}
                                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                                >
                                  {addon.name} (+GH₵{addon.price})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.customItems.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Special requests:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.customItems.map((custom, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded"
                                >
                                  {custom.name} (+GH₵{custom.price})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="mt-3 font-semibold text-primary">
                          GH₵{calculateItemTotal(item).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary & Delivery Details */}
          <div className="space-y-6">
            {/* Delivery Details */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="e.g. 0551234567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g. Building A, Floor 2, Desk 15"
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>GH₵{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>GH₵{deliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">GH₵{total.toFixed(2)}</span>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    className="w-full"
                    variant="warm"
                    size="lg"
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Placing Order..." : "Place Order"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    💵 Pay on delivery
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
