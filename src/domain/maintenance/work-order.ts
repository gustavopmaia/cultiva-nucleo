import { KmRange } from "../shared/km-range.js";

export type Priority = "normal" | "urgent" | "critical";
export type WorkOrderStatus = "open" | "in_progress" | "completed";

// State: each state decides which transitions the work order accepts.
interface WorkOrderState {
  status: WorkOrderStatus;
  start(): WorkOrderState;
  complete(): WorkOrderState;
}

class Open implements WorkOrderState {
  status = "open" as const;

  start(): WorkOrderState {
    return new InProgress();
  }

  complete(): WorkOrderState {
    throw new Error("work order must be in progress");
  }
}

class InProgress implements WorkOrderState {
  status = "in_progress" as const;

  start(): WorkOrderState {
    throw new Error("only an open work order can be started");
  }

  complete(): WorkOrderState {
    return new Completed();
  }
}

class Completed implements WorkOrderState {
  status = "completed" as const;

  start(): WorkOrderState {
    throw new Error("only an open work order can be started");
  }

  complete(): WorkOrderState {
    throw new Error("work order already completed");
  }
}

export class WorkOrder {
  completedAt: Date | null = null;
  private state: WorkOrderState = new Open();

  constructor(
    readonly id: number,
    readonly segmentId: string,
    readonly alertId: string,
    readonly range: KmRange,
    readonly priority: Priority,
    readonly createdAt: Date,
  ) {}

  get status(): WorkOrderStatus {
    return this.state.status;
  }

  start() {
    this.state = this.state.start();
  }

  complete(at: Date) {
    this.state = this.state.complete();
    this.completedAt = at;
  }
}
