import { KmRange } from "../shared/km-range.js";

export class Team {
  constructor(
    readonly name: string,
    readonly territory: KmRange,
  ) {}

  covers(range: KmRange): boolean {
    return this.territory.overlaps(range);
  }
}
