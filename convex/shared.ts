// convex/shared.ts
import { v } from "convex/values";

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