import { RoutePlanner } from "../domain/maintenance/route-planner.js";
import type { TeamRepository, WorkOrderRepository } from "./ports.js";

export class BuildRoutes {
  constructor(
    private readonly workOrders: WorkOrderRepository,
    private readonly teams: TeamRepository,
    private readonly planner = new RoutePlanner(),
  ) {}

  execute() {
    return this.planner.build(this.workOrders.all(), this.teams.all());
  }
}
