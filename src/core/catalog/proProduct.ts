export type ProProduct = {
  name: string;
  pricingMode: "pwyw";
  currency: "USD";
  /** Minimum and pre-filled amounts configured on the Gumroad product. */
  minPriceCents: number;
  suggestedPriceCents: number;
  /** The public Gumroad product page. Empty until the listing is live. */
  purchaseUrl: string;
};

export const proProduct: ProProduct = {
  name: "TinyTools Pro",
  pricingMode: "pwyw",
  currency: "USD",
  minPriceCents: 300,
  suggestedPriceCents: 500,
  purchaseUrl: "https://lumberjack37.gumroad.com/l/tinytools",
};

export const formatUsd = (cents: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
