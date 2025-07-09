// convex/shared.ts
import { v } from "convex/values";

/**
 * Normalizes a string for searching. (From our previous changes)
 * e.g., "NCBA Bank - Town" -> "ncba town"
 */
export const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\bbank\b/g, "") // 1. Remove the whole word "bank" first
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // 2. Then, remove punctuation
    .replace(/\s{2,}/g, " ") // 3. Replace multiple spaces with a single one
    .trim();
};

// Define and export the machine categories validator so it can be reused
export const machineCategory = v.union(
  v.literal("note counting machines"),
  v.literal("coin counting machines"),
  v.literal("strapping machines"),
  v.literal("printers"),
  v.literal("power/electrical equipments"),
  v.literal("teller safes"),
  v.literal("other financial devices"),
  v.literal("solar&EcoFlow devices"),
  v.literal("shredders")
);