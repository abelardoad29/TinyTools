export type ProProduct = {
  name: string;
  pricingMode: "pwyw";
  currency: "USD";
  /** Set once the "TinyTools Pro" product exists on Gumroad (see Fase C in HERRAMIENTAS_PENDIENTES.md). */
  purchaseUrl: string;
};

export const proProduct: ProProduct = {
  name: "TinyTools Pro",
  pricingMode: "pwyw",
  currency: "USD",
  purchaseUrl: "",
};
