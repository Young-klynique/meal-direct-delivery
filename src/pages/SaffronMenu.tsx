import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ShoppingCart,
  Plus,
  Minus,
  UtensilsCrossed,
  MapPin,
  Phone,
  User,
  LogIn,
  Truck,
  Store,
  Sparkles,
  ChefHat,
} from "lucide-react";
import { toast } from "sonner";
import { CartItem } from "@/types";

interface SaffronItem {
  id: string;
  name: string;
  basePrice: number;
  staffPrice?: number;
  description?: string;
  image?: string;
  addOns: { id: string; name: string; price: number }[];
}

type OrderType = "delivery" | "pickup";

const SAFFRON_DELIVERY_FEE = 5;

const SaffronMenu = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [menuItems, setMenuItems] = useState<SaffronItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(true);

  // Cart state (local to Saffron)
  const [cart, setCart] = useState<{ item: SaffronItem; quantity: number }[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  // Checkout state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setCustomerName(user.user_metadata?.full_name || "");
      setCustomerPhone(user.user_metadata?.phone || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("menu, is_open")
        .eq("vendor_id", "saffron")
        .maybeSingle();

      if (error) {
        console.error("Error fetching Saffron menu:", error);
      } else if (data) {
        setMenuItems(
          Array.isArray(data.menu) ? (data.menu as unknown as SaffronItem[]) : []
        );
        setVendorOpen(data.is_open ?? true);
      }
      setLoading(false);
    };
    fetchMenu();
  }, []);

  const getPrice = (item: SaffronItem) => {
    return isStaff && item.staffPrice ? item.staffPrice : item.basePrice;
  };

  const addToCart = (item: SaffronItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const cartTotal = cart.reduce(
    (sum, c) => sum + getPrice(c.item) * c.quantity,
    0
  );
  const appliedDeliveryFee = orderType === "delivery" ? SAFFRON_DELIVERY_FEE : 0;
  const orderTotal = cartTotal + appliedDeliveryFee;
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please sign in to place an order");
      navigate("/auth");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Please fill in your name and phone number");
      return;
    }
    if (orderType === "delivery" && !deliveryLocation.trim()) {
      toast.error("Please enter your delivery location");
      return;
    }

    setIsSubmitting(true);
    try {
      const locationText = orderType === "pickup" ? "PICKUP" : deliveryLocation.trim();
      const items = cart.map((c) => ({
        menuItemId: c.item.id,
        menuItemName: c.item.name,
        vendorId: "saffron",
        vendorName: "SAFFRON Restaurant",
        basePrice: getPrice(c.item),
        selectedAddOns: [],
        customItems: isStaff ? [{ name: "Staff Discount", price: 0 }] : [],
        quantity: c.quantity,
      }));

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          vendor_id: "saffron",
          vendor_name: "SAFFRON Restaurant",
          items: JSON.parse(JSON.stringify(items)),
          total: orderTotal,
          delivery_fee: appliedDeliveryFee,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          customer_location: locationText,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw new Error("Failed to place order");

      // Send SMS to Saffron vendor
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("phone")
        .eq("vendor_id", "saffron")
        .maybeSingle();

      if (vendorData?.phone) {
        const itemsSummary = cart
          .map((c) => `${c.quantity}x ${c.item.name}`)
          .join(", ");

        await supabase.functions.invoke("send-sms", {
          body: {
            vendorPhone: vendorData.phone,
            vendorName: "SAFFRON Restaurant",
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim(),
            orderItems: itemsSummary,
            total: orderTotal,
            location: locationText,
            orderType,
            orderId: orderData.id,
          },
        });
      }

      setCart([]);
      setShowCheckout(false);
      toast.success("Order placed successfully!");
      navigate("/order-success");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Saffron Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 shadow-md">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-amber-800">SAFFRON</h1>
              <p className="text-xs text-muted-foreground">Restaurant</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Staff Toggle */}
            <div className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 ${isStaff ? "text-amber-600" : "text-muted-foreground"}`} />
              <Label htmlFor="staff-toggle" className="text-sm cursor-pointer">
                Staff
              </Label>
              <Switch
                id="staff-toggle"
                checked={isStaff}
                onCheckedChange={setIsStaff}
              />
            </div>

            {/* Cart Button */}
            <Button
              variant="outline"
              size="sm"
              className="relative"
              onClick={() => setShowCheckout(!showCheckout)}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Cart</span>
              {cartCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-amber-600 border-0">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-700 to-amber-500">
        <div className="container py-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">SAFFRON Restaurant</h2>
          <p className="text-amber-100 text-lg">Premium dining • Fresh ingredients • Made with love</p>
          {isStaff && (
            <Badge className="mt-3 bg-white/20 text-white border-white/30 text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              Staff Discount Active
            </Badge>
          )}
          {!vendorOpen && (
            <Badge className="mt-3 bg-destructive text-destructive-foreground text-sm">
              Currently Closed
            </Badge>
          )}
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-6">Our Menu</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {menuItems.map((item) => {
                const price = getPrice(item);
                const inCart = cart.find((c) => c.item.id === item.id);

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 group"
                  >
                    {/* Food Image Placeholder */}
                    <div className="h-40 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center relative">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ChefHat className="h-16 w-16 text-amber-300" />
                      )}
                      {isStaff && item.staffPrice && (
                        <Badge className="absolute top-2 right-2 bg-amber-600 text-white text-xs">
                          Staff Price
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h4 className="font-semibold text-lg">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <span className="text-xl font-bold text-amber-700">
                            Ghs {price}
                          </span>
                          {isStaff && item.staffPrice && (
                            <span className="text-sm text-muted-foreground line-through ml-2">
                              Ghs {item.basePrice}
                            </span>
                          )}
                        </div>

                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center font-semibold">
                              {inCart.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => addToCart(item)}
                            disabled={!vendorOpen}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Checkout Sidebar */}
          <div className={`${showCheckout || cart.length > 0 ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-20 space-y-4">
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Your Order
                  </h3>

                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">
                      Your cart is empty. Add items from the menu!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((c) => (
                        <div
                          key={c.item.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{c.item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.quantity} × Ghs {getPrice(c.item)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              Ghs {(getPrice(c.item) * c.quantity).toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() =>
                                setCart((prev) =>
                                  prev.filter((x) => x.item.id !== c.item.id)
                                )
                              }
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Separator />

                      {/* Order Type */}
                      <RadioGroup
                        value={orderType}
                        onValueChange={(v) => setOrderType(v as OrderType)}
                        className="grid grid-cols-2 gap-2"
                      >
                        <Label
                          htmlFor="saffron-delivery"
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer text-center ${
                            orderType === "delivery"
                              ? "border-amber-600 bg-amber-50"
                              : "border-muted"
                          }`}
                        >
                          <RadioGroupItem value="delivery" id="saffron-delivery" className="sr-only" />
                          <Truck className={`h-4 w-4 ${orderType === "delivery" ? "text-amber-600" : "text-muted-foreground"}`} />
                          <span className="text-xs font-medium">Delivery</span>
                          <span className="text-xs text-muted-foreground">+Ghs {SAFFRON_DELIVERY_FEE}</span>
                        </Label>
                        <Label
                          htmlFor="saffron-pickup"
                          className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 cursor-pointer text-center ${
                            orderType === "pickup"
                              ? "border-amber-600 bg-amber-50"
                              : "border-muted"
                          }`}
                        >
                          <RadioGroupItem value="pickup" id="saffron-pickup" className="sr-only" />
                          <Store className={`h-4 w-4 ${orderType === "pickup" ? "text-amber-600" : "text-muted-foreground"}`} />
                          <span className="text-xs font-medium">Pickup</span>
                          <span className="text-xs text-muted-foreground">Free</span>
                        </Label>
                      </RadioGroup>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <User className="h-3 w-3" /> Name
                          </Label>
                          <Input
                            placeholder="Your name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Phone
                          </Label>
                          <Input
                            placeholder="e.g. 0551234567"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        {orderType === "delivery" && (
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Location
                            </Label>
                            <Input
                              placeholder="Delivery location"
                              value={deliveryLocation}
                              onChange={(e) => setDeliveryLocation(e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>Ghs {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {orderType === "delivery" ? "Delivery" : "Pickup"}
                          </span>
                          <span>
                            {orderType === "delivery"
                              ? `Ghs ${SAFFRON_DELIVERY_FEE.toFixed(2)}`
                              : "Free"}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span className="text-amber-700">
                            Ghs {orderTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {!authLoading && !user && (
                        <Link to="/auth">
                          <Button className="w-full" variant="outline" size="sm">
                            <LogIn className="h-4 w-4 mr-2" />
                            Sign in to order
                          </Button>
                        </Link>
                      )}

                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting || !user || cart.length === 0}
                      >
                        {isSubmitting
                          ? "Placing Order..."
                          : "Place Order • Cash on Delivery"}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        💳 Online payment coming soon
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cart FAB */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 lg:hidden z-40">
          <Button
            className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg h-14 text-base"
            onClick={() => setShowCheckout(true)}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Cart ({cartCount}) • Ghs {cartTotal.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SaffronMenu;
