export type EntitlementId = `tool.${string}` | "app.pro";

export interface EntitlementService {
  has(entitlement: EntitlementId): Promise<boolean>;
  listOwned(): Promise<EntitlementId[]>;
  refresh(): Promise<void>;
}
