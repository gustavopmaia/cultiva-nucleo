import type { AlertLevel } from "./score.js";

export class Alert {
  closedAt: Date | null = null;

  constructor(
    readonly id: string,
    readonly segmentId: string,
    readonly level: AlertLevel,
  ) {}

  isOpen(): boolean {
    return this.closedAt === null;
  }

  close(at: Date) {
    this.closedAt = at;
  }
}
