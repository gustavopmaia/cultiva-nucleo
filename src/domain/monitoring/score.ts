export type AlertLevel = "attention" | "urgent" | "critical";

const THRESHOLDS: [number, AlertLevel][] = [
  [80, "critical"],
  [55, "urgent"],
  [30, "attention"],
];

export class Score {
  readonly value: number;

  constructor(value: number) {
    this.value = Math.min(100, Math.max(0, value));
  }

  alertLevel(): AlertLevel | null {
    return THRESHOLDS.find(([minimum]) => this.value >= minimum)?.[1] ?? null;
  }
}
