export type Reading =
  | { source: "iot"; heightCm: number; at: Date }
  | { source: "vehicle"; condition: "ok" | "attention" | "urgent"; confidence: number; at: Date }
  | { source: "satellite"; ndvi: number; at: Date };

export interface RoadSegment {
  id: string;
  highway: string;
  kmStart: number;
  kmEnd: number;
  currentScore: number;
  divergentScore: boolean;
}

export interface Team {
  name: string;
  kmStart: number;
  kmEnd: number;
}

export interface Alert {
  id: number;
  segmentId: string;
  level: string;
  closedAt: Date | null;
}

export interface WorkOrder {
  id: number;
  segmentId: string;
  alertId: number;
  priority: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
}

export class CultivaService {
  segments: RoadSegment[] = [];
  teams: Team[] = [];
  readings: { segmentId: string; source: string; score: number; at: Date }[] = [];
  alerts: Alert[] = [];
  workOrders: WorkOrder[] = [];

  registerSegment(id: string, highway: string, kmStart: number, kmEnd: number) {
    this.segments.push({ id, highway, kmStart, kmEnd, currentScore: 0, divergentScore: false });
  }

  registerTeam(name: string, kmStart: number, kmEnd: number) {
    this.teams.push({ name, kmStart, kmEnd });
  }

  recordReading(segmentId: string, reading: Reading) {
    const segment = this.segments.find((t) => t.id === segmentId);
    if (!segment) throw new Error("segment not found");

    let score = 0;
    if (reading.source === "iot") {
      if (reading.heightCm < 0) throw new Error("invalid height");
      score = reading.heightCm * 1.4;
    } else if (reading.source === "vehicle") {
      let base = 0;
      if (reading.condition === "ok") base = 10;
      else if (reading.condition === "attention") base = 50;
      else if (reading.condition === "urgent") base = 85;
      let confidence = reading.confidence;
      if (confidence > 1) confidence = confidence / 100;
      if (confidence < 0 || confidence > 1) throw new Error("invalid confidence");
      score = base * confidence;
    } else if (reading.source === "satellite") {
      if (reading.ndvi < -1 || reading.ndvi > 1) throw new Error("invalid ndvi");
      score = (reading.ndvi - 0.2) * 200;
    }
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    this.readings.push({ segmentId, source: reading.source, score, at: reading.at });

    // fuse readings from the last 24h
    const limit = reading.at.getTime() - 24 * 60 * 60 * 1000;
    const recent = this.readings.filter(
      (l) =>
        l.segmentId === segmentId &&
        l.at.getTime() >= limit &&
        l.at.getTime() <= reading.at.getTime(),
    );
    const fontes = ["iot", "vehicle", "satellite"];
    let sum = 0;
    let weights = 0;
    const averages: number[] = [];
    for (const source of fontes) {
      const fromSource = recent.filter((l) => l.source === source);
      if (fromSource.length === 0) continue;
      const average = fromSource.reduce((s, l) => s + l.score, 0) / fromSource.length;
      let weight = 0;
      if (source === "iot") weight = 0.5;
      if (source === "vehicle") weight = 0.35;
      if (source === "satellite") weight = 0.15;
      sum += average * weight;
      weights += weight;
      averages.push(average);
    }
    segment.currentScore = sum / weights;
    segment.divergentScore = Math.max(...averages) - Math.min(...averages) > 40;

    let level = "";
    if (segment.currentScore >= 80) level = "critical";
    else if (segment.currentScore >= 55) level = "urgent";
    else if (segment.currentScore >= 30) level = "attention";
    if (level !== "") {
      const existente = this.alerts.find(
        (a) => a.segmentId === segmentId && a.level === level && a.closedAt === null,
      );
      if (!existente) {
        const alert: Alert = { id: this.alerts.length + 1, segmentId, level, closedAt: null };
        this.alerts.push(alert);
        let priority = "normal";
        if (level === "urgent") priority = "urgent";
        if (level === "critical") priority = "critical";
        this.workOrders.push({
          id: this.workOrders.length + 1,
          segmentId,
          alertId: alert.id,
          priority,
          status: "open",
          createdAt: reading.at,
          completedAt: null,
        });
      }
    }
  }

  buildRoutes(): Map<string, WorkOrder[]> {
    const routes = new Map<string, WorkOrder[]>();
    for (const workOrder of this.workOrders) {
      if (workOrder.status === "completed") continue;
      const segment = this.segments.find((t) => t.id === workOrder.segmentId)!;
      const team = this.teams.find((e) => e.kmStart <= segment.kmEnd && e.kmEnd >= segment.kmStart);
      if (!team) continue;
      if (!routes.has(team.name)) routes.set(team.name, []);
      routes.get(team.name)!.push(workOrder);
    }
    const weight: Record<string, number> = { critical: 0, urgent: 1, normal: 2 };
    for (const lista of routes.values()) {
      lista.sort((a, b) => {
        if (weight[a.priority]! !== weight[b.priority]!)
          return weight[a.priority]! - weight[b.priority]!;
        if (a.createdAt.getTime() !== b.createdAt.getTime())
          return a.createdAt.getTime() - b.createdAt.getTime();
        const ta = this.segments.find((t) => t.id === a.segmentId)!;
        const tb = this.segments.find((t) => t.id === b.segmentId)!;
        return ta.kmStart - tb.kmStart;
      });
    }
    return routes;
  }

  startWorkOrder(id: number) {
    const workOrder = this.workOrders.find((o) => o.id === id);
    if (!workOrder) throw new Error("work order not found");
    if (workOrder.status === "open") {
      workOrder.status = "in_progress";
    } else {
      throw new Error("only an open work order can be started");
    }
  }

  completeWorkOrder(id: number, at: Date) {
    const workOrder = this.workOrders.find((o) => o.id === id);
    if (!workOrder) throw new Error("work order not found");
    if (workOrder.status === "completed") throw new Error("work order already completed");
    if (workOrder.status !== "in_progress") throw new Error("work order must be in progress");
    workOrder.status = "completed";
    workOrder.completedAt = at;
    const segment = this.segments.find((t) => t.id === workOrder.segmentId)!;
    segment.currentScore = 0;
    segment.divergentScore = false;
    const alert = this.alerts.find((a) => a.id === workOrder.alertId)!;
    alert.closedAt = at;
  }
}
