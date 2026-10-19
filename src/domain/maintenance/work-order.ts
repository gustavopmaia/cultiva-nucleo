import { KmRange } from "../shared/km-range.js";

export type Priority = "normal" | "urgent" | "critical";
export type WorkOrderStatus = "open" | "in_progress" | "completed";

export class WorkOrder {
  status: WorkOrderStatus = "open";
  completedAt: Date | null = null;

  constructor(
    readonly id: number,
    readonly segmentId: string,
    readonly alertId: string,
    readonly range: KmRange,
    readonly priority: Priority,
    readonly createdAt: Date,
  ) {}

  start() {
    if (this.status !== "open") throw new Error("only an open work order can be started");
    this.status = "in_progress";
  }

  complete(at: Date) {
    if (this.status === "completed") throw new Error("work order already completed");
    if (this.status !== "in_progress") throw new Error("work order must be in progress");
    this.status = "completed";
    this.completedAt = at;
  }
}
