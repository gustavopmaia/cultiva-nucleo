import type { AlertLevel } from "../monitoring/score.js";
import type { Priority } from "./work-order.js";

// Boundary between the two contexts: the alert level becomes the work order priority.
export const priorityForLevel = (level: AlertLevel): Priority =>
  level === "attention" ? "normal" : level;
