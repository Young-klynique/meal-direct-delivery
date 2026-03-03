import { ShoppingCart, Store, User, LogOut, QrCode, ListOrdered, Shield, Download, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const Header = () => {
  const { cart } = useApp();
  const { user, loading, signOut } = useAuth();
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

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link to="/qr-code" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <QrCode className="h-4 w-4" />
              <span className="hidden md:inline ml-2">QR Code</span>
            </Button>
          </Link>
          <Link to="/vendor-portal">
            <Button variant="ghost" size="sm" className="text-muted-foreground px-2 sm:px-3">
              <Store className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">Vendor Portal</span>
            </Button>
          </Link>
          <Link to="/admin" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline ml-1">Admin</span>
            </Button>
          </Link>

          {/* Mobile overflow menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="sm" className="text-muted-foreground px-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/qr-code" className="flex items-center">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/install" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Install App
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {!loading && (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2 max-w-[100px] truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="flex items-center">
                      <ListOrdered className="h-4 w-4 mr-2" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Sign In</span>
                </Button>
              </Link>
            )
          )}

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
