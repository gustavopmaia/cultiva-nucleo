import { Team } from "./team.js";
import { WorkOrder, type Priority } from "./work-order.js";

const PRIORITY_ORDER: Record<Priority, number> = { critical: 0, urgent: 1, normal: 2 };

const mostUrgentFirst = (a: WorkOrder, b: WorkOrder) =>
  PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
  a.createdAt.getTime() - b.createdAt.getTime() ||
  a.range.start - b.range.start;

export class RoutePlanner {
  build(workOrders: WorkOrder[], teams: Team[]): Map<string, WorkOrder[]> {
    const routes = new Map<string, WorkOrder[]>();
    for (const workOrder of workOrders.filter((o) => o.status !== "completed")) {
      const team = teams.find((e) => e.covers(workOrder.range));
      if (!team) continue;
      routes.set(team.name, [...(routes.get(team.name) ?? []), workOrder]);
    }
    for (const route of routes.values()) route.sort(mostUrgentFirst);
    return routes;
  }
}
