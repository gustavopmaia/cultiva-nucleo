import { Alert } from "./alert.js";
import { STRATEGIES } from "./score-strategies.js";
import { KmRange } from "./km-range.js";
import type { Source, Reading } from "./reading.js";
import { Score } from "./score.js";

const FUSION_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_DIVERGENCE = 40;

interface ScoredReading {
  source: Source;
  score: Score;
  at: Date;
}

// Aggregate root: readings and alerts only exist inside a road segment.
export class RoadSegment {
  readonly alerts: Alert[] = [];
  private readings: ScoredReading[] = [];
  private score = new Score(0);
  divergentScore = false;

  constructor(
    readonly id: string,
    readonly highway: string,
    readonly range: KmRange,
  ) {}

  get currentScore(): number {
    return this.score.value;
  }

  // Returns the alert opened by this reading, or null if nothing new was opened.
  recordReading(reading: Reading): Alert | null {
    const score = STRATEGIES[reading.source].calculate(reading);
    this.readings.push({ source: reading.source, score, at: reading.at });
    this.fuseReadings(reading.at);
    return this.openAlertIfThresholdCrossed();
  }

  completeMaintenance(alertId: string, at: Date) {
    this.score = new Score(0);
    this.divergentScore = false;
    this.alerts.find((a) => a.id === alertId)?.close(at);
  }

  private fuseReadings(reference: Date) {
    const limit = reference.getTime() - FUSION_WINDOW_MS;
    const recent = this.readings.filter(
      (l) => l.at.getTime() >= limit && l.at.getTime() <= reference.getTime(),
    );
    let sum = 0;
    let weights = 0;
    const averages: number[] = [];
    for (const source of Object.keys(STRATEGIES) as Source[]) {
      const fromSource = recent.filter((l) => l.source === source);
      if (fromSource.length === 0) continue;
      const average = fromSource.reduce((s, l) => s + l.score.value, 0) / fromSource.length;
      sum += average * STRATEGIES[source].weight;
      weights += STRATEGIES[source].weight;
      averages.push(average);
    }
    this.score = new Score(sum / weights);
    this.divergentScore = Math.max(...averages) - Math.min(...averages) > MAX_DIVERGENCE;
  }

  private openAlertIfThresholdCrossed(): Alert | null {
    const level = this.score.alertLevel();
    if (level === null) return null;
    if (this.alerts.some((a) => a.isOpen() && a.level === level)) return null;
    const alert = new Alert(`${this.id}#${this.alerts.length + 1}`, this.id, level);
    this.alerts.push(alert);
    return alert;
  }
}
