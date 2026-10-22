import { CultivaService } from "./cultiva-service.js";

const service = new CultivaService();
const now = new Date();

service.registerTeam("Team North", 0, 30);
service.registerSegment("SP300-KM12", "SP-300", 12, 15);
service.registerSegment("SP300-KM05", "SP-300", 5, 8);

console.log("1. readings arrive at the road segments");
service.recordReading("SP300-KM12", { source: "iot", heightCm: 70, at: now });
service.recordReading("SP300-KM05", { source: "iot", heightCm: 25, at: now });
service.recordReading("SP300-KM05", { source: "satellite", ndvi: 0.5, at: now });
for (const segment of service.segments) {
  console.log(`   ${segment.id} score ${segment.currentScore.toFixed(1)}`);
}

console.log("2. alerts and work orders opened");
for (const workOrder of service.workOrders) {
  console.log(
    `   work order ${workOrder.id} segment ${workOrder.segmentId} priority ${workOrder.priority}`,
  );
}

console.log("3. team route");
for (const [team, workOrders] of service.buildRoutes()) {
  console.log(`   ${team}: ${workOrders.map((o) => o.segmentId).join(" -> ")}`);
}

console.log("4. team completes the first work order of the route");
const first = service.buildRoutes().get("Team North")![0]!;
service.startWorkOrder(first.id);
service.completeWorkOrder(first.id, new Date());
const segment = service.segments.find((t) => t.id === first.segmentId)!;
console.log(
  `   work order ${first.id} completed, segment score ${segment.id}: ${segment.currentScore}`,
);
