export class KmRange {
  constructor(
    readonly start: number,
    readonly end: number,
  ) {
    if (end < start) throw new Error("invalid km range");
  }

  overlaps(outra: KmRange): boolean {
    return this.start <= outra.end && this.end >= outra.start;
  }
}
