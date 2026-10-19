import { Alert } from "./domain/monitoring/alert.js";
import { KmRange } from "./domain/monitoring/km-range.js";
import type { Reading } from "./domain/monitoring/reading.js";
import { RoadSegment } from "./domain/monitoring/road-segment.js";

export type { Reading };

export interface Team {
  name: string;
  kmStart: number;
  kmEnd: number;
}

export interface WorkOrder {
  id: number;
  segmentId: string;
  alertId: string;
  priority: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
}

export class CultivaService {
  segments: RoadSegment[] = [];
  teams: Team[] = [];
  workOrders: WorkOrder[] = [];

  get alerts(): Alert[] {
    return this.segments.flatMap((t) => t.alerts);
  }

  registerSegment(id: string, highway: string, kmStart: number, kmEnd: number) {
    this.segments.push(new RoadSegment(id, highway, new KmRange(kmStart, kmEnd)));
  }

  registerTeam(name: string, kmStart: number, kmEnd: number) {
    this.teams.push({ name, kmStart, kmEnd });
  }

  recordReading(segmentId: string, reading: Reading) {
    const segment = this.segments.find((t) => t.id === segmentId);
    if (!segment) throw new Error("segment not found");

    const alert = segment.recordReading(reading);
    if (alert) this.openWorkOrder(alert, reading.at);
  }

  private openWorkOrder(alert: Alert, createdAt: Date) {
    let priority = "normal";
    if (alert.level === "urgent") priority = "urgent";
    if (alert.level === "critical") priority = "critical";
    this.workOrders.push({
      id: this.workOrders.length + 1,
      segmentId: alert.segmentId,
      alertId: alert.id,
      priority,
      status: "open",
      createdAt,
      completedAt: null,
    });
  }

  buildRoutes(): Map<string, WorkOrder[]> {
    const routes = new Map<string, WorkOrder[]>();
    for (const workOrder of this.workOrders) {
      if (workOrder.status === "completed") continue;
      const segment = this.segments.find((t) => t.id === workOrder.segmentId)!;
      const team = this.teams.find(
        (e) => e.kmStart <= segment.range.end && e.kmEnd >= segment.range.start,
      );
      if (!team) continue;
      if (!routes.has(team.name)) routes.set(team.name, []);
      routes.get(team.name)!.push(workOrder);
    }
    const weight: Record<string, number> = { critical: 0, urgent: 1, normal: 2 };
    for (const lista of routes.values()) {
      lista.sort((a, b) => {
        if (weight[a.priority]! !== weight[b.priority]!)
          return weight[a.priority]! - weight[b.priority]!;
        if (a.createdAt.getTime() !== b.createdAt.getTime())
          return a.createdAt.getTime() - b.createdAt.getTime();
        const ta = this.segments.find((t) => t.id === a.segmentId)!;
        const tb = this.segments.find((t) => t.id === b.segmentId)!;
        return ta.range.start - tb.range.start;
      });
    }
    return routes;
  }

  startWorkOrder(id: number) {
    const workOrder = this.workOrders.find((o) => o.id === id);
    if (!workOrder) throw new Error("work order not found");
    if (workOrder.status === "open") {
      workOrder.status = "in_progress";
    } else {
      throw new Error("only an open work order can be started");
    }
  }

  completeWorkOrder(id: number, at: Date) {
    const workOrder = this.workOrders.find((o) => o.id === id);
    if (!workOrder) throw new Error("work order not found");
    if (workOrder.status === "completed") throw new Error("work order already completed");
    if (workOrder.status !== "in_progress") throw new Error("work order must be in progress");
    workOrder.status = "completed";
    workOrder.completedAt = at;
    const segment = this.segments.find((t) => t.id === workOrder.segmentId)!;
    segment.completeMaintenance(workOrder.alertId, at);
  }
}
