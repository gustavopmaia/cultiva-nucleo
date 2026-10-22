import type { WorkOrderRepository } from "./ports.js";

export class StartWorkOrder {
  constructor(private readonly workOrders: WorkOrderRepository) {}

  execute(workOrderId: number) {
    const workOrder = this.workOrders.findById(workOrderId);
    if (!workOrder) throw new Error("work order not found");

    workOrder.start();
    this.workOrders.save(workOrder);
  }
}
