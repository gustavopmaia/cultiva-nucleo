import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const listFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

const moduleOf = (file: string) => {
  const parts = file.split("/").slice(1);
  return parts[0] === "domain" ? `domain/${parts[1]}` : parts[0]!;
};

const edges = new Map<string, number>();
for (const file of listFiles("src").filter((f) => f.endsWith(".ts"))) {
  const from = moduleOf(file);
  const text = readFileSync(file, "utf8");
  for (const [, specifier] of text.matchAll(/from "(\.[^"]+)"/g)) {
    const target = moduleOf(join(file, "..", specifier!));
    if (target === from) continue;
    const key = `${from} -> ${target}`;
    edges.set(key, (edges.get(key) ?? 0) + 1);
  }
}

console.log("| from -> to | imports |\n| --- | --- |");
for (const [edge, count] of [...edges].sort()) console.log(`| ${edge} | ${count} |`);
