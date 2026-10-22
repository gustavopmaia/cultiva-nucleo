import { beforeEach, describe, expect, it } from "vitest";
import { World } from "./support/world.js";

const at = (hour: number) => new Date(Date.UTC(2026, 9, 20, hour, 0, 0));

describe("record reading use case with fake adapters", () => {
  let world: World;

  beforeEach(() => {
    world = new World();
    world.registerSegment("S1", "SP-300", 10, 20);
  });

  it("notifies once when a reading opens a work order", () => {
    world.recordReading("S1", { source: "iot", heightCm: 70, at: at(8) });

    expect(world.notifier.opened.map((o) => o.priority)).toEqual(["critical"]);
  });

  it("does not notify again for a repeated reading at the same level", () => {
    world.recordReading("S1", { source: "iot", heightCm: 70, at: at(8) });
    world.recordReading("S1", { source: "iot", heightCm: 70, at: at(9) });

    expect(world.notifier.opened).toHaveLength(1);
  });

  it("does not notify when the score stays below the first threshold", () => {
    world.recordReading("S1", { source: "iot", heightCm: 5, at: at(8) });

    expect(world.notifier.opened).toHaveLength(0);
  });

  it("keeps the segment unchanged when the reading is invalid", () => {
    expect(() => world.recordReading("S1", { source: "iot", heightCm: -3, at: at(8) })).toThrow(
      "invalid height",
    );

    expect(world.segments[0]!.currentScore).toBe(0);
    expect(world.notifier.opened).toHaveLength(0);
  });

  it("opens a new work order after the previous alert was closed", () => {
    world.recordReading("S1", { source: "iot", heightCm: 70, at: at(8) });
    world.startWorkOrder(1);
    world.completeWorkOrder(1, at(10));

    world.recordReading("S1", { source: "iot", heightCm: 70, at: at(36) });

    expect(world.workOrders.map((o) => o.status)).toEqual(["completed", "open"]);
  });
});
