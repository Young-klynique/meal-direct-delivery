import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Store,
  Settings,
  Users,
  Save,
} from "lucide-react";
import { toast } from "sonner";

const AdminPortal = () => {
  const { vendors, setVendors } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Settings state
  const [vendorAccessCode, setVendorAccessCode] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(false);

  // New vendor form
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorDescription, setNewVendorDescription] = useState("");
  const [newVendorId, setNewVendorId] = useState("");

  // Load admin password from DB
  useEffect(() => {
    const fetchAdminPassword = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "admin_password")
        .maybeSingle();
      if (data?.value) setAdminPassword(data.value);
    };
    fetchAdminPassword();
  }, []);

  // Load settings when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchSettings = async () => {
      setLoadingSettings(true);
      const { data } = await supabase
        .from("platform_settings")
        .select("*");
      if (data) {
        const accessCode = data.find((s) => s.key === "vendor_access_code");
        if (accessCode) setVendorAccessCode(accessCode.value);
      }
      setLoadingSettings(false);
    };
    fetchSettings();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect admin password.");
    }
  };

  const handleAddVendor = async () => {
    if (!newVendorName.trim() || !newVendorId.trim()) {
      toast.error("Please enter vendor name and ID");
      return;
    }

    const vendorIdSlug = newVendorId.trim().toLowerCase().replace(/\s+/g, "-");

    // Check if vendor_id already exists
    const existing = vendors.find((v) => v.id === vendorIdSlug);
    if (existing) {
      toast.error("A vendor with this ID already exists");
      return;
    }

    const { error } = await supabase.from("vendors").insert({
      vendor_id: vendorIdSlug,
      name: newVendorName.trim(),
      description: newVendorDescription.trim() || null,
      is_open: true,
      menu: [],
    });

    if (error) {
      toast.error("Failed to add vendor");
      console.error(error);
      return;
    }

    // Update local state
    setVendors((prev) => [
      ...prev,
      {
        id: vendorIdSlug,
        name: newVendorName.trim(),
        description: newVendorDescription.trim() || "",
        isOpen: true,
        menuItems: [],
      },
    ]);

    setNewVendorName("");
    setNewVendorDescription("");
    setNewVendorId("");
    toast.success("Vendor added successfully!");
  };

  const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
    if (!confirm(`Are you sure you want to remove "${vendorName}"? This cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("vendor_id", vendorId);

    if (error) {
      toast.error("Failed to delete vendor");
      console.error(error);
      return;
    }

    setVendors((prev) => prev.filter((v) => v.id !== vendorId));
    toast.success(`"${vendorName}" removed successfully`);
  };

  const handleSaveAccessCode = async () => {
    if (!vendorAccessCode.trim()) {
      toast.error("Access code cannot be empty");
      return;
    }

    const { error } = await supabase
      .from("platform_settings")
      .update({ value: vendorAccessCode.trim() })
      .eq("key", "vendor_access_code");

    if (error) {
      toast.error("Failed to update access code");
    } else {
      toast.success("Vendor access code updated!");
    }
  };

  const handleSaveAdminPassword = async () => {
    if (!newAdminPassword.trim() || newAdminPassword.trim().length < 4) {
      toast.error("Admin password must be at least 4 characters");
      return;
    }

    const { error } = await supabase
      .from("platform_settings")
      .update({ value: newAdminPassword.trim() })
      .eq("key", "admin_password");

    if (error) {
      toast.error("Failed to update admin password");
    } else {
      setAdminPassword(newAdminPassword.trim());
      setNewAdminPassword("");
      toast.success("Admin password updated!");
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
                <div className="h-16 w-16 rounded-2xl bg-destructive/10 mx-auto flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl">Admin Access</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Enter the admin password to manage the platform
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter admin password"
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
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" variant="destructive">
                    Access Admin Portal
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

        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Portal</h1>
              <p className="text-muted-foreground">Manage vendors and platform settings</p>
            </div>
          </div>

          <Tabs defaultValue="vendors" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="vendors">
                <Users className="h-4 w-4 mr-2" />
                Vendors
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Vendors Tab */}
            <TabsContent value="vendors" className="space-y-6">
              {/* Add New Vendor */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Vendor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Vendor Name</Label>
                      <Input
                        placeholder="e.g. Mama Akos Kitchen"
                        value={newVendorName}
                        onChange={(e) => setNewVendorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vendor ID (unique slug)</Label>
                      <Input
                        placeholder="e.g. mama-akos"
                        value={newVendorId}
                        onChange={(e) => setNewVendorId(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Used in URLs. Lowercase, no spaces.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      placeholder="Brief description of the vendor"
                      value={newVendorDescription}
                      onChange={(e) => setNewVendorDescription(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddVendor} variant="warm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                  </Button>
                </CardContent>
              </Card>

              {/* Current Vendors */}
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Current Vendors ({vendors.length})
                </h2>
                <div className="space-y-3">
                  {vendors.map((vendor) => (
                    <Card key={vendor.id} className="shadow-card">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl gradient-warm flex items-center justify-center flex-shrink-0">
                            <Store className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{vendor.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {vendor.id} · {vendor.menuItems.length} items
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={vendor.isOpen ? "default" : "secondary"}>
                            {vendor.isOpen ? "Open" : "Closed"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              {/* Vendor Access Code */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Vendor Access Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This is the password vendors use to access the Vendor Portal.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={vendorAccessCode}
                      onChange={(e) => setVendorAccessCode(e.target.value)}
                      placeholder="Enter vendor access code"
                      className="max-w-xs"
                    />
                    <Button onClick={handleSaveAccessCode}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Password */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Change Admin Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Update the admin password for this portal.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="Enter new admin password"
                      className="max-w-xs"
                    />
                    <Button onClick={handleSaveAdminPassword}>
                      <Save className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
