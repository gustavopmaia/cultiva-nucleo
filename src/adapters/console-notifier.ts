import type { WorkOrderNotifier } from "../application/ports.js";
import type { WorkOrder } from "../domain/maintenance/work-order.js";

export class ConsoleNotifier implements WorkOrderNotifier {
  workOrderOpened(workOrder: WorkOrder) {
    console.log(`   [notification] work order ${workOrder.id} opened (${workOrder.priority})`);
  }
}
