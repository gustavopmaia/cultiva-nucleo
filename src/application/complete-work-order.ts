import type { SegmentRepository, WorkOrderRepository } from "./ports.js";

export class CompleteWorkOrder {
  constructor(
    private readonly segments: SegmentRepository,
    private readonly workOrders: WorkOrderRepository,
  ) {}

  execute(workOrderId: number, at: Date) {
    const workOrder = this.workOrders.findById(workOrderId);
    if (!workOrder) throw new Error("work order not found");
    const segment = this.segments.findById(workOrder.segmentId);
    if (!segment) throw new Error("segment not found");

    workOrder.complete(at);
    segment.completeMaintenance(workOrder.alertId, at);
    this.workOrders.save(workOrder);
    this.segments.save(segment);
  }
}
