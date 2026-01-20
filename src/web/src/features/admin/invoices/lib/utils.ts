
import type { MetadataObject } from "@/types/types"; // adjust path

export type LegacyFeeSnapshot = {
  id?: number;
  name?: string;
  category?: string;
  amount?: number;
};

export type LegacyInvoiceSnapshot = {
  invoice_months?: string[];
};

export type LegacyMetadata = MetadataObject & {
  legacy: true;
  legacy_batch?: string;
  legacy_key?: string;
  fee_snapshot?: LegacyFeeSnapshot;
  invoice_snapshot?: LegacyInvoiceSnapshot;
};

export const isMetadataObject = (v: unknown): v is MetadataObject =>
  !!v && typeof v === "object" && !Array.isArray(v);

export const isLegacyMetadata = (m: MetadataObject | null | undefined): m is LegacyMetadata =>
  !!m && isMetadataObject(m) && m["legacy"] === true;

export const getString = (obj: MetadataObject, key: string): string | undefined => {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
};

export const getObject = (obj: MetadataObject, key: string): MetadataObject | undefined => {
  const v = obj[key];
  return isMetadataObject(v) ? v : undefined;
};

export const getNumber = (obj: MetadataObject, key: string): number | undefined => {
  const v = obj[key];
  return typeof v === "number" ? v : undefined;
};

export const getStringArray = (obj: MetadataObject, key: string): string[] | undefined => {
  const v = obj[key];
  if (!Array.isArray(v)) return undefined;
  const arr = v.filter((x): x is string => typeof x === "string");
  return arr.length ? arr : undefined;
};

export const formatFeeCategory = (category?: string) =>
  category ? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";
