export type PricingMode = "fixed" | "free" | "pwyw";

export type ProductCatalogItem = {
  toolId: string;
  currency: "USD";
  priceCents: number | null;
  pricingMode: PricingMode;
  purchaseUrl?: string;
  available: boolean;
  bundleIds: string[];
};
