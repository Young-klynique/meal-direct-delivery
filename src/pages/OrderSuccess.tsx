import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, ArrowLeft, Truck, ListOrdered } from "lucide-react";

const OrderSuccess = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-16">
        <Card className="max-w-md mx-auto shadow-elevated animate-scale-in">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="h-20 w-20 rounded-full gradient-warm mx-auto flex items-center justify-center mb-6 animate-bounce-subtle">
              <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Order Placed!</h1>
            <p className="text-muted-foreground mb-6">
              Your order has been sent to the vendor(s). They will prepare your food and it will be delivered soon!
            </p>

            <div className="bg-muted rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Truck className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Payment on Delivery</p>
                  <p className="text-muted-foreground">
                    Please have cash ready when your order arrives
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {user && (
                <Link to="/orders">
                  <Button variant="outline" size="lg" className="w-full">
                    <ListOrdered className="h-4 w-4 mr-2" />
                    View My Orders
                  </Button>
                </Link>
              )}

              <Link to="/">
                <Button variant="warm" size="lg" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderSuccess;
