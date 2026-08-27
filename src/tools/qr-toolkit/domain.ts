export type QrToolMode = "qr" | "wifi" | "barcode" | "batch";

export type ErrorLevel = "L" | "M" | "Q" | "H";

export type WifiEncryption = "WPA" | "WEP" | "nopass";

const escapeWifiField = (value: string): string => value.replace(/([\\;,:"])/g, "\\$1");

export const buildWifiQrPayload = (params: {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}): string => {
  const { ssid, password, encryption, hidden } = params;
  const parts = [
    `T:${encryption}`,
    `S:${escapeWifiField(ssid)}`,
    encryption === "nopass" ? "" : `P:${escapeWifiField(password)}`,
    hidden ? "H:true" : "",
  ].filter(Boolean);
  return `WIFI:${parts.join(";")};;`;
};

export const parseBatchLines = (input: string, max = 100): string[] =>
  input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max);

export const BARCODE_FORMATS = [
  "CODE128",
  "EAN13",
  "EAN8",
  "UPC",
  "CODE39",
  "ITF14",
  "MSI",
  "pharmacode",
  "codabar",
] as const;

export type BarcodeFormat = (typeof BARCODE_FORMATS)[number];
