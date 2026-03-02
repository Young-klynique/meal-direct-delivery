import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, Share, MoreVertical, CheckCircle } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-lg py-12 space-y-8">
        <div className="text-center space-y-3">
          <img src="/pwa-192.png" alt="KLM Eats" className="w-20 h-20 mx-auto rounded-2xl shadow-lg" />
          <h1 className="text-2xl font-bold">Install KLM Eats</h1>
          <p className="text-muted-foreground">
            Add KLM Eats to your home screen for quick access — no app store needed!
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-secondary bg-secondary/10">
            <CardContent className="py-8 text-center space-y-3">
              <CheckCircle className="h-12 w-12 mx-auto text-secondary-foreground" />
              <h2 className="text-lg font-semibold">Already Installed!</h2>
              <p className="text-sm text-muted-foreground">
                KLM Eats is on your home screen. Open it from there for the best experience.
              </p>
            </CardContent>
          </Card>
        ) : deferredPrompt ? (
          <Card className="shadow-card">
            <CardContent className="py-8 text-center space-y-4">
              <Download className="h-12 w-12 mx-auto text-primary" />
              <h2 className="text-lg font-semibold">Ready to Install</h2>
              <p className="text-sm text-muted-foreground">
                Tap the button below to add KLM Eats to your home screen.
              </p>
              <Button variant="warm" size="lg" onClick={handleInstall} className="w-full">
                <Download className="h-5 w-5 mr-2" />
                Install KLM Eats
              </Button>
            </CardContent>
          </Card>
        ) : isIOS ? (
          <Card className="shadow-card">
            <CardContent className="py-6 space-y-6">
              <h2 className="text-lg font-semibold text-center">How to install on iPhone</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <p className="font-medium">Tap the Share button</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Tap <Share className="h-4 w-4 inline" /> at the bottom of Safari
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <p className="font-medium">Scroll down and tap "Add to Home Screen"</p>
                    <p className="text-sm text-muted-foreground">You may need to scroll the menu to find it</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <p className="font-medium">Tap "Add"</p>
                    <p className="text-sm text-muted-foreground">KLM Eats will appear on your home screen!</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card">
            <CardContent className="py-6 space-y-6">
              <h2 className="text-lg font-semibold text-center">How to install on Android</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <p className="font-medium">Tap the menu button</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      Tap <MoreVertical className="h-4 w-4 inline" /> in Chrome's top-right corner
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <p className="font-medium">Tap "Add to Home screen"</p>
                    <p className="text-sm text-muted-foreground">Or "Install app" if you see that option</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <p className="font-medium">Tap "Add"</p>
                    <p className="text-sm text-muted-foreground">KLM Eats will appear on your home screen!</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center space-y-2">
          <Smartphone className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            Works offline • Fast loading • No app store needed
          </p>
        </div>
      </div>
    </div>
  );
};

export default Install;
