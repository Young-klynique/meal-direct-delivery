import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";

import { CartItem } from "@/types";

interface DBOrder {
  id: string;
  vendor_id: string;
  vendor_name: string;
  items: CartItem[];
  total: number;
  delivery_fee: number;
  customer_name: string;
  customer_phone: string;
  customer_location: string;
  status: string;
  created_at: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-accent text-accent-foreground";
    case "preparing":
      return "bg-primary text-primary-foreground";
    case "ready":
      return "bg-secondary text-secondary-foreground";
    case "delivered":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted";
  }
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const createdAt = new Date(order.created_at);

      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        if (createdAt < from) return false;
      }

      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (createdAt > to) return false;
      }

      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const fetchOrders = async (userId: string) => {
    setIsLoadingOrders(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customer orders:", error);
      setOrders([]);
    } else {
      setOrders((data || []) as unknown as DBOrder[]);
    }

    setIsLoadingOrders(false);
  };

  useEffect(() => {
    if (!user) return;

    fetchOrders(user.id);

    const channel = supabase
      .channel(`my-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as DBOrder, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === (payload.new as DBOrder).id ? (payload.new as DBOrder) : o)),
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== (payload.old as DBOrder).id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <header className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Orders</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => user && fetchOrders(user.id)}
              disabled={!user || isLoadingOrders}
            >
              {isLoadingOrders ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
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
        </header>

        {isLoadingOrders ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">Loading...</CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <section className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="shadow-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Order #{order.id.slice(-6).toUpperCase()}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()} • {order.vendor_name}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      <span className="capitalize">{order.status}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    {(order.items as any[]).map((item: any, idx: number) => {
                      const addOnsTotal = (item.selectedAddOns || []).reduce(
                        (sum: number, a: any) => sum + (a.price || 0),
                        0
                      );
                      const customTotal = (item.customItems || []).reduce(
                        (sum: number, c: any) => sum + (c.price || 0),
                        0
                      );
                      const unitPrice = (item.basePrice || 0) + addOnsTotal + customTotal;
                      const lineTotal = unitPrice * (item.quantity || 1);

                      return (
                        <div key={idx} className="text-sm">
                          <span className="font-medium">
                            {item.quantity}x {item.menuItemName}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {' '}• GH₵{unitPrice.toFixed(2)} each
                          </span>
                          {item.selectedAddOns?.length > 0 && (
                            <span className="text-muted-foreground">
                              {' '}• + {item.selectedAddOns.map((a: any) => `${a.name} (GH₵${a.price})`).join(', ')}
                            </span>
                          )}
                          {item.customItems?.length > 0 && (
                            <span className="text-muted-foreground">
                              {' '}• + {item.customItems.map((c: any) => `${c.name} (GH₵${c.price})`).join(', ')}
                            </span>
                          )}
                          <span className="float-right font-semibold">
                            GH₵{lineTotal.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="font-bold">Total: GH₵{Number(order.total).toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground">Delivery: GH₵{Number(order.delivery_fee).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};

export default MyOrders;
