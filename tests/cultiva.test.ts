import { beforeEach, describe, expect, it } from "vitest";
import { World } from "./support/world.js";

const hour = (h: number) => new Date(Date.UTC(2026, 9, 20, h, 0, 0));

describe("score per source", () => {
  let service: World;

  beforeEach(() => {
    service = new World();
    service.registerSegment("T1", "SP-300", 10, 20);
  });

  it("converts iot height to score by multiplying by 1.4", () => {
    service.recordReading("T1", { source: "iot", heightCm: 20, at: hour(8) });

    expect(service.segments[0]!.currentScore).toBeCloseTo(28);
  });

  it("caps the iot score at 100", () => {
    service.recordReading("T1", { source: "iot", heightCm: 200, at: hour(8) });

    expect(service.segments[0]!.currentScore).toBe(100);
  });

  it("accepts zero height with zero score", () => {
    service.recordReading("T1", { source: "iot", heightCm: 0, at: hour(8) });

    expect(service.segments[0]!.currentScore).toBe(0);
  });

  it("rejects negative height", () => {
    expect(() => service.recordReading("T1", { source: "iot", heightCm: -1, at: hour(8) })).toThrow(
      "invalid height",
    );
  });

  it("multiplies the vehicle base by the confidence", () => {
    service.recordReading("T1", {
      source: "vehicle",
      condition: "urgent",
      confidence: 0.5,
      at: hour(8),
    });

    expect(service.segments[0]!.currentScore).toBeCloseTo(42.5);
  });

  it("accepts confidence on a 0 to 100 scale", () => {
    service.recordReading("T1", {
      source: "vehicle",
      condition: "attention",
      confidence: 80,
      at: hour(8),
    });

    expect(service.segments[0]!.currentScore).toBeCloseTo(40);
  });

  it("rejects negative confidence", () => {
    expect(() =>
      service.recordReading("T1", {
        source: "vehicle",
        condition: "ok",
        confidence: -0.1,
        at: hour(8),
      }),
    ).toThrow("invalid confidence");
  });

  it("converts satellite ndvi and floors below 0.2 at zero", () => {
    service.recordReading("T1", { source: "satellite", ndvi: 0.45, at: hour(8) });
    expect(service.segments[0]!.currentScore).toBeCloseTo(50);

    service.recordReading("T1", { source: "satellite", ndvi: 0.1, at: hour(9) });
    expect(service.segments[0]!.currentScore).toBeCloseTo(25);
  });

  it("rejects ndvi outside -1 to 1", () => {
    expect(() =>
      service.recordReading("T1", { source: "satellite", ndvi: 1.5, at: hour(8) }),
    ).toThrow("invalid ndvi");
  });

  it("rejects a reading for a segment that does not exist", () => {
    expect(() => service.recordReading("X", { source: "iot", heightCm: 10, at: hour(8) })).toThrow(
      "segment not found",
    );
  });
});

describe("source fusion", () => {
  let service: World;

  beforeEach(() => {
    service = new World();
    service.registerSegment("T1", "SP-300", 10, 20);
  });

  it("weights the three sources 50, 35 and 15", () => {
    service.recordReading("T1", { source: "iot", heightCm: 45, at: hour(8) });
    service.recordReading("T1", {
      source: "vehicle",
      condition: "urgent",
      confidence: 1,
      at: hour(8),
    });
    service.recordReading("T1", { source: "satellite", ndvi: 0.45, at: hour(8) });

    expect(service.segments[0]!.currentScore).toBeCloseTo(63 * 0.5 + 85 * 0.35 + 50 * 0.15);
  });

  it("uses only the present sources, normalizing the weights", () => {
    service.recordReading("T1", { source: "iot", heightCm: 10, at: hour(8) });
    service.recordReading("T1", { source: "satellite", ndvi: 0.3, at: hour(8) });

    expect(service.segments[0]!.currentScore).toBeCloseTo((14 * 0.5 + 20 * 0.15) / 0.65);
  });

  it("averages readings from the same source", () => {
    service.recordReading("T1", { source: "iot", heightCm: 10, at: hour(8) });
    service.recordReading("T1", { source: "iot", heightCm: 20, at: hour(9) });

    expect(service.segments[0]!.currentScore).toBeCloseTo(21);
  });

  it("ignores readings older than 24h", () => {
    service.recordReading("T1", { source: "iot", heightCm: 70, at: hour(8) });
    const day = 24 * 60 * 60 * 1000;
    service.recordReading("T1", {
      source: "iot",
      heightCm: 10,
      at: new Date(hour(8).getTime() + day + 1),
    });

    expect(service.segments[0]!.currentScore).toBeCloseTo(14);
  });

  it("includes a reading exactly 24h old", () => {
    service.recordReading("T1", { source: "iot", heightCm: 20, at: hour(8) });
    service.recordReading("T1", {
      source: "iot",
      heightCm: 10,
      at: new Date(hour(8).getTime() + 24 * 60 * 60 * 1000),
    });

    expect(service.segments[0]!.currentScore).toBeCloseTo(21);
  });

  it("flags divergence when the gap between sources exceeds 40", () => {
    service.recordReading("T1", { source: "iot", heightCm: 0, at: hour(8) });
    service.recordReading("T1", {
      source: "vehicle",
      condition: "urgent",
      confidence: 1,
      at: hour(8),
    });

    expect(service.segments[0]!.divergentScore).toBe(true);
  });

  it("does not flag divergence with a gap of exactly 40", () => {
    service.recordReading("T1", { source: "iot", heightCm: 50 / 1.4, at: hour(8) });
    service.recordReading("T1", { source: "satellite", ndvi: 0.2 + 10 / 200, at: hour(8) });

    expect(service.segments[0]!.divergentScore).toBe(false);
  });
});

describe("alerts and work orders", () => {
  let service: World;

  beforeEach(() => {
    service = new World();
    service.registerSegment("T1", "SP-300", 10, 20);
  });

  it("does not open an alert below 30", () => {
    service.recordReading("T1", { source: "iot", heightCm: 21, at: hour(8) });

    expect(service.alerts).toHaveLength(0);
    expect(service.workOrders).toHaveLength(0);
  });

  it("opens an attention alert and a normal work order at score 30", () => {
    service.recordReading("T1", { source: "iot", heightCm: 30 / 1.4, at: hour(8) });

    expect(service.alerts[0]!.level).toBe("attention");
    expect(service.workOrders[0]!.priority).toBe("normal");
  });

  it("opens an urgent alert with score between 55 and 80", () => {
    service.recordReading("T1", { source: "iot", heightCm: 40, at: hour(8) });

    expect(service.alerts[0]!.level).toBe("urgent");
    expect(service.workOrders[0]!.priority).toBe("urgent");
  });

  it("opens a critical alert at score 80", () => {
    service.recordReading("T1", { source: "iot", heightCm: 80 / 1.4, at: hour(8) });

    expect(service.alerts[0]!.level).toBe("critical");
    expect(service.workOrders[0]!.priority).toBe("critical");
  });

  it("does not duplicate alert or work order for the same segment and level", () => {
    service.recordReading("T1", { source: "iot", heightCm: 60, at: hour(8) });
    service.recordReading("T1", { source: "iot", heightCm: 60, at: hour(9) });

    expect(service.alerts).toHaveLength(1);
    expect(service.workOrders).toHaveLength(1);
  });

  it("opens a new alert when the level rises", () => {
    service.recordReading("T1", { source: "iot", heightCm: 30, at: hour(8) });
    service.recordReading("T1", { source: "iot", heightCm: 70, at: hour(34) });

    expect(service.alerts.map((a) => a.level)).toEqual(["attention", "critical"]);
  });
});

describe("dispatch", () => {
  let service: World;

  beforeEach(() => {
    service = new World();
    service.registerTeam("North", 0, 30);
    service.registerTeam("South", 31, 60);
  });

  it("sorts the route by priority, then creation, then km", () => {
    service.registerSegment("A", "SP-300", 5, 8);
    service.registerSegment("B", "SP-300", 12, 15);
    service.registerSegment("C", "SP-300", 3, 4);
    service.registerSegment("D", "SP-300", 8, 9);
    service.recordReading("A", { source: "iot", heightCm: 70, at: hour(10) });
    service.recordReading("B", { source: "iot", heightCm: 40, at: hour(9) });
    service.recordReading("C", { source: "iot", heightCm: 40, at: hour(11) });
    service.recordReading("D", { source: "iot", heightCm: 25, at: hour(8) });

    const route = service.buildRoutes().get("North")!;

    expect(route.map((o) => o.segmentId)).toEqual(["A", "B", "C", "D"]);
  });

  it("splits work orders by the team that covers the segment", () => {
    service.registerSegment("N", "SP-300", 5, 8);
    service.registerSegment("S", "SP-300", 40, 45);
    service.recordReading("N", { source: "iot", heightCm: 70, at: hour(8) });
    service.recordReading("S", { source: "iot", heightCm: 70, at: hour(8) });

    const routes = service.buildRoutes();

    expect(routes.get("North")!.map((o) => o.segmentId)).toEqual(["N"]);
    expect(routes.get("South")!.map((o) => o.segmentId)).toEqual(["S"]);
  });

  it("leaves out work orders for segments without a responsible team", () => {
    service.registerSegment("X", "SP-300", 100, 110);
    service.recordReading("X", { source: "iot", heightCm: 70, at: hour(8) });

    expect(service.buildRoutes().size).toBe(0);
  });

  it("does not include a completed work order in the route", () => {
    service.registerSegment("A", "SP-300", 5, 8);
    service.recordReading("A", { source: "iot", heightCm: 70, at: hour(8) });
    service.startWorkOrder(1);
    service.completeWorkOrder(1, hour(12));

    expect(service.buildRoutes().size).toBe(0);
  });
});

describe("work order lifecycle", () => {
  let service: World;

  beforeEach(() => {
    service = new World();
    service.registerSegment("T1", "SP-300", 10, 20);
    service.recordReading("T1", { source: "iot", heightCm: 70, at: hour(8) });
  });

  it("starts an open work order", () => {
    service.startWorkOrder(1);

    expect(service.workOrders[0]!.status).toBe("in_progress");
  });

  it("does not start a work order that is already in progress", () => {
    service.startWorkOrder(1);

    expect(() => service.startWorkOrder(1)).toThrow("only an open work order can be started");
  });

  it("does not complete a work order that was not started", () => {
    expect(() => service.completeWorkOrder(1, hour(12))).toThrow("work order must be in progress");
  });

  it("on completion, resets the segment score and closes the alert", () => {
    service.startWorkOrder(1);

    service.completeWorkOrder(1, hour(12));

    expect(service.workOrders[0]!.status).toBe("completed");
    expect(service.workOrders[0]!.completedAt).toEqual(hour(12));
    expect(service.segments[0]!.currentScore).toBe(0);
    expect(service.segments[0]!.divergentScore).toBe(false);
    expect(service.alerts[0]!.closedAt).toEqual(hour(12));
  });

  it("does not complete the same work order twice", () => {
    service.startWorkOrder(1);
    service.completeWorkOrder(1, hour(12));

    expect(() => service.completeWorkOrder(1, hour(13))).toThrow("work order already completed");
  });

  it("rejects a nonexistent work order", () => {
    expect(() => service.startWorkOrder(99)).toThrow("work order not found");
  });
});
