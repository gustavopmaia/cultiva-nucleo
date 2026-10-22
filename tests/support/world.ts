import {
  InMemorySegmentRepository,
  InMemoryTeamRepository,
  InMemoryWorkOrderRepository,
} from "../../src/adapters/in-memory-repositories.js";
import { BuildRoutes } from "../../src/application/build-routes.js";
import { CompleteWorkOrder } from "../../src/application/complete-work-order.js";
import type { WorkOrderNotifier } from "../../src/application/ports.js";
import { RecordReading } from "../../src/application/record-reading.js";
import { StartWorkOrder } from "../../src/application/start-work-order.js";
import { Team } from "../../src/domain/maintenance/team.js";
import type { WorkOrder } from "../../src/domain/maintenance/work-order.js";
import { KmRange } from "../../src/domain/shared/km-range.js";
import type { Reading } from "../../src/domain/monitoring/reading.js";
import { RoadSegment } from "../../src/domain/monitoring/road-segment.js";

export class RecordingNotifier implements WorkOrderNotifier {
  opened: WorkOrder[] = [];

  workOrderOpened(workOrder: WorkOrder) {
    this.opened.push(workOrder);
  }
}

// Wires the use cases to in-memory adapters, so tests run without database or server.
export class World {
  readonly notifier = new RecordingNotifier();
  private readonly segmentRepository = new InMemorySegmentRepository();
  private readonly workOrderRepository = new InMemoryWorkOrderRepository();
  private readonly teamRepository = new InMemoryTeamRepository();
  private readonly recordReadingUseCase = new RecordReading(
    this.segmentRepository,
    this.workOrderRepository,
    this.notifier,
  );
  private readonly startWorkOrderUseCase = new StartWorkOrder(this.workOrderRepository);
  private readonly completeWorkOrderUseCase = new CompleteWorkOrder(
    this.segmentRepository,
    this.workOrderRepository,
  );
  private readonly buildRoutesUseCase = new BuildRoutes(
    this.workOrderRepository,
    this.teamRepository,
  );

  get segments() {
    return this.segmentRepository.all();
  }

  get alerts() {
    return this.segments.flatMap((segment) => segment.alerts);
  }

  get workOrders() {
    return this.workOrderRepository.all();
  }

  registerSegment(id: string, highway: string, kmStart: number, kmEnd: number) {
    this.segmentRepository.save(new RoadSegment(id, highway, new KmRange(kmStart, kmEnd)));
  }

  registerTeam(name: string, kmStart: number, kmEnd: number) {
    this.teamRepository.save(new Team(name, new KmRange(kmStart, kmEnd)));
  }

  recordReading(segmentId: string, reading: Reading) {
    this.recordReadingUseCase.execute(segmentId, reading);
  }

  buildRoutes() {
    return this.buildRoutesUseCase.execute();
  }

  startWorkOrder(id: number) {
    this.startWorkOrderUseCase.execute(id);
  }

  completeWorkOrder(id: number, at: Date) {
    this.completeWorkOrderUseCase.execute(id, at);
  }
}
