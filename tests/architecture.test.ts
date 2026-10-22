import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

const importsOf = (file: string) =>
  [...readFileSync(file, "utf8").matchAll(/from "([^"]+)"/g)].map((match) => match[1]!);

describe("domain isolation", () => {
  const domainFiles = listFiles("src/domain");

  it("domain imports only other domain files", () => {
    const outside = domainFiles.flatMap((file) =>
      importsOf(file).filter((specifier) => !specifier.startsWith(".")),
    );

    expect(outside).toEqual([]);
  });

  it("domain never reaches application or adapters", () => {
    const leaks = domainFiles.flatMap((file) =>
      importsOf(file).filter((s) => /\/(application|adapters)\//.test(s)),
    );

    expect(leaks).toEqual([]);
  });

  it("maintenance depends on monitoring only through the alert level", () => {
    const crossings = listFiles("src/domain/maintenance")
      .flatMap(importsOf)
      .filter((specifier) => specifier.includes("/monitoring/"));

    expect(crossings.sort()).toEqual(["../monitoring/score.js"]);
  });

  it("application does not import adapters", () => {
    const leaks = listFiles("src/application")
      .flatMap(importsOf)
      .filter((specifier) => specifier.includes("/adapters/"));

    expect(leaks).toEqual([]);
  });
});
