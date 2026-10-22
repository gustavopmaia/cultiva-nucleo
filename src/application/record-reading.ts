import { WorkOrder } from "../domain/maintenance/work-order.js";
import { priorityForLevel } from "../domain/maintenance/priority.js";
import type { Reading } from "../domain/monitoring/reading.js";
import type { SegmentRepository, WorkOrderNotifier, WorkOrderRepository } from "./ports.js";

export class RecordReading {
  constructor(
    private readonly segments: SegmentRepository,
    private readonly workOrders: WorkOrderRepository,
    private readonly notifier: WorkOrderNotifier,
  ) {}

  execute(segmentId: string, reading: Reading) {
    const segment = this.segments.findById(segmentId);
    if (!segment) throw new Error("segment not found");

    const alert = segment.recordReading(reading);
    this.segments.save(segment);
    if (!alert) return;

    const workOrder = new WorkOrder(
      this.workOrders.nextId(),
      segment.id,
      alert.id,
      segment.range,
      priorityForLevel(alert.level),
      reading.at,
    );
    this.workOrders.save(workOrder);
    this.notifier.workOrderOpened(workOrder);
  }
}
