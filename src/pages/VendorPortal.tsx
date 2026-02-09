import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Store, ChevronRight, Lock, Eye, EyeOff } from "lucide-react";

const VendorPortal = () => {
  const { vendors } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [accessCode, setAccessCode] = useState("");

  // Load vendor access code from database
  useEffect(() => {
    const fetchAccessCode = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "vendor_access_code")
        .maybeSingle();
      if (data?.value) setAccessCode(data.value);
    };
    fetchAccessCode();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === accessCode) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container py-8">
          <Link to="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>

          <div className="max-w-md mx-auto">
            <Card className="shadow-elevated">
              <CardHeader className="text-center">
                <div className="h-16 w-16 rounded-2xl gradient-warm mx-auto flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Vendor Access</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Enter the vendor password to access the portal
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter vendor password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  
                  <Button type="submit" className="w-full" variant="warm">
                    Access Portal
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
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
            Back to Home
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl gradient-warm mx-auto flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Vendor Portal</h1>
            <p className="text-muted-foreground mt-2">
              Select your vendor profile to manage orders and menu
            </p>
          </div>

          <div className="space-y-3">
            {vendors.map((vendor) => (
              <Link key={vendor.id} to={`/vendor-portal/${vendor.id}`}>
                <Card className="hover:shadow-elevated transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl gradient-warm flex items-center justify-center flex-shrink-0">
                        <Store className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {vendor.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vendor.menuItems.length} menu items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={vendor.isOpen ? "default" : "secondary"}>
                        {vendor.isOpen ? "Open" : "Closed"}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPortal;
