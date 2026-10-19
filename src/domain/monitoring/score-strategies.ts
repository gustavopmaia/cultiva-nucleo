import type { Source, Reading } from "./reading.js";
import { Score } from "./score.js";

// Strategy: each source turns its raw reading into a score and has its own fusion weight.
export interface ScoreStrategy {
  weight: number;
  calculate(reading: Reading): Score;
}

const iotScore: ScoreStrategy = {
  weight: 0.5,
  calculate(reading) {
    if (reading.source !== "iot") throw new Error("reading is not iot");
    if (reading.heightCm < 0) throw new Error("invalid height");
    return new Score(reading.heightCm * 1.4);
  },
};

const VEHICLE_BASE = { ok: 10, attention: 50, urgent: 85 };

const vehicleScore: ScoreStrategy = {
  weight: 0.35,
  calculate(reading) {
    if (reading.source !== "vehicle") throw new Error("reading is not vehicle");
    const confidence = reading.confidence > 1 ? reading.confidence / 100 : reading.confidence;
    if (confidence < 0 || confidence > 1) throw new Error("invalid confidence");
    return new Score(VEHICLE_BASE[reading.condition] * confidence);
  },
};

const satelliteScore: ScoreStrategy = {
  weight: 0.15,
  calculate(reading) {
    if (reading.source !== "satellite") throw new Error("reading is not satellite");
    if (reading.ndvi < -1 || reading.ndvi > 1) throw new Error("invalid ndvi");
    return new Score((reading.ndvi - 0.2) * 200);
  },
};

export const STRATEGIES: Record<Source, ScoreStrategy> = {
  iot: iotScore,
  vehicle: vehicleScore,
  satellite: satelliteScore,
};
