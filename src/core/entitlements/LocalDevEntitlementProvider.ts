import type { EntitlementId, EntitlementService } from "./types";

// Not used by the app by default (see GumroadEntitlementProvider). Swap the app's
// `entitlementService` import for an instance of this class to force a Pro/free state
// during local development, e.g. `new LocalDevEntitlementProvider(new Set(["app.pro"]))`.
const defaultOwned = new Set<EntitlementId>([]);

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
