import type { ProductCatalogItem } from "./types";

export const productCatalog: readonly ProductCatalogItem[] = [
  {
    toolId: "count",
    currency: "USD",
    priceCents: null,
    pricingMode: "pwyw",
    available: true,
    bundleIds: ["starter", "productivity"],
  },
  {
    toolId: "time",
    currency: "USD",
    priceCents: 200,
    pricingMode: "fixed",
    available: true,
    bundleIds: ["starter", "productivity"],
  },
  {
    toolId: "awake",
    currency: "USD",
    priceCents: null,
    pricingMode: "pwyw",
    available: true,
    bundleIds: ["starter", "system"],
  },
  {
    toolId: "rename",
    currency: "USD",
    priceCents: 400,
    pricingMode: "fixed",
    available: true,
    bundleIds: ["files"],
  },
];

export const getProduct = (toolId: string): ProductCatalogItem | undefined =>
  productCatalog.find((product) => product.toolId === toolId);
