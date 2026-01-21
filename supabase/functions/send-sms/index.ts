import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  vendorPhone?: string;
  vendorName?: string;
  customerName: string;
  customerPhone: string;
  orderItems?: string;
  total?: number;
  location?: string;
  orderType?: string;
  // For customer notifications
  type?: "vendor_order" | "customer_ready";
  orderId?: string;
}

const normalizeGhanaPhone = (raw: string) => {
  const digits = (raw || "").replace(/\D/g, "");

  // Common Ghana formats:
  // 0551234567 -> 233551234567
  // +233551234567 -> 233551234567
  // 233551234567 -> 233551234567
  if (digits.length === 10 && digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  if (digits.startsWith("233")) return digits;

  return digits;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("HUBTEL_CLIENT_ID")?.trim();
    const clientSecret = Deno.env.get("HUBTEL_CLIENT_SECRET")?.trim();
    const senderId = Deno.env.get("HUBTEL_SENDER_ID")?.trim();

    if (!clientId || !clientSecret || !senderId) {
      throw new Error("Hubtel credentials not configured");
    }

    const body: SMSRequest = await req.json();

    const {
      vendorPhone,
      vendorName,
      customerName,
      customerPhone,
      orderItems,
      total,
      location,
      orderType,
      type,
      orderId,
    } = body;

    let to: string;
    let message: string;

    if (type === "customer_ready") {
      // Customer notification when order is ready
      if (!customerPhone) {
        console.log("No customer phone provided, skipping SMS");
        return new Response(
          JSON.stringify({ success: true, message: "No customer phone, SMS skipped" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      to = normalizeGhanaPhone(customerPhone);
      const orderRef = orderId ? `#${orderId.slice(-6).toUpperCase()}` : "";
      message = `KLM Eats: Hi ${customerName}, your order ${orderRef} is ready for ${location === "PICKUP" ? "pickup" : "delivery"}! Thank you for ordering.`;
    } else {
      // Vendor notification (default)
      if (!vendorPhone) {
        console.log("No vendor phone provided, skipping SMS");
        return new Response(
          JSON.stringify({ success: true, message: "No vendor phone, SMS skipped" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      to = normalizeGhanaPhone(vendorPhone);

      // Format the message with Ghs instead of GH₵
      const orderTypeText = orderType === "pickup" ? " [PICKUP]" : "";
      const orderRef = orderId ? `Order #${orderId.slice(-6).toUpperCase()}\n` : "";
      message = `KLM Eats Order!${orderTypeText}\n${orderRef}${customerName} (${customerPhone})\nItems: ${orderItems}\nTotal: Ghs ${total?.toFixed(2) || "0.00"}\nLocation: ${location}`;
    }

    if (!to || to.length < 10) {
      throw new Error(`Invalid phone number: ${to}`);
    }

    // Hubtel SMS API using query parameters (as per provided URL format)
    console.log("Sending SMS", {
      type: type || "vendor_order",
      to,
      from: senderId,
      messagePreview: message.slice(0, 80),
    });

    const params = new URLSearchParams({
      clientsecret: clientSecret,
      clientid: clientId,
      from: senderId,
      to: to,
      content: message,
    });

    const response = await fetch(`https://smsc.hubtel.com/v1/messages/send?${params.toString()}`, {
      method: "GET",
    });

    const result = await response.json();
    console.log("Hubtel SMS response:", result);

    if (!response.ok) {
      // IMPORTANT: Don't throw / return 500 for downstream API auth failures.
      // Returning 200 avoids client-side hard failures while still reporting the problem.
      return new Response(
        JSON.stringify({
          success: false,
          error: "Hubtel API error",
          hubtel: result,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Unknown error",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
