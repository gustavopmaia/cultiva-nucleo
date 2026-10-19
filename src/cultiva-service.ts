import { Team } from "./domain/maintenance/team.js";
import { WorkOrder } from "./domain/maintenance/work-order.js";
import { RoutePlanner } from "./domain/maintenance/route-planner.js";
import { priorityForLevel } from "./domain/maintenance/priority.js";
import type { Alert } from "./domain/monitoring/alert.js";
import { KmRange } from "./domain/shared/km-range.js";
import type { Reading } from "./domain/monitoring/reading.js";
import { RoadSegment } from "./domain/monitoring/road-segment.js";

export type { Reading };

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
    this.teams.push(new Team(name, new KmRange(kmStart, kmEnd)));
  }

  recordReading(segmentId: string, reading: Reading) {
    const segment = this.segments.find((t) => t.id === segmentId);
    if (!segment) throw new Error("segment not found");

    const alert = segment.recordReading(reading);
    if (!alert) return;
    this.workOrders.push(
      new WorkOrder(
        this.workOrders.length + 1,
        segment.id,
        alert.id,
        segment.range,
        priorityForLevel(alert.level),
        reading.at,
      ),
    );
  }

  buildRoutes(): Map<string, WorkOrder[]> {
    return new RoutePlanner().build(this.workOrders, this.teams);
  }

  startWorkOrder(id: number) {
    this.findWorkOrder(id).start();
  }

  completeWorkOrder(id: number, at: Date) {
    const workOrder = this.findWorkOrder(id);
    workOrder.complete(at);
    const segment = this.segments.find((t) => t.id === workOrder.segmentId)!;
    segment.completeMaintenance(workOrder.alertId, at);
  }

  private findWorkOrder(id: number): WorkOrder {
    const workOrder = this.workOrders.find((o) => o.id === id);
    if (!workOrder) throw new Error("work order not found");
    return workOrder;
  }
}
