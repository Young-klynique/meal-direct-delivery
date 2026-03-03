import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useOrderNotifications = () => {
  const { user } = useAuth();
  const permissionGranted = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      permissionGranted.current = true;
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        permissionGranted.current = perm === "granted";
      });
    }
  }, []);

  // Listen to order status changes for the logged-in user
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-order-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const order = payload.new as any;
          const oldOrder = payload.old as any;

          // Only notify on status changes
          if (order.status === oldOrder.status) return;

          const statusMessages: Record<string, string> = {
            preparing: "Your order is being prepared! 🍳",
            ready: "Your order is ready for pickup! ✅",
            delivered: "Your order has been delivered! 🎉",
          };

          const message = statusMessages[order.status];
          if (!message) return;

          // Show browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            const notif = new Notification("KLM Eats", {
              body: `${message}\nOrder #${order.id.slice(-6).toUpperCase()} from ${order.vendor_name}`,
              icon: "/pwa-192.png",
              tag: `order-${order.id}-${order.status}`,
            });

            notif.onclick = () => {
              window.focus();
              window.location.href = "/orders";
            };
          }

          // Update app badge count (pending/preparing/ready orders)
          updateBadgeCount(user.id);
        }
      )
      .subscribe();

    // Set initial badge count
    updateBadgeCount(user.id);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};

async function updateBadgeCount(userId: string) {
  if (!("setAppBadge" in navigator)) return;

  try {
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["pending", "preparing", "ready"]);

    if (count && count > 0) {
      (navigator as any).setAppBadge(count);
    } else {
      (navigator as any).clearAppBadge();
    }
  } catch {
    // Badge API not supported or query failed
  }
}
