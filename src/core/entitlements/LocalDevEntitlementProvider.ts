import type { EntitlementId, EntitlementService } from "./types";

// Edit this set to exercise owned/locked states during local development.
const defaultOwned = new Set<EntitlementId>(["tool.count", "tool.time"]);

export class LocalDevEntitlementProvider implements EntitlementService {
  constructor(private readonly owned: Set<EntitlementId> = defaultOwned) {}

  async has(entitlement: EntitlementId): Promise<boolean> {
    return Promise.resolve(this.owned.has(entitlement));
  }

  async listOwned(): Promise<EntitlementId[]> {
    return Promise.resolve([...this.owned]);
  }

  async refresh(): Promise<void> {
    return Promise.resolve();
  }
}

export const entitlementService: EntitlementService = new LocalDevEntitlementProvider();
