export type EntitlementId = `tool.${string}`;

export interface EntitlementService {
  has(entitlement: EntitlementId): Promise<boolean>;
  listOwned(): Promise<EntitlementId[]>;
  refresh(): Promise<void>;
}
