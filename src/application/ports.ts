import type { WorkOrder } from "../domain/maintenance/work-order.js";
import type { Team } from "../domain/maintenance/team.js";
import type { RoadSegment } from "../domain/monitoring/road-segment.js";

export interface SegmentRepository {
  save(segment: RoadSegment): void;
  findById(id: string): RoadSegment | undefined;
  all(): RoadSegment[];
}

export interface WorkOrderRepository {
  nextId(): number;
  save(workOrder: WorkOrder): void;
  findById(id: number): WorkOrder | undefined;
  all(): WorkOrder[];
}

export interface TeamRepository {
  save(team: Team): void;
  all(): Team[];
}

export interface WorkOrderNotifier {
  workOrderOpened(workOrder: WorkOrder): void;
}
