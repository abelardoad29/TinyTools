// Vercel Edge Function. Proxies Gumroad's license verification API server-side,
// because that API has no CORS support and can't be called directly from the browser.
// See src/core/entitlements/GumroadEntitlementProvider.ts for the client side.
//
// Requires one environment variable set in the Vercel project (Settings > Environment
// Variables): GUMROAD_PRODUCT_ID — the product id shown in the Gumroad product's API
// details (not the permalink — Gumroad requires product_id for products created on or
// after 2023-01-09). There is no product to point this at until "TinyTools Pro" exists
// on Gumroad (Fase C).

export const config = { runtime: "edge" };

type GumroadPurchase = {
  refunded?: boolean;
  chargebacked?: boolean;
  subscription_cancelled_at?: string | null;
  subscription_failed_at?: string | null;
};

type GumroadVerifyResponse = {
  success: boolean;
  message?: string;
  purchase?: GumroadPurchase;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const isPurchaseValid = (data: GumroadVerifyResponse): boolean => {
  if (!data.success) return false;
  const purchase = data.purchase;
  if (!purchase) return true;
  if (purchase.refunded || purchase.chargebacked) return false;
  if (purchase.subscription_cancelled_at || purchase.subscription_failed_at) return false;
  return true;
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") {
    return Response.json(
      { valid: false, error: "Method not allowed." },
      { status: 405, headers: corsHeaders },
    );
  }

  let licenseKey: string | undefined;
  try {
    const body = (await request.json()) as { licenseKey?: string };
    licenseKey = body.licenseKey?.trim();
  } catch {
    return Response.json(
      { valid: false, error: "Malformed request." },
      { status: 400, headers: corsHeaders },
    );
  }

  if (!licenseKey) {
    return Response.json(
      { valid: false, error: "Missing license key." },
      { status: 400, headers: corsHeaders },
    );
  }

  const params = new URLSearchParams({
    product_id: process.env.GUMROAD_PRODUCT_ID ?? "",
    license_key: licenseKey,
    increment_uses_count: "false",
  });

  try {
    const gumroadResponse = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = (await gumroadResponse.json()) as GumroadVerifyResponse;
    if (isPurchaseValid(data)) {
      return Response.json({ valid: true }, { headers: corsHeaders });
    }
    return Response.json(
      { valid: false, error: data.message ?? "That license key isn't valid." },
      { headers: corsHeaders },
    );
  } catch {
    return Response.json(
      { valid: false, error: "Couldn't reach Gumroad. Try again shortly." },
      { status: 502, headers: corsHeaders },
    );
  }
}
