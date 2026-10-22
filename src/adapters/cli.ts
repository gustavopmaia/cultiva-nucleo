import { BuildRoutes } from "../application/build-routes.js";
import { CompleteWorkOrder } from "../application/complete-work-order.js";
import { RecordReading } from "../application/record-reading.js";
import { StartWorkOrder } from "../application/start-work-order.js";
import { Team } from "../domain/maintenance/team.js";
import { KmRange } from "../domain/shared/km-range.js";
import { RoadSegment } from "../domain/monitoring/road-segment.js";
import { ConsoleNotifier } from "./console-notifier.js";
import {
  InMemorySegmentRepository,
  InMemoryTeamRepository,
  InMemoryWorkOrderRepository,
} from "./in-memory-repositories.js";

const segments = new InMemorySegmentRepository();
const workOrders = new InMemoryWorkOrderRepository();
const teams = new InMemoryTeamRepository();
const recordReading = new RecordReading(segments, workOrders, new ConsoleNotifier());
const buildRoutes = new BuildRoutes(workOrders, teams);
const now = new Date();

teams.save(new Team("Team North", new KmRange(0, 30)));
segments.save(new RoadSegment("SP300-KM12", "SP-300", new KmRange(12, 15)));
segments.save(new RoadSegment("SP300-KM05", "SP-300", new KmRange(5, 8)));

console.log("1. readings arrive at the road segments");
recordReading.execute("SP300-KM12", { source: "iot", heightCm: 70, at: now });
recordReading.execute("SP300-KM05", { source: "iot", heightCm: 25, at: now });
recordReading.execute("SP300-KM05", { source: "satellite", ndvi: 0.5, at: now });
for (const segment of segments.all()) {
  console.log(`   ${segment.id} score ${segment.currentScore.toFixed(1)}`);
}

console.log("2. work orders opened");
for (const workOrder of workOrders.all()) {
  console.log(
    `   work order ${workOrder.id} segment ${workOrder.segmentId} priority ${workOrder.priority}`,
  );
}

console.log("3. team route");
for (const [team, route] of buildRoutes.execute()) {
  console.log(`   ${team}: ${route.map((o) => o.segmentId).join(" -> ")}`);
}

console.log("4. team completes the first work order of the route");
const first = buildRoutes.execute().get("Team North")![0]!;
new StartWorkOrder(workOrders).execute(first.id);
new CompleteWorkOrder(segments, workOrders).execute(first.id, new Date());
const segment = segments.findById(first.segmentId)!;
console.log(`   work order ${first.id} completed, score of ${segment.id}: ${segment.currentScore}`);
