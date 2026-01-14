import { ShoppingCart, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useApp } from "@/context/AppContext";
import { Badge } from "./ui/badge";

export const Header = () => {
  const { cart } = useApp();
  const itemCount = cart.length;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-warm shadow-md group-hover:shadow-lg transition-shadow">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">KLM Eats</h1>
            <p className="text-xs text-muted-foreground">Food Delivery</p>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          <Link to="/vendor-portal">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Vendor Portal
            </Button>
          </Link>
          <Link to="/cart">
            <Button variant="outline" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Cart</span>
              {itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs gradient-warm border-0">
                  {itemCount}
                </Badge>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};
