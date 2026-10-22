import type {
  SegmentRepository,
  TeamRepository,
  WorkOrderRepository,
} from "../application/ports.js";
import type { Team } from "../domain/maintenance/team.js";
import type { WorkOrder } from "../domain/maintenance/work-order.js";
import type { RoadSegment } from "../domain/monitoring/road-segment.js";

export class InMemorySegmentRepository implements SegmentRepository {
  private readonly items = new Map<string, RoadSegment>();

  save(segment: RoadSegment) {
    this.items.set(segment.id, segment);
  }

  findById(id: string) {
    return this.items.get(id);
  }

  all() {
    return [...this.items.values()];
  }
}

export class InMemoryWorkOrderRepository implements WorkOrderRepository {
  private readonly items = new Map<number, WorkOrder>();

  nextId() {
    return this.items.size + 1;
  }

  save(workOrder: WorkOrder) {
    this.items.set(workOrder.id, workOrder);
  }

  findById(id: number) {
    return this.items.get(id);
  }

  all() {
    return [...this.items.values()];
  }
}

export class InMemoryTeamRepository implements TeamRepository {
  private readonly items: Team[] = [];

  save(team: Team) {
    this.items.push(team);
  }

  all() {
    return [...this.items];
  }
}
