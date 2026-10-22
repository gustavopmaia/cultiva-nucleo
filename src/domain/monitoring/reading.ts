export type Source = "iot" | "vehicle" | "satellite";

export type Reading =
  | { source: "iot"; heightCm: number; at: Date }
  | { source: "vehicle"; condition: "ok" | "attention" | "urgent"; confidence: number; at: Date }
  | { source: "satellite"; ndvi: number; at: Date };
